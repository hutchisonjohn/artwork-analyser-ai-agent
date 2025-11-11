import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

const rootDir = fileURLToPath(new URL('./src', import.meta.url))
const sharedDir = fileURLToPath(new URL('../shared', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': rootDir,
      '@shared': sharedDir,
    },
  },
  optimizeDeps: {
    include: ['pdfjs-dist'],
  },
})
