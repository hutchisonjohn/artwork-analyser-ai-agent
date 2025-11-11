let pdfjsPromise: Promise<typeof import('pdfjs-dist')> | null = null

export async function loadPdfJs() {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const [pdfjsModule, workerModule] = await Promise.all([
        import('pdfjs-dist'),
        import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
      ])
      const workerSrc = workerModule.default
      pdfjsModule.GlobalWorkerOptions.workerSrc = workerSrc
      return pdfjsModule
    })()
  }
  return pdfjsPromise
}
