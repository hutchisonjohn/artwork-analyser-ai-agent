import { describe, expect, it } from 'vitest'
import {
  buildRecommendedSizesFromPixels,
  determineQualityRating,
  formatAspectRatio,
} from '../quality'

describe('determineQualityRating', () => {
  it('returns Optimal when dpi is 300 or greater', () => {
    expect(
      determineQualityRating({
        dpi: 320,
        width: 0,
        height: 0,
      })
    ).toBe('Optimal')
  })

  it('returns Good when dpi is between 150 and 299', () => {
    expect(
      determineQualityRating({
        dpi: 180,
        width: 0,
        height: 0,
      })
    ).toBe('Good')
  })

  it('falls back to dimensions when dpi is null', () => {
    expect(
      determineQualityRating({
        dpi: null,
        width: 6200,
        height: 4600,
      })
    ).toBe('Optimal')
  })
})

describe('formatAspectRatio', () => {
  it('returns N/A when width or height is zero', () => {
    expect(formatAspectRatio(0, 100)).toBe('N/A')
  })

  it('returns simplified ratio with decimal representation', () => {
    expect(formatAspectRatio(1920, 1080)).toBe('16:9 (1.78:1)')
  })
})

describe('buildRecommendedSizesFromPixels', () => {
  it('calculates sizes at 300 and 150 dpi', () => {
    const result = buildRecommendedSizesFromPixels(3000, 1500)
    expect(result.at300dpi.w_in).toBe(10)
    expect(result.at150dpi.w_in).toBe(20)
  })
})
