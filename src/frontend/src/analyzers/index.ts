import type { QualityReport, ColorReport } from '@shared/types'
import { analyzePng } from './png'
import { analyzePdf } from './pdf'
import { extractColorReport } from './colors'

export type SupportedArtworkType = 'png' | 'pdf'

export interface ArtworkAnalysis {
  quality: QualityReport
  colors?: ColorReport
}

const PNG_MIME_TYPES = new Set([
  'image/png',
  'image/x-png',
])

const PDF_MIME_TYPES = new Set([
  'application/pdf',
])

function guessTypeFromName(name: string): SupportedArtworkType | null {
  const lower = name.toLowerCase()
  if (lower.endsWith('.png')) return 'png'
  if (lower.endsWith('.pdf')) return 'pdf'
  return null
}

export function detectArtworkType(file: File): SupportedArtworkType | null {
  if (PNG_MIME_TYPES.has(file.type)) return 'png'
  if (PDF_MIME_TYPES.has(file.type)) return 'pdf'
  return guessTypeFromName(file.name)
}

export async function analyzeArtwork(file: File): Promise<ArtworkAnalysis> {
  const type = detectArtworkType(file)
  if (type === 'png') {
    const [quality, colorReport] = await Promise.all([
      analyzePng(file),
      extractColorReport(file).catch(() => null),
    ])
    if (colorReport?.alphaStats) {
      quality.alphaStats = colorReport.alphaStats
    }
    return { quality, colors: colorReport ?? undefined }
  }
  if (type === 'pdf') {
    const quality = await analyzePdf(file)
    return { quality }
  }
  throw new Error('Unsupported file type. Please upload a PNG or PDF artwork file.')
}
