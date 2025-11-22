import type { AlphaStats, ColorReport } from '@shared/types'
import { normaliseSwatches, rgbToHex } from '@/lib/colors'
import { roundTo } from '@/lib/quality'

const MAX_DIMENSION = 1024
const MAX_SAMPLE_PIXELS = 120_000
const BUCKET_SIZE = 20 // Slightly reduced for better color precision
const MIN_ALPHA = 32

// Edge detection threshold - pixels with high contrast to neighbors are "artwork"
const EDGE_THRESHOLD = 30 // Difference in RGB to be considered an edge

interface Bucket {
  r: number
  g: number
  b: number
  count: number
  isEdgePixel: boolean // Track if this color is from artwork vs background
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

// Detect if a pixel is on an edge (part of actual artwork vs background)
function isEdgePixel(
  data: Uint8ClampedArray,
  x: number,
  y: number,
  width: number,
  height: number
): boolean {
  const index = (y * width + x) * 4
  const r = data[index]
  const g = data[index + 1]
  const b = data[index + 2]
  
  // Check neighbors (up, down, left, right)
  const neighbors = [
    { dx: 0, dy: -1 }, // up
    { dx: 0, dy: 1 },  // down
    { dx: -1, dy: 0 }, // left
    { dx: 1, dy: 0 },  // right
  ]
  
  for (const { dx, dy } of neighbors) {
    const nx = x + dx
    const ny = y + dy
    
    // Skip if out of bounds
    if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue
    
    const nIndex = (ny * width + nx) * 4
    const nr = data[nIndex]
    const ng = data[nIndex + 1]
    const nb = data[nIndex + 2]
    
    // Calculate color difference
    const diff = Math.abs(r - nr) + Math.abs(g - ng) + Math.abs(b - nb)
    
    // If any neighbor is significantly different, this is an edge pixel
    if (diff > EDGE_THRESHOLD) {
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
        
        // Detect if this pixel is part of artwork (edge) or background
        const isEdge = isEdgePixel(data, x, y, width, height)
        
        const keyR = Math.round(r / BUCKET_SIZE) * BUCKET_SIZE
        const keyG = Math.round(g / BUCKET_SIZE) * BUCKET_SIZE
        const keyB = Math.round(b / BUCKET_SIZE) * BUCKET_SIZE
        const key = `${keyR}-${keyG}-${keyB}`
        const bucket = buckets.get(key) ?? { r: 0, g: 0, b: 0, count: 0, isEdgePixel: false }
        bucket.r += r
        bucket.g += g
        bucket.b += b
        bucket.count += 1
        // Mark as edge pixel if ANY sample is an edge
        if (isEdge) {
          bucket.isEdgePixel = true
        }
        buckets.set(key, bucket)
      }
    }

    const bucketValues = Array.from(buckets.values())
    if (!bucketValues.length) {
      return { top: [], allGrouped: [] }
    }

    const totalSamples = bucketValues.reduce((sum, bucket) => sum + bucket.count, 0)

    // Separate edge pixels (artwork) from background pixels
    const edgeBuckets = bucketValues.filter(b => b.isEdgePixel)
    const backgroundBuckets = bucketValues.filter(b => !b.isEdgePixel)
    
    // Prioritize edge pixels (artwork colors), then add background if needed
    const prioritizedBuckets = edgeBuckets.length >= 16 
      ? edgeBuckets 
      : [...edgeBuckets, ...backgroundBuckets]
    
    const entries = prioritizedBuckets
      .map((bucket) => {
        const count = bucket.count
        const rgb: [number, number, number] = [
          Math.round(bucket.r / count),
          Math.round(bucket.g / count),
          Math.round(bucket.b / count),
        ]
        const percent = totalSamples > 0 ? (count / totalSamples) * 100 : undefined
        
        // Boost weight for edge pixels (artwork colors)
        const weight = bucket.isEdgePixel ? count * 2 : count
        
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
