import type { QualityReport } from '@shared/types'
import { loadPdfJs } from '@/lib/pdf'

export interface ArtworkPreview {
  url: string
  width: number
  height: number
  cleanup: () => void
}

async function loadImage(url: string): Promise<HTMLImageElement> {
  return await new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = (event) => reject(event)
    image.src = url
  })
}

async function generatePngPreview(file: File, report: QualityReport): Promise<ArtworkPreview | undefined> {
  const objectUrl = URL.createObjectURL(file)
  try {
    let width = report.pixels?.w ?? 0
    let height = report.pixels?.h ?? 0

    if (!width || !height) {
      const image = await loadImage(objectUrl)
      width = image.naturalWidth
      height = image.naturalHeight
    }

    return {
      url: objectUrl,
      width,
      height,
      cleanup: () => URL.revokeObjectURL(objectUrl),
    }
  } catch (error) {
    URL.revokeObjectURL(objectUrl)
    throw error
  }
}

async function generatePdfPreview(file: File): Promise<ArtworkPreview | undefined> {
  const data = await file.arrayBuffer()
  const pdfjs = await loadPdfJs()
  const pdf = await pdfjs.getDocument({ data }).promise

  try {
    const page = await pdf.getPage(1)
    const viewport = page.getViewport({ scale: 1 })
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (!context) {
      return undefined
    }

    canvas.width = viewport.width
    canvas.height = viewport.height

    await page.render({ canvas: canvas, canvasContext: context, viewport }).promise
    const url = canvas.toDataURL('image/png')
    return {
      url,
      width: viewport.width,
      height: viewport.height,
      cleanup: () => {
        canvas.width = 0
        canvas.height = 0
      },
    }
  } finally {
    pdf.cleanup()
    pdf.destroy()
  }
}

export async function generateArtworkPreview(
  file: File,
  report: QualityReport
): Promise<ArtworkPreview | undefined> {
  if (report.fileType === 'png') {
    return generatePngPreview(file, report)
  }
  if (report.fileType === 'pdf') {
    return generatePdfPreview(file)
  }
  return undefined
}
