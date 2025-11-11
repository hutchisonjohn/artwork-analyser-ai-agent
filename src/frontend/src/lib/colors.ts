import type { ColorReport, ColorSwatch } from '@shared/types'

export function rgbToHex(rgb: [number, number, number]): string {
  return `#${rgb.map((value) => value.toString(16).padStart(2, '0')).join('')}`
}

export function createPaletteDownloads(report: ColorReport) {
  const jsonBlob = new Blob([JSON.stringify(report, null, 2)], {
    type: 'application/json',
  })

  const rows = report.top.length ? report.top : report.allGrouped
  const csvRows: string[] = ['hex,percent,count']
  csvRows.push(
    ...rows.map((swatch) => {
      const percent =
        typeof swatch.percent === 'number' ? swatch.percent.toFixed(2) : ''
      const count = swatch.count ?? ''
      return `${swatch.hex},${percent},${count}`
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
