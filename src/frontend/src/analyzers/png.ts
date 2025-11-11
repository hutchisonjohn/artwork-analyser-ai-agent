import type { QualityReport } from '@shared/types'
import {
  buildRecommendedSizesFromPixels,
  createBaseNotes,
  determineQualityRating,
  formatAspectRatio,
  roundTo,
} from '@/lib/quality'

interface PngMetadata {
  width: number
  height: number
  bitDepth: number
  colorType: number
  hasAlpha: boolean
  hasTransparencyChunk: boolean
  dpi: number | null
  iccProfile?: string
}

const PNG_SIGNATURE = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
])

const COLOR_TYPE_ALPHA = new Set([4, 6])

function readUint32BE(buffer: Uint8Array, offset: number): number {
  return (
    (buffer[offset] << 24) |
    (buffer[offset + 1] << 16) |
    (buffer[offset + 2] << 8) |
    buffer[offset + 3]
  ) >>> 0
}

function readString(buffer: Uint8Array, offset: number, length: number): string {
  return new TextDecoder('ascii').decode(buffer.subarray(offset, offset + length))
}

function parsePngMetadata(bytes: Uint8Array): PngMetadata {
  if (bytes.length < 8 || !PNG_SIGNATURE.every((b, i) => bytes[i] === b)) {
    throw new Error('Invalid PNG signature')
  }

  let offset = 8
  let width = 0
  let height = 0
  let bitDepth = 0
  let colorType = 0
  let hasAlpha = false
  let hasTransparencyChunk = false
  let dpi: number | null = null
  let iccProfile: string | undefined

  while (offset < bytes.length) {
    const length = readUint32BE(bytes, offset)
    const type = readString(bytes, offset + 4, 4)
    const dataStart = offset + 8
    const dataEnd = dataStart + length

    if (type === 'IHDR') {
      width = readUint32BE(bytes, dataStart)
      height = readUint32BE(bytes, dataStart + 4)
      bitDepth = bytes[dataStart + 8]
      colorType = bytes[dataStart + 9]
      hasAlpha = COLOR_TYPE_ALPHA.has(colorType)
    } else if (type === 'pHYs') {
      const pixelsPerUnitX = readUint32BE(bytes, dataStart)
      const unitSpecifier = bytes[dataStart + 8]
      if (unitSpecifier === 1 && pixelsPerUnitX > 0) {
        // unit is meters, convert to inches (1 inch = 0.0254 meters)
        const inchesPerMeter = 39.37007874
        dpi = Math.round((pixelsPerUnitX / 1) / inchesPerMeter)
      }
    } else if (type === 'iCCP') {
      const nullIndex = bytes.indexOf(0x00, dataStart)
      if (nullIndex > dataStart) {
        iccProfile = readString(bytes, dataStart, nullIndex - dataStart)
      }
    } else if (type === 'tRNS') {
      hasTransparencyChunk = true
    }

    // move to next chunk (length + chunk type + data + CRC = length + 12)
    offset = dataEnd + 4
    if (type === 'IEND') {
      break
    }
  }

  return {
    width,
    height,
    bitDepth,
    colorType,
    hasAlpha: hasAlpha || hasTransparencyChunk,
    hasTransparencyChunk,
    dpi,
    iccProfile,
  }
}

export async function analyzePng(file: File): Promise<QualityReport> {
  const arrayBuffer = await file.arrayBuffer()
  const bytes = new Uint8Array(arrayBuffer)
  const meta = parsePngMetadata(bytes)

  if (!meta.width || !meta.height) {
    throw new Error('Unable to read PNG dimensions')
  }

  const dpi = meta.dpi ?? null
  const rating = determineQualityRating({
    dpi,
    width: meta.width,
    height: meta.height,
  })

  const notes = createBaseNotes()
  if (dpi === null) {
    notes.push('No embedded DPI value found (pHYs chunk missing).')
  }
  if (meta.hasAlpha) {
    notes.push('Alpha channel detected in artwork.')
  } else {
    notes.push('No alpha channel detected.')
  }
  if (meta.iccProfile) {
    notes.push(`Embedded ICC profile: ${meta.iccProfile}.`)
  } else {
    notes.push('No embedded ICC profile detected.')
  }

  const fileSizeMB = roundTo(file.size / (1024 * 1024), 2)

  return {
    fileType: 'png',
    fileSizeMB,
    pixels: { w: meta.width, h: meta.height },
    dpi,
    hasICC: Boolean(meta.iccProfile),
    iccProfile: meta.iccProfile,
    bitDepth: meta.bitDepth,
    hasAlpha: meta.hasAlpha,
    alphaStats: undefined,
    imageCategory: 'Raster',
    recommendedSizes: buildRecommendedSizesFromPixels(meta.width, meta.height),
    aspectRatio: formatAspectRatio(meta.width, meta.height),
    rating,
    notes,
  }
}
