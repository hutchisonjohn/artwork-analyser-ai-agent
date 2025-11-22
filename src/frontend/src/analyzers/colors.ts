import type { AlphaStats, ColorReport } from '@shared/types'
import { normaliseSwatches, rgbToHex } from '@/lib/colors'
import { roundTo } from '@/lib/quality'

const MAX_DIMENSION = 1024
const MAX_SAMPLE_PIXELS = 120_000
const BUCKET_SIZE = 20 // Color grouping precision
const MIN_ALPHA = 32

interface Bucket {
  r: number
  g: number
  b: number
  count: number
  saturation: number // HSL saturation for vibrant color detection
}

function createCanvas(width: number, height: number) {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height)
  }
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

async function loadImageElement(url: string): Promise<HTMLImageElement> {
  return await new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = (event) => reject(event)
    image.src = url
  })
}

// Calculate HSL values from RGB (all in 0-1 range)
function rgbToHSL(r: number, g: number, b: number): { h: number; s: number; l: number } {
  const rNorm = r / 255
  const gNorm = g / 255
  const bNorm = b / 255
  
  const max = Math.max(rNorm, gNorm, bNorm)
  const min = Math.min(rNorm, gNorm, bNorm)
  const delta = max - min
  
  // Lightness
  const lightness = (max + min) / 2
  
  // Saturation
  let saturation = 0
  if (delta !== 0) {
    if (lightness < 0.5) {
      saturation = delta / (max + min)
    } else {
      saturation = delta / (2 - max - min)
    }
  }
  
  // Hue (not needed for filtering, but included for completeness)
  let hue = 0
  if (delta !== 0) {
    if (max === rNorm) {
      hue = ((gNorm - bNorm) / delta + (gNorm < bNorm ? 6 : 0)) / 6
    } else if (max === gNorm) {
      hue = ((bNorm - rNorm) / delta + 2) / 6
    } else {
      hue = ((rNorm - gNorm) / delta + 4) / 6
    }
  }
  
  return { h: hue, s: saturation, l: lightness }
}

// Check if color should be filtered out (backgrounds, desaturated colors)
function shouldFilterColor(r: number, g: number, b: number): boolean {
  const hsl = rgbToHSL(r, g, b)
  
  // Filter very light colors (pale backgrounds like #FFFEDD)
  if (hsl.l > 0.95) return true
  
  // Filter very dark colors (dark backgrounds like #03143A)
  if (hsl.l < 0.10) return true
  
  // Filter desaturated colors (grays, near-whites, near-blacks)
  if (hsl.s < 0.10) return true
  
  return false
}

export async function extractColorReport(file: File): Promise<ColorReport> {
  const objectUrl = URL.createObjectURL(file)
  try {
    const image = await loadImageElement(objectUrl)

    const scale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height))
    const width = Math.max(1, Math.round(image.width * scale))
    const height = Math.max(1, Math.round(image.height * scale))

    const canvas = createCanvas(width, height)
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return { top: [], allGrouped: [] }
    }

    ctx.drawImage(image, 0, 0, width, height)
    const { data } = ctx.getImageData(0, 0, width, height)

    const stride = Math.max(1, Math.floor(Math.sqrt((width * height) / MAX_SAMPLE_PIXELS)))
    const buckets = new Map<string, Bucket>()
    let sampleSize = 0
    let transparentCount = 0
    let semiTransparentCount = 0
    let opaqueCount = 0
    let minAlpha = 255
    let maxAlpha = 0

    for (let y = 0; y < height; y += stride) {
      for (let x = 0; x < width; x += stride) {
        const index = (y * width + x) * 4
        const alpha = data[index + 3]

        sampleSize += 1
        if (alpha < minAlpha) {
          minAlpha = alpha
        }
        if (alpha > maxAlpha) {
          maxAlpha = alpha
        }
        if (alpha === 0) {
          transparentCount += 1
        } else if (alpha === 255) {
          opaqueCount += 1
        } else {
          semiTransparentCount += 1
        }

        if (alpha < MIN_ALPHA) {
          continue
        }
        const r = data[index]
        const g = data[index + 1]
        const b = data[index + 2]
        
        // Filter out backgrounds and desaturated colors
        if (shouldFilterColor(r, g, b)) {
          continue
        }
        
        // Calculate HSL for this color
        const hsl = rgbToHSL(r, g, b)
        
        // Additional filter: only keep colors with saturation > 20%
        if (hsl.s < 0.20) {
          continue
        }
        
        const keyR = Math.round(r / BUCKET_SIZE) * BUCKET_SIZE
        const keyG = Math.round(g / BUCKET_SIZE) * BUCKET_SIZE
        const keyB = Math.round(b / BUCKET_SIZE) * BUCKET_SIZE
        const key = `${keyR}-${keyG}-${keyB}`
        const bucket = buckets.get(key) ?? { r: 0, g: 0, b: 0, count: 0, saturation: 0 }
        bucket.r += r
        bucket.g += g
        bucket.b += b
        bucket.count += 1 // No center weighting - treat all pixels equally
        // Track maximum saturation seen for this bucket
        bucket.saturation = Math.max(bucket.saturation, hsl.s)
        buckets.set(key, bucket)
      }
    }

    const bucketValues = Array.from(buckets.values())
    if (!bucketValues.length) {
      return { top: [], allGrouped: [] }
    }

    const totalSamples = bucketValues.reduce((sum, bucket) => sum + bucket.count, 0)

    const entries = bucketValues
      .map((bucket) => {
        const count = bucket.count
        const rgb: [number, number, number] = [
          Math.round(bucket.r / count),
          Math.round(bucket.g / count),
          Math.round(bucket.b / count),
        ]
        const percent = totalSamples > 0 ? (count / totalSamples) * 100 : undefined
        
        // Calculate HSL for sorting
        const hsl = rgbToHSL(rgb[0], rgb[1], rgb[2])
        
        // Weight by saturation × brightness × frequency
        // This prioritizes vibrant, bright colors over dark/dull ones
        const saturationWeight = bucket.saturation
        const brightnessWeight = hsl.l // Favor brighter colors
        const weight = saturationWeight * brightnessWeight * count
        
        return {
          rgb,
          hex: rgbToHex(rgb),
          percent,
          count,
          weight,
          saturation: bucket.saturation,
        }
      })
      .sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0))

    let alphaStats: AlphaStats | undefined
    if (sampleSize > 0) {
      const transparentPercent = roundTo((transparentCount / sampleSize) * 100, 2)
      const semiTransparentPercent = roundTo((semiTransparentCount / sampleSize) * 100, 2)
      const opaquePercent = roundTo((opaqueCount / sampleSize) * 100, 2)
      alphaStats = {
        present: transparentCount > 0 || semiTransparentCount > 0,
        min: minAlpha,
        max: maxAlpha,
        transparentPercent,
        semiTransparentPercent,
        opaquePercent,
        transparentCount,
        semiTransparentCount,
        opaqueCount,
        sampleSize,
      }
    }

    return {
      top: normaliseSwatches(entries.slice(0, 16)), // 16 colors for 4x4 grid
      allGrouped: normaliseSwatches(entries),
      alphaStats,
    }
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
