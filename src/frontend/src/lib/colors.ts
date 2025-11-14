import type { ColorReport, ColorSwatch, QualityReport } from '@shared/types'

export function rgbToHex(rgb: [number, number, number]): string {
  return `#${rgb.map((value) => value.toString(16).padStart(2, '0')).join('')}`
}

export function createPaletteDownloads(report: ColorReport, quality?: QualityReport, fileName?: string) {
  // Create comprehensive JSON export with all artwork data
  const fullData = {
    fileName: fileName || 'artwork',
    ...(quality && {
      dimensions: {
        pixels: quality.pixels ? `${quality.pixels.w}×${quality.pixels.h}` : 'N/A',
        aspectRatio: quality.aspectRatio || 'N/A',
        bitDepth: quality.bitDepth || 'N/A',
        hasAlpha: quality.hasAlpha || false,
      },
      dpi: quality.pixels && quality.recommendedSizes
        ? Math.round(quality.pixels.w / quality.recommendedSizes.at300dpi.w_in)
        : 'N/A',
      rating: quality.rating || 'Unknown',
      recommendedSizes: quality.recommendedSizes ? {
        at300dpi: `${quality.recommendedSizes.at300dpi.w_in.toFixed(2)}" × ${quality.recommendedSizes.at300dpi.h_in.toFixed(2)}" (${quality.recommendedSizes.at300dpi.w_cm.toFixed(2)} × ${quality.recommendedSizes.at300dpi.h_cm.toFixed(2)} cm)`,
        at150dpi: `${quality.recommendedSizes.at150dpi.w_in.toFixed(2)}" × ${quality.recommendedSizes.at150dpi.h_in.toFixed(2)}" (${quality.recommendedSizes.at150dpi.w_cm.toFixed(2)} × ${quality.recommendedSizes.at150dpi.h_cm.toFixed(2)} cm)`,
      } : undefined,
      iccProfile: quality.hasICC ? (quality.iccProfile || 'Embedded') : 'Not embedded',
      alphaChannel: quality.alphaStats ? {
        semiTransparentPercent: quality.alphaStats.semiTransparentPercent.toFixed(2) + '%',
        transparentCount: quality.alphaStats.transparentCount,
        transparentPercent: quality.alphaStats.transparentPercent.toFixed(2) + '%',
        semiTransparentCount: quality.alphaStats.semiTransparentCount,
        opaqueCount: quality.alphaStats.opaqueCount,
        opaquePercent: quality.alphaStats.opaquePercent.toFixed(2) + '%',
      } : undefined,
    }),
    colors: report,
  }

  const jsonBlob = new Blob([JSON.stringify(fullData, null, 2)], {
    type: 'application/json',
  })

  // Create comprehensive CSV export
  const csvRows: string[] = []
  
  // Header section
  csvRows.push('ARTWORK ANALYSIS REPORT')
  csvRows.push('')
  csvRows.push('File Information')
  csvRows.push(`File Name,${fileName || 'artwork'}`)
  
  if (quality) {
    csvRows.push(`Pixels,${quality.pixels ? `${quality.pixels.w}×${quality.pixels.h}` : 'N/A'}`)
    csvRows.push(`Aspect Ratio,${quality.aspectRatio || 'N/A'}`)
    csvRows.push(`Bit Depth,${quality.bitDepth || 'N/A'}`)
    csvRows.push(`Has Alpha Channel,${quality.hasAlpha ? 'Yes' : 'No'}`)
    csvRows.push(`DPI,${quality.pixels && quality.recommendedSizes ? Math.round(quality.pixels.w / quality.recommendedSizes.at300dpi.w_in) : 'N/A'}`)
    csvRows.push(`Quality Rating,${quality.rating || 'Unknown'}`)
    csvRows.push(`ICC Profile,${quality.hasICC ? (quality.iccProfile || 'Embedded') : 'Not embedded'}`)
    
    if (quality.recommendedSizes) {
      csvRows.push('')
      csvRows.push('Recommended Print Sizes')
      csvRows.push(`300 DPI,"${quality.recommendedSizes.at300dpi.w_in.toFixed(2)}"" × ${quality.recommendedSizes.at300dpi.h_in.toFixed(2)}"" (${quality.recommendedSizes.at300dpi.w_cm.toFixed(2)} × ${quality.recommendedSizes.at300dpi.h_cm.toFixed(2)} cm)"`)
      csvRows.push(`150 DPI,"${quality.recommendedSizes.at150dpi.w_in.toFixed(2)}"" × ${quality.recommendedSizes.at150dpi.h_in.toFixed(2)}"" (${quality.recommendedSizes.at150dpi.w_cm.toFixed(2)} × ${quality.recommendedSizes.at150dpi.h_cm.toFixed(2)} cm)"`)
    }
    
    if (quality.alphaStats) {
      csvRows.push('')
      csvRows.push('Alpha Channel Details')
      csvRows.push('Alpha Range,Transparency,Pixels,Percent')
      csvRows.push(`0,Fully transparent,${quality.alphaStats.transparentCount},${quality.alphaStats.transparentPercent.toFixed(2)}%`)
      csvRows.push(`1-254,Semi transparent,${quality.alphaStats.semiTransparentCount},${quality.alphaStats.semiTransparentPercent.toFixed(2)}%`)
      csvRows.push(`255,Fully opaque,${quality.alphaStats.opaqueCount},${quality.alphaStats.opaquePercent.toFixed(2)}%`)
    }
  }
  
  csvRows.push('')
  csvRows.push('Color Palette')
  csvRows.push('Hex,RGB,Percent,Count')
  
  const rows = report.top.length ? report.top : report.allGrouped
  csvRows.push(
    ...rows.map((swatch) => {
      const percent =
        typeof swatch.percent === 'number' ? swatch.percent.toFixed(2) : ''
      const count = swatch.count ?? ''
      const rgb = `"(${swatch.rgb[0]}, ${swatch.rgb[1]}, ${swatch.rgb[2]})"`
      return `${swatch.hex},${rgb},${percent},${count}`
    })
  )

  const csvBlob = new Blob([csvRows.join('\n')], {
    type: 'text/csv',
  })

  return {
    jsonUrl: URL.createObjectURL(jsonBlob),
    csvUrl: URL.createObjectURL(csvBlob),
  }
}

export function normaliseSwatches(swatches: ColorSwatch[]): ColorSwatch[] {
  return swatches.map((swatch) => ({
    ...swatch,
    hex: swatch.hex.toUpperCase(),
    percent:
      typeof swatch.percent === 'number'
        ? Number(swatch.percent.toFixed(2))
        : swatch.percent,
  }))
}
