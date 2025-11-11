import type { QualityReport } from '@shared/types'
import {
  buildRecommendedSizesFromPhysical,
  createBaseNotes,
  determineQualityRating,
  formatAspectRatio,
  roundTo,
} from '@/lib/quality'
import { loadPdfJs } from '@/lib/pdf'

export async function analyzePdf(file: File): Promise<QualityReport> {
  const data = await file.arrayBuffer()
  const pdfjs = await loadPdfJs()
  const pdf = await pdfjs.getDocument({ data }).promise

  try {
    const page = await pdf.getPage(1)
    const viewport = page.getViewport({ scale: 1 })

    const widthPoints = viewport.width
    const heightPoints = viewport.height
    const widthInches = widthPoints / 72
    const heightInches = heightPoints / 72

    const notes = createBaseNotes()
    notes.push(
      'Vector PDF detected. DPI and scaling are determined at print time; verify artwork before rasterization.'
    )

    const fileSizeMB = roundTo(file.size / (1024 * 1024), 2)

    const widthPx = Math.round(widthInches * 300)
    const heightPx = Math.round(heightInches * 300)

    return {
      fileType: 'pdf',
      fileSizeMB,
      pixels: undefined,
      dpi: null,
      hasICC: false,
      bitDepth: undefined,
      hasAlpha: false,
      iccProfile: undefined,
      alphaStats: undefined,
      imageCategory: 'Vector',
      recommendedSizes: buildRecommendedSizesFromPhysical(widthInches, heightInches),
      aspectRatio: formatAspectRatio(widthPoints, heightPoints),
      rating: determineQualityRating({ dpi: null, width: widthPx, height: heightPx }),
      notes,
    }
  } finally {
    pdf.cleanup()
    pdf.destroy()
  }
}

