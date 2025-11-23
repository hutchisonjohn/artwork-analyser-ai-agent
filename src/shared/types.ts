export type QualityRating = 'Optimal' | 'Good' | 'Poor'
export type ImageCategory = 'Raster' | 'Vector'

export interface AlphaStats {
  present: boolean
  min: number
  max: number
  transparentPercent: number
  semiTransparentPercent: number
  opaquePercent: number
  transparentCount: number
  semiTransparentCount: number
  opaqueCount: number
  sampleSize: number
}

export interface QualityReport {
  fileType: 'png' | 'pdf'
  fileSizeMB: number
  pixels?: { w: number; h: number }
  dpi?: number | null
  hasICC: boolean
  iccProfile?: string
  bitDepth?: number
  hasAlpha?: boolean
  alphaStats?: AlphaStats
  imageCategory: ImageCategory
  recommendedSizes: {
    at300dpi: { w_in: number; h_in: number; w_cm: number; h_cm: number }
    at250dpi: { w_in: number; h_in: number; w_cm: number; h_cm: number }
    at200dpi: { w_in: number; h_in: number; w_cm: number; h_cm: number }
    at150dpi: { w_in: number; h_in: number; w_cm: number; h_cm: number }
    at100dpi: { w_in: number; h_in: number; w_cm: number; h_cm: number }
    at72dpi: { w_in: number; h_in: number; w_cm: number; h_cm: number }
  }
  aspectRatio: string
  rating: QualityRating
  notes: string[]
}

export interface ColorSwatch {
  rgb: [number, number, number]
  hex: string
  percent?: number
  count?: number
}

export interface ColorReport {
  top: Array<ColorSwatch>
  allGrouped: Array<ColorSwatch>
  alphaStats?: AlphaStats
  downloads?: {
    csvUrl: string
    jsonUrl: string
  }
}

export interface DocChunk {
  id: string
  appId: string
  text: string
  embedding: number[]
  source: string
}
