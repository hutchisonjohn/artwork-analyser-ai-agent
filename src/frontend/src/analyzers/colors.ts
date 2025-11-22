import type { AlphaStats, ColorReport } from '@shared/types'
import { normaliseSwatches, rgbToHex } from '@/lib/colors'
import { roundTo } from '@/lib/quality'

const MAX_DIMENSION = 1024
const MAX_SAMPLE_PIXELS = 120_000
const BUCKET_SIZE = 12 // Reduced from 24 for better color precision
const MIN_ALPHA = 32

// Ignore near-white/background colors (helps with artworks on white backgrounds)
const IGNORE_LIGHT_THRESHOLD = 240 // RGB values above this are considered "background white"
const MIN_SATURATION = 0.08 // Minimum color saturation to be considered (0-1 scale)

interface Bucket {
  r: number
  g: number
  b: number
  count: number
  saturation: number // Track saturation for weighting
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

// Calculate color saturation (HSL saturation)
function calculateSaturation(r: number, g: number, b: number): number {
  const rNorm = r / 255
  const gNorm = g / 255
  const bNorm = b / 255
  
  const max = Math.max(rNorm, gNorm, bNorm)
  const min = Math.min(rNorm, gNorm, bNorm)
  const delta = max - min
  
  if (delta === 0) return 0
  
  const lightness = (max + min) / 2
  const saturation = lightness > 0.5 
    ? delta / (2 - max - min)
    : delta / (max + min)
  
  return saturation
}

// Check if color should be ignored (too close to white/background)
function shouldIgnoreColor(r: number, g: number, b: number): boolean {
  // Ignore near-white colors (common backgrounds)
  if (r >= IGNORE_LIGHT_THRESHOLD && g >= IGNORE_LIGHT_THRESHOLD && b >= IGNORE_LIGHT_THRESHOLD) {
    return true
  }
  
  // Ignore very desaturated colors (grays, beiges)
  const saturation = calculateSaturation(r, g, b)
  if (saturation < MIN_SATURATION) {
    // Allow pure grays/blacks (for artwork with intentional grayscale)
    const isGrayscale = Math.abs(r - g) < 10 && Math.abs(g - b) < 10 && Math.abs(r - b) < 10
    const isDark = Math.max(r, g, b) < 100
    if (!isGrayscale || !isDark) {
      return true
    }
  }
  
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
        
        // Skip background/desaturated colors
        if (shouldIgnoreColor(r, g, b)) {
          continue
        }
        
        const saturation = calculateSaturation(r, g, b)
        const keyR = Math.round(r / BUCKET_SIZE) * BUCKET_SIZE
        const keyG = Math.round(g / BUCKET_SIZE) * BUCKET_SIZE
        const keyB = Math.round(b / BUCKET_SIZE) * BUCKET_SIZE
        const key = `${keyR}-${keyG}-${keyB}`
        const bucket = buckets.get(key) ?? { r: 0, g: 0, b: 0, count: 0, saturation: 0 }
        bucket.r += r
        bucket.g += g
        bucket.b += b
        bucket.count += 1
        bucket.saturation += saturation
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
        const avgSaturation = bucket.saturation / count
        const percent = totalSamples > 0 ? (count / totalSamples) * 100 : undefined
        
        // Weight by both frequency AND saturation (vibrant colors get priority)
        const weight = count * (1 + avgSaturation * 0.5)
        
        return {
          rgb,
          hex: rgbToHex(rgb),
          percent,
          count,
          weight,
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
