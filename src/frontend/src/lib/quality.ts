import type { QualityRating } from '@shared/types'

export interface DetermineQualityParams {
  dpi: number | null
  width: number
  height: number
}

export const DTF_GUIDELINES = [
  'Keep text ≥ 2.5 mm x-height and hairlines ≥ 0.5 mm for DTF prints.',
  'Avoid semi-transparent layers; use solid colors for best adhesion.',
]

export function roundTo(value: number, decimals = 2): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

function inchesFromPixels(pixels: number, dpi: number): number {
  return pixels / dpi
}

function dimensionsFromPixels(width: number, height: number, dpi: number) {
  const w_in = inchesFromPixels(width, dpi)
  const h_in = inchesFromPixels(height, dpi)
  return {
    w_in: roundTo(w_in),
    h_in: roundTo(h_in),
    w_cm: roundTo(w_in * 2.54),
    h_cm: roundTo(h_in * 2.54),
  }
}

function dimensionsFromInches(widthInches: number, heightInches: number) {
  return {
    w_in: roundTo(widthInches),
    h_in: roundTo(heightInches),
    w_cm: roundTo(widthInches * 2.54),
    h_cm: roundTo(heightInches * 2.54),
  }
}

export function buildRecommendedSizesFromPixels(width: number, height: number) {
  return {
    at300dpi: dimensionsFromPixels(width, height, 300),
    at150dpi: dimensionsFromPixels(width, height, 150),
  }
}

export function buildRecommendedSizesFromPhysical(widthInches: number, heightInches: number) {
  return {
    at300dpi: dimensionsFromInches(widthInches, heightInches),
    at150dpi: dimensionsFromInches(widthInches, heightInches),
  }
}

export function determineQualityRating({
  dpi,
  width,
  height,
}: DetermineQualityParams): QualityRating {
  if (dpi !== null) {
    if (dpi >= 300) return 'Optimal'
    if (dpi >= 150) return 'Good'
    return 'Poor'
  }

  const shortEdge = Math.min(width, height)
  if (shortEdge >= 4500) return 'Optimal'
  if (shortEdge >= 2250) return 'Good'
  return 'Poor'
}

export function createBaseNotes(): string[] {
  return [...DTF_GUIDELINES]
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

export function formatAspectRatio(width: number, height: number): string {
  if (!width || !height) {
    return 'N/A'
  }
  const scale = 1000
  const widthScaled = Math.round(width * scale)
  const heightScaled = Math.round(height * scale)
  const divisor = gcd(widthScaled, heightScaled)
  const ratioWidth = Math.round(widthScaled / divisor)
  const ratioHeight = Math.round(heightScaled / divisor)
  const decimal = roundTo(width / height, 2)
  return `${ratioWidth}:${ratioHeight} (${decimal}:1)`
}
