import {
  type ChangeEvent,
  type DragEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { FileBarChart2, Settings, UploadCloud } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { QualityReport, ColorReport } from '@shared/types'
import { analyzeArtwork } from '@/analyzers'
import { createPaletteDownloads } from '@/lib/colors'
import { generateArtworkPreview, type ArtworkPreview } from '@/analyzers/preview'
import AppShell, { type AppSection } from '@/layout/AppShell'
import ArtworkChat from '@/components/ArtworkChat'

interface AnalysisState {
  fileName: string
  quality: QualityReport
  colors?: ColorReport
  preview?: ArtworkPreview
}

interface PaletteDownloads {
  csvUrl: string
  jsonUrl: string
}

interface AdminConfigState {
  provider: 'claude' | 'openai'
  model: string
  embeddingModel: string
  systemPrompt: string
  apiKey?: string
  aiName?: string
  greetingMessage?: string
}

interface DocSummary {
  source: string
  chunks: number
  updated_at: string
}

function parseErrorMessage(value: string): string {
  if (!value) {
    return value
  }
  try {
    const parsed = JSON.parse(value) as { error?: unknown }
    if (parsed && typeof parsed === 'object' && typeof parsed.error === 'string') {
      return parsed.error
    }
  } catch {
    // ignore parse errors
  }
  return value
}

const ALLOWED_MIME_TYPES = new Set(['image/png', 'application/pdf'])
const ALLOWED_EXTENSIONS = ['.png', '.pdf']

interface UploadItem {
  id: string
  name: string
  size: number
  type: string
  status: 'queued' | 'processing' | 'complete' | 'error'
  progress: number
  message?: string
  file?: File
}

const MAX_UPLOAD_HISTORY = 6

function generateId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2)
}

const NAV_ITEMS: Array<{ id: AppSection; label: string; icon: LucideIcon }> = [
  { id: 'analyze', label: 'Analyzer', icon: FileBarChart2 },
  { id: 'admin', label: 'Settings', icon: Settings },
]

const ACCEPTED_DOC_TYPES = ['md', 'markdown', 'txt']
const MAX_DOC_SIZE_BYTES = 1024 * 1024 * 2 // 2 MB ceiling for admin uploads

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  const value = bytes / Math.pow(k, i)
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 1)} ${sizes[i]}`
}

function isAcceptedDoc(fileName: string) {
  const parts = fileName.toLowerCase().split('.')
  if (parts.length < 2) return false
  return ACCEPTED_DOC_TYPES.includes(parts.pop() as string)
}

function formatFileSizeMB(size: number | undefined) {
  if (typeof size !== 'number' || Number.isNaN(size)) return 'N/A'
  return `${size.toFixed(2)} MB`
}

function formatTimestamp(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return date.toLocaleString()
}

function App() {
  const [activeTab, setActiveTab] = useState<AppSection>('analyze')

  const [analysis, setAnalysis] = useState<AnalysisState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [downloads, setDownloads] = useState<PaletteDownloads | null>(null)

  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const [showMagnifier, setShowMagnifier] = useState(false)
  const [magnifierPosition, setMagnifierPosition] = useState({ x: 0, y: 0 })
  const [sliderWidth, setSliderWidth] = useState(0)
  const [isZoomMode, setIsZoomMode] = useState(false)
  const [isAiChatOpen, setIsAiChatOpen] = useState(false)

  const [adminConfig, setAdminConfig] = useState<AdminConfigState | null>(null)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [configLoading, setConfigLoading] = useState(false)
  const [configSaving, setConfigSaving] = useState(false)
  const [adminMessage, setAdminMessage] = useState<string | null>(null)
  const [adminError, setAdminError] = useState<string | null>(null)
  const [adminToken, setAdminToken] = useState('')
  const [rememberToken, setRememberToken] = useState(true)

  const [docs, setDocs] = useState<DocSummary[]>([])
  const [docsLoading, setDocsLoading] = useState(false)
  const [docUploading, setDocUploading] = useState(false)
  const [docProgress, setDocProgress] = useState<number | null>(null)
  const [docMessage, setDocMessage] = useState<string | null>(null)
  const [docMessageTone, setDocMessageTone] = useState<'info' | 'success' | 'error'>('info')
  const docInputRef = useRef<HTMLInputElement | null>(null)
  const [docFile, setDocFile] = useState<File | null>(null)
  const previewCleanupRef = useRef<(() => void) | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [pendingUnlock, setPendingUnlock] = useState(false)
  const unlocked = Boolean(adminConfig)
  const workerBaseUrl = useMemo(() => {
    const raw = import.meta.env.VITE_WORKER_URL
    if (!raw || !raw.trim()) {
      return '/api'
    }
    return raw.trim().replace(/\/$/, '')
  }, [])

  const docMessageClass = useMemo(() => {
    switch (docMessageTone) {
      case 'success':
        return 'text-emerald-500'
      case 'error':
        return 'text-rose-600'
      default:
        return 'text-slate-500'
    }
  }, [docMessageTone])

  useEffect(() => {
    if (!analysis?.colors || analysis.colors.top.length === 0) {
      setDownloads((previous) => {
        if (previous) {
          URL.revokeObjectURL(previous.csvUrl)
          URL.revokeObjectURL(previous.jsonUrl)
        }
        return null
      })
      return
    }

    const next = createPaletteDownloads(analysis.colors)
    setDownloads((previous) => {
      if (previous) {
        URL.revokeObjectURL(previous.csvUrl)
        URL.revokeObjectURL(previous.jsonUrl)
      }
      return next
    })

    return () => {
      URL.revokeObjectURL(next.csvUrl)
      URL.revokeObjectURL(next.jsonUrl)
    }
  }, [analysis])


  const analyzeSelectedFile = useCallback(async (file: File) => {
    setIsLoading(true)
    setError(null)
    setUploadError(null)
    previewCleanupRef.current?.()
    previewCleanupRef.current = null

    try {
      const { quality, colors } = await analyzeArtwork(file)

      let preview: ArtworkPreview | undefined
      try {
        preview = await generateArtworkPreview(file, quality)
      } catch (err) {
        console.warn('Failed to generate artwork preview:', err)
      }
      if (preview) {
        previewCleanupRef.current = preview.cleanup
      }

      setAnalysis({ fileName: file.name, quality, colors, preview })
      return { success: true as const }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unexpected error analysing artwork.'
      setError(message)
      setAnalysis(null)
      return { success: false as const, message }
    } finally {
      setIsLoading(false)
    }
  }, [generateArtworkPreview])

  const handleFilesSelected = useCallback(
    (incoming: FileList | File[] | null) => {
      if (!incoming) {
        return
      }

      const files = Array.from(incoming)
      const accepted: UploadItem[] = []
      const rejected: string[] = []

      for (const file of files) {
        const lower = file.name.toLowerCase()
        const hasValidMime = ALLOWED_MIME_TYPES.has(file.type)
        const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext))
        if (hasValidMime || hasValidExt) {
          accepted.push({
            id: generateId(),
            name: file.name,
            size: file.size,
            type: file.type,
            status: 'queued',
            progress: 0,
            file,
          })
        } else {
          rejected.push(file.name)
        }
      }

      if (rejected.length) {
        setUploadError(
          `Unsupported file type: ${rejected.join(', ')}. Currently only PNG and PDF are supported.`
        )
      } else {
        setUploadError(null)
      }

      if (!accepted.length) {
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
        return
      }

      setUploads((current) => {
        const next = [...accepted, ...current]
        return next.slice(0, MAX_UPLOAD_HISTORY)
      })

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    []
  )

  const processUpload = useCallback(
    async (uploadId: string, file: File) => {
      setUploads((current) =>
        current.map((item) =>
          item.id === uploadId
            ? { ...item, status: 'processing', progress: 25 }
            : item
        )
      )

      const result = await analyzeSelectedFile(file)

      if (result.success) {
        setUploads((current) => current.filter((item) => item.id !== uploadId))
      } else {
        setUploads((current) =>
          current.map((item) =>
            item.id === uploadId
              ? {
                  ...item,
                  status: 'error',
                  progress: 0,
                  message: result.message,
                  file: undefined,
                }
              : item
          )
        )
      }
    },
    [analyzeSelectedFile]
  )

  useEffect(() => {
    if (isLoading) {
      return
    }
    const next = uploads.find((item) => item.status === 'queued' && item.file)
    if (!next || !next.file) {
      return
    }
    void processUpload(next.id, next.file)
  }, [uploads, isLoading, processUpload])

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      setIsDragActive(false)
      if (event.dataTransfer?.files?.length) {
        handleFilesSelected(event.dataTransfer.files)
      }
    },
    [handleFilesSelected]
  )

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragActive(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragActive(false)
  }, [])


  const handleDocFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextFile = event.target.files?.[0] ?? null
      setDocProgress(null)

      if (!nextFile) {
        setDocFile(null)
        return
      }

      if (!isAcceptedDoc(nextFile.name)) {
        setDocFile(null)
        setDocMessage('Only Markdown (.md) or plain text (.txt) files are supported.')
        setDocMessageTone('error')
        event.target.value = ''
        return
      }

      if (nextFile.size > MAX_DOC_SIZE_BYTES) {
        setDocFile(null)
        setDocMessage(
          `Document is too large (${formatBytes(nextFile.size)}). Maximum allowed is ${formatBytes(MAX_DOC_SIZE_BYTES)}.`
        )
        setDocMessageTone('error')
        event.target.value = ''
        return
      }

      setDocFile(nextFile)
      setDocMessage(
        `Ready to upload ${nextFile.name} (${formatBytes(nextFile.size)}).`
      )
      setDocMessageTone('info')
    },
    []
  )

  const buildWorkerUrl = useCallback(
    (path: string) => {
      const normalizedPath = path.startsWith('/') ? path : `/${path}`
      if (workerBaseUrl.startsWith('http')) {
        return `${workerBaseUrl}${normalizedPath}`
      }
      return `${workerBaseUrl}${normalizedPath}`
    },
    [workerBaseUrl]
  )

  const authorizedFetch = useCallback(
    async (path: string, init?: RequestInit) => {
      const headers = new Headers(init?.headers)
      if (adminToken.trim()) {
        const trimmed = adminToken.trim()
        headers.set('Authorization', `Bearer ${trimmed}`)
        headers.set('x-admin-token', trimmed)
      }
      headers.set('Accept', 'application/json')
      return fetch(buildWorkerUrl(path), { ...init, headers })
    },
    [adminToken, buildWorkerUrl]
  )

  const loadAdminConfig = useCallback(async () => {
    if (!adminToken.trim()) {
      setAdminConfig(null)
      setAdminError('Enter the admin token to unlock these settings.')
      return false
    }
    setConfigLoading(true)
    setAdminError(null)
    try {
      const response = await authorizedFetch('/config')
      if (!response.ok) {
        const text = await response.text()
        throw new Error(parseErrorMessage(text) || `Failed to load config (${response.status})`)
      }
      const data = (await response.json()) as AdminConfigState
      setAdminConfig(data)
      setApiKeyInput('')
      setAdminMessage('Configuration loaded.')
      return true
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : 'Unable to load configuration.')
      setAdminConfig(null)
      return false
    } finally {
      setConfigLoading(false)
    }
  }, [adminToken, authorizedFetch])

  const loadDocs = useCallback(async () => {
    if (!adminToken.trim()) {
      setDocs([])
      setDocMessage('Enter the admin token to view documents.')
      setDocMessageTone('info')
      return false
    }
    setDocsLoading(true)
    setDocMessage(null)
    try {
      const response = await authorizedFetch('/docs')
      if (!response.ok) {
        const text = await response.text()
        throw new Error(parseErrorMessage(text) || `Failed to load documents (${response.status})`)
      }
      const data = (await response.json()) as DocSummary[]
      setDocs(data)
      return true
    } catch (err) {
      setDocMessage(err instanceof Error ? err.message : 'Unable to load documents.')
      return false
    } finally {
      setDocsLoading(false)
    }
  }, [adminToken, authorizedFetch])

  useEffect(() => {
    if (activeTab === 'admin') {
      const stored = window.localStorage.getItem('artwork-admin-token')
      if (stored) {
        setAdminToken(stored)
        setPendingUnlock(true)
      }
    }
  }, [activeTab])

  const handleUnlock = useCallback(async () => {
    if (!adminToken.trim()) {
      setAdminError('Enter the admin token to unlock these settings.')
      return
    }
    if (rememberToken) {
      window.localStorage.setItem('artwork-admin-token', adminToken.trim())
    } else {
      window.localStorage.removeItem('artwork-admin-token')
    }
    setAdminMessage(null)
    const loaded = await loadAdminConfig()
    if (loaded) {
      await loadDocs()
    }
  }, [adminToken, rememberToken, loadAdminConfig, loadDocs])

  useEffect(() => {
    if (activeTab === 'admin' && pendingUnlock && adminToken.trim()) {
      void handleUnlock()
      setPendingUnlock(false)
    }
  }, [activeTab, pendingUnlock, adminToken, handleUnlock])

  const handleSaveConfig = useCallback(async () => {
    if (!adminConfig) {
      return
    }

    if (rememberToken) {
      if (adminToken.trim()) {
        window.localStorage.setItem('artwork-admin-token', adminToken.trim())
      } else {
        window.localStorage.removeItem('artwork-admin-token')
      }
    }

    setConfigSaving(true)
    setAdminMessage(null)
    setAdminError(null)

    try {
      const payload: Partial<AdminConfigState> = {
        provider: adminConfig.provider,
        model: adminConfig.model,
        embeddingModel: adminConfig.embeddingModel,
        systemPrompt: adminConfig.systemPrompt,
      }
      if (apiKeyInput.trim()) {
        payload.apiKey = apiKeyInput.trim()
      }

      const response = await authorizedFetch('/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || `Failed to save configuration (${response.status})`)
      }

      const data = (await response.json()) as AdminConfigState
      setAdminConfig(data)
      setApiKeyInput('')
      setAdminMessage('Configuration saved successfully.')
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : 'Unable to save configuration.')
    } finally {
      setConfigSaving(false)
    }
  }, [adminConfig, apiKeyInput, adminToken, rememberToken, authorizedFetch])

  const handleUploadDocument = useCallback(async () => {
    if (!docFile) {
      setDocMessage('Select a .md or .txt file to upload first.')
      setDocMessageTone('error')
      return
    }

    setDocUploading(true)
    setDocProgress(0)
    setDocMessage('Reading document...')
    setDocMessageTone('info')

    try {
      const content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onerror = () => reject(reader.error ?? new Error('Failed to read document.'))
        reader.onabort = () => reject(new Error('Document read aborted.'))
        reader.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.min(80, Math.round((event.loaded / event.total) * 80))
            setDocProgress(percent)
          }
        }
        reader.onload = () => {
          setDocProgress((current) => (current !== null && current > 80 ? current : 80))
          resolve(typeof reader.result === 'string' ? reader.result : '')
        }
        reader.readAsText(docFile)
      })

      setDocMessage('Uploading to worker...')
      setDocMessageTone('info')
      setDocProgress((current) => (current !== null && current > 90 ? current : 90))

      const response = await authorizedFetch('/docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: docFile.name, content }),
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(text || `Failed to upload document (${response.status})`)
      }

      const data = (await response.json()) as { chunks: number }
      setDocProgress(100)
      setDocMessage(`Uploaded ${docFile.name} (${data.chunks} chunks).`)
      setDocMessageTone('success')
      setDocFile(null)
      if (docInputRef.current) {
        docInputRef.current.value = ''
      }
      void loadDocs()
    } catch (err) {
      setDocMessage(err instanceof Error ? err.message : 'Document upload failed.')
      setDocMessageTone('error')
    } finally {
      setDocUploading(false)
      setTimeout(() => setDocProgress(null), 250)
    }
  }, [docFile, loadDocs, authorizedFetch, docInputRef])

  const handleDeleteDocument = useCallback(
    async (source: string) => {
      try {
        const response = await authorizedFetch(`/docs/${encodeURIComponent(source)}`, {
          method: 'DELETE',
        })
        if (!response.ok) {
          const text = await response.text()
          throw new Error(text || `Failed to delete document (${response.status})`)
        }
        setDocMessage(`Removed document ${source}.`)
        void loadDocs()
      } catch (err) {
        setDocMessage(err instanceof Error ? err.message : 'Unable to remove document.')
      }
    },
    [loadDocs, authorizedFetch]
  )

  const providerOptions = useMemo(
    () => [
      { value: 'claude', label: 'Claude (Workers AI)' },
      { value: 'openai', label: 'OpenAI (coming soon)', disabled: true },
    ] as Array<{ value: 'claude' | 'openai'; label: string; disabled?: boolean }>,
    []
  )

  const alphaStats = analysis?.quality.alphaStats ?? analysis?.colors?.alphaStats ?? null
  const preview = analysis?.preview
  const previewDisplay = useMemo(() => {
    if (!preview) {
      return null
    }
    const width = preview.width && preview.width > 0 ? preview.width : 0
    const height = preview.height && preview.height > 0 ? preview.height : 0
    const maxThumb = 240
    if (!width || !height) {
      return {
        width: 160,
        height: 0,
        scalePercent: 25,
      }
    }
    const scale = Math.min(1, maxThumb / Math.max(width, height))
    return {
      width: Math.round(width * scale),
      height: Math.round(height * scale),
      scalePercent: Math.round(scale * 100),
    }
  }, [preview])

  const showPreview = Boolean(preview && previewDisplay)

  // Removed pixelDimensions, fileSummary and originalSize - now using styled info box instead

  useEffect(() => {
    return () => {
      previewCleanupRef.current?.()
      previewCleanupRef.current = null
    }
  }, [])

  return (
    <AppShell
      title="Artwork Analyser"
      subtitle="Artwork Analyser is your digital pre-press assistant — instantly reviewing your artwork for DPI, color profiles, transparency, and print-readiness, so every print comes out perfectly."
      activeSection={activeTab}
      onChangeSection={setActiveTab}
      navItems={NAV_ITEMS}
    >
      {activeTab === 'analyze' ? (
        <>
          <section className="space-y-6">
            {/* Flex container to position upload area and AI side by side */}
            <div className="flex gap-6 items-start justify-center">
              {/* Upload area - always max-w-7xl */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm w-full max-w-7xl">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-col gap-3 flex-1">
                <h2 className="text-2xl font-semibold text-slate-900">Check Your Image Quality</h2>
                    <p className="text-base text-slate-600">
                  Upload your artwork file to see instant print-readiness insights.
                </p>
                  </div>
                  
                  {/* AI Assistant Toggle Button */}
                  {analysis && (
                    <button
                      onClick={() => setIsAiChatOpen(!isAiChatOpen)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                        isAiChatOpen 
                          ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200' 
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                      title={isAiChatOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                      <span className="text-sm font-medium">AI Assistant</span>
                    </button>
                  )}
              </div>

              {uploadError && (
                <p className="mt-3 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {uploadError}
                </p>
              )}

                <div className="mt-6">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                    className={`relative flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition min-h-[400px] ${
                    isDragActive
                      ? 'border-indigo-400 bg-indigo-50'
                      : 'border-slate-300 bg-slate-50 hover:border-indigo-300 hover:bg-white'
                  }`}
                >
                  {showPreview ? (
                    <>
                      {previewDisplay && !isZoomMode && (
                        <div className="relative inline-block">
                          {/* Transparent checkerboard background */}
                          <div 
                            className="absolute inset-0 rounded-md"
                            style={{
                              backgroundImage: `
                                linear-gradient(45deg, #e5e7eb 25%, transparent 25%),
                                linear-gradient(-45deg, #e5e7eb 25%, transparent 25%),
                                linear-gradient(45deg, transparent 75%, #e5e7eb 75%),
                                linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)
                              `,
                              backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                              backgroundSize: '20px 20px',
                              backgroundRepeat: 'repeat',
                              backgroundColor: '#ffffff',
                            }}
                          />
                        <img
                          src={preview?.url ?? ''}
                          alt={analysis?.fileName ? `Preview of ${analysis.fileName}` : 'Preview of uploaded artwork'}
                            onClick={() => setIsZoomMode(true)}
                            className="relative max-h-64 w-auto rounded-md border border-slate-200 object-contain shadow-sm cursor-pointer hover:border-indigo-400 transition"
                          style={{
                            width: previewDisplay.width ? `${previewDisplay.width}px` : undefined,
                            height: previewDisplay.height ? `${previewDisplay.height}px` : undefined,
                          }}
                        />
                          <div className="absolute bottom-2 right-2 bg-slate-900/75 text-white text-xs px-2 py-1 rounded pointer-events-none">
                            Click to zoom
                          </div>
                        </div>
                      )}
                      
                      {/* Full Zoom Mode - overlays the entire dashed container */}
                      {isZoomMode && previewDisplay && (
                        <>
                          {/* Close button */}
                          <button
                            onClick={() => setIsZoomMode(false)}
                            className="absolute top-4 right-4 z-20 bg-white hover:bg-slate-100 text-slate-900 rounded-lg p-2 shadow-lg transition"
                            aria-label="Close zoom"
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                          
                          {/* Zoom container - fills entire dashed area including padding */}
                          <div
                            className="absolute inset-0 z-10 rounded-xl overflow-hidden"
                            style={{ margin: '-2px' }}
                            onMouseEnter={() => setShowMagnifier(true)}
                            onMouseLeave={() => {
                              setShowMagnifier(false)
                              setIsZoomMode(false) // Exit zoom mode when mouse leaves
                            }}
                            onMouseMove={(e) => {
                              const elem = e.currentTarget
                              const { left, top, width, height } = elem.getBoundingClientRect()
                              let x = ((e.clientX - left) / width) * 100
                              let y = ((e.clientY - top) / height) * 100
                              x = Math.max(0, Math.min(100, x))
                              y = Math.max(0, Math.min(100, y))
                              setMagnifierPosition({ x, y })
                            }}
                          >
                            {showMagnifier ? (
                              <div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: '#ffffff' }}>
                                {/* Checkerboard pattern background */}
                                <div
                                  className="absolute inset-0"
                                  style={{
                                    backgroundImage: `
                                      linear-gradient(45deg, #e5e7eb 25%, transparent 25%),
                                      linear-gradient(-45deg, #e5e7eb 25%, transparent 25%),
                                      linear-gradient(45deg, transparent 75%, #e5e7eb 75%),
                                      linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)
                                    `,
                                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                                    backgroundSize: '20px 20px',
                                    backgroundRepeat: 'repeat',
                                  }}
                                />
                                {/* Zoomed image on top */}
                                <div
                                  className="absolute inset-0"
                                  style={{
                                    backgroundImage: `url(${preview?.url ?? ''})`,
                                    backgroundPosition: `${magnifierPosition.x}% ${magnifierPosition.y}%`,
                                    backgroundSize: `${(previewDisplay.width || 0) * 3}px ${(previewDisplay.height || 0) * 3}px`,
                                    backgroundRepeat: 'no-repeat',
                                  }}
                                />
                                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-slate-900/75 text-white text-sm px-3 py-2 rounded pointer-events-none">
                                  Hover to explore • 3x zoom
                                </div>
                              </div>
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/95 text-white text-lg">
                                Hover to zoom in
                              </div>
                            )}
                          </div>
                        </>
                      )}
                      {previewDisplay && analysis?.quality.recommendedSizes && (
                        <>
                          <p className="mt-4 text-sm text-slate-600">
                            Displayed at {previewDisplay.scalePercent}% of original size
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            Original: {analysis.quality.recommendedSizes.at300dpi.w_cm} × {analysis.quality.recommendedSizes.at300dpi.h_cm} cm ({analysis.quality.recommendedSizes.at300dpi.w_in}" × {analysis.quality.recommendedSizes.at300dpi.h_in}")
                          </p>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={handleBrowseClick}
                        disabled={isLoading}
                        className="mt-4 inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isLoading ? 'Processing...' : 'Change Image'}
                      </button>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="h-8 w-8 text-primary" aria-hidden="true" />
                      <p className="mt-3 text-sm font-medium text-slate-800">Upload your image PNG or PDF file and to analyse your artwork quality</p>
                      <button
                        type="button"
                        onClick={handleBrowseClick}
                        disabled={isLoading}
                        className="mt-3 inline-flex items-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isLoading ? 'Processing...' : 'Upload Files'}
                      </button>
                      <p className="mt-4 text-xs text-slate-500">
                        (Support for SVG, EPS, AI, and PSD is coming soon!)
                      </p>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".png,.pdf,image/png,application/pdf"
                    multiple
                    className="hidden"
                    onChange={(event) => handleFilesSelected(event.target.files)}
                    disabled={isLoading}
                  />
                  </div>
                </div>

                {/* Styled info box - shown below upload area when analysis exists */}
                {analysis && (
                  <>
                    <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-blue-900 mb-2">Image Information</h4>
                          <p className="text-sm text-blue-800">
                            Artwork file format: {analysis.quality.pixels ? 'Raster' : 'Vector'}
                          </p>
                          {analysis.quality.recommendedSizes && (
                            <p className="text-sm text-blue-800 mt-1">
                              Optimal print size: {analysis.quality.recommendedSizes.at300dpi.w_cm} × {analysis.quality.recommendedSizes.at300dpi.h_cm} cm ({analysis.quality.recommendedSizes.at300dpi.w_in}" × {analysis.quality.recommendedSizes.at300dpi.h_in}")
                            </p>
                          )}
                          <p className="text-sm text-blue-800 mt-1">
                            Pixels: {analysis.quality.pixels 
                              ? `${analysis.quality.pixels.w} × ${analysis.quality.pixels.h}`
                              : 'Vector / N/A'}
                          </p>
                          <p className="text-sm text-blue-800 mt-1">
                            Aspect ratio: {analysis.quality.aspectRatio}
                          </p>
                          {analysis.quality.alphaStats && (
                            <p className="text-sm text-blue-800 mt-1">
                              Semi-transparent pixels: {analysis.quality.alphaStats.semiTransparentPercent.toFixed(2)}%
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-4xl font-bold text-blue-600">
                            DPI {analysis.quality.pixels && analysis.quality.recommendedSizes
                              ? Math.round(analysis.quality.pixels.w / analysis.quality.recommendedSizes.at300dpi.w_in)
                              : '—'}
                          </div>
                          <div className={`mt-1 text-sm font-semibold ${
                            analysis.quality.rating === 'Optimal' ? 'text-green-600' :
                            analysis.quality.rating === 'Good' ? 'text-blue-600' :
                            'text-orange-600'
                          }`}>
                            {analysis.quality.rating || 'Unknown'} Quality
                          </div>
                        </div>
              </div>
            </div>


                    {/* Interactive DPI Slider */}
                    {analysis.quality.pixels && (() => {
                      const { w: pixelW, h: pixelH } = analysis.quality.pixels
                      const aspectRatio = pixelW / pixelH
                      
                      // Calculate actual DPI breakpoints
                      // Optimal: DPI ≥250 (smallest size)
                      const minWidthCm = (pixelW / 300) * 2.54  // Minimum size at 300 DPI
                      const widthAt250DPI = (pixelW / 250) * 2.54  // Green|Orange border
                      
                      // Good: DPI 200-249
                      const widthAt200DPI = (pixelW / 200) * 2.54  // Orange|Red border
                      
                      // Poor: DPI <200 (largest size)
                      const maxWidthAt72DPI = (pixelW / 72) * 2.54
                      const maxWidthCm = Math.min(40, maxWidthAt72DPI)  // Max at 40cm or 72 DPI
                      
                      // Initialize slider to MIDDLE of green optimal zone (DPI 275 - halfway between 300 and 250)
                      const widthAt275DPI = (pixelW / 275) * 2.54  // Middle of optimal zone
                      if (sliderWidth === 0) {
                        setSliderWidth(widthAt275DPI)
                      }
                      
                      // Calculate DPI at current slider position
                      const sliderHeightCm = sliderWidth / aspectRatio
                      const sliderWidthIn = sliderWidth / 2.54
                      const sliderHeightIn = sliderHeightCm / 2.54
                      const sliderDPI = Math.round(pixelW / sliderWidthIn)
                      
                      // Determine quality based on actual DPI at slider position
                      let sliderQuality = 'Poor'
                      if (sliderDPI >= 250) {
                        sliderQuality = 'Optimal'
                      } else if (sliderDPI >= 200) {
                        sliderQuality = 'Good'
                      }
                      
                      // Calculate color section widths based on ACTUAL DPI ranges
                      const totalRange = maxWidthCm - minWidthCm
                      const greenWidth = ((widthAt250DPI - minWidthCm) / totalRange) * 100  // 300-250 DPI
                      const orangeWidth = ((widthAt200DPI - widthAt250DPI) / totalRange) * 100  // 250-200 DPI
                      const redWidth = ((maxWidthCm - widthAt200DPI) / totalRange) * 100  // 200-72 DPI
                      
                      // Calculate slider position percentage
                      const sliderPercent = ((sliderWidth - minWidthCm) / totalRange) * 100
                      
                      return (
                        <div className="mt-6">
                          <h4 className="text-sm font-semibold text-slate-700 mb-3">Interactive Size Calculator:</h4>
                          
                          {/* Display current slider values */}
                          <div className="mb-4 text-center p-4 rounded-lg bg-slate-50 border border-slate-200">
                            <div className="text-lg font-bold text-slate-800">
                              {sliderWidth.toFixed(1)} × {sliderHeightCm.toFixed(1)} cm
                            </div>
                            <div className="text-sm text-slate-600 mt-1">
                              ({sliderWidthIn.toFixed(2)}" × {sliderHeightIn.toFixed(2)}")
                            </div>
                            <div className="mt-2">
                              <span className="text-2xl font-bold text-slate-900">DPI {sliderDPI}</span>
                              <span className={`ml-3 text-sm font-semibold ${
                                sliderQuality === 'Optimal' ? 'text-green-600' :
                                sliderQuality === 'Good' ? 'text-orange-600' :
                                'text-red-600'
                              }`}>
                                {sliderQuality}
                              </span>
                            </div>
                          </div>
                          
                          {/* Slider - Color sections sized by ACTUAL DPI ranges */}
                          <div className="relative">
                            <div className="flex h-10">
                              {/* Green section: 300-250 DPI (Optimal) */}
                              <div className="bg-green-500" style={{ width: `${greenWidth}%` }}></div>
                              {/* Orange section: 250-200 DPI (Good) */}
                              <div className="bg-orange-500" style={{ width: `${orangeWidth}%` }}></div>
                              {/* Red section: 200-72 DPI (Poor) */}
                              <div className="bg-red-500" style={{ width: `${redWidth}%` }}></div>
                            </div>
                            <input
                              type="range"
                              min={minWidthCm}
                              max={maxWidthCm}
                              step={0.1}
                              value={sliderWidth}
                              onChange={(e) => setSliderWidth(parseFloat(e.target.value))}
                              className="absolute inset-0 w-full h-10 opacity-0 cursor-pointer"
                            />
                            {/* Slider control - white line with arrows */}
                            <div 
                              className="absolute top-0 h-10 flex items-center pointer-events-none"
                              style={{
                                left: `calc(${sliderPercent}% - 12px)`,
                              }}
                            >
                              <div className="flex items-center h-10 px-1">
                                <svg className="w-3 h-3 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <div className="w-1 h-10 bg-white shadow-lg mx-0.5"></div>
                                <svg className="w-3 h-3 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          </div>
                          
                          {/* Slider labels */}
                          <div className="flex justify-between mt-2 text-xs text-slate-500">
                            <span>{minWidthCm.toFixed(1)} cm ({(minWidthCm / 2.54).toFixed(1)}") - DPI 300</span>
                            <span>{maxWidthCm.toFixed(1)} cm ({(maxWidthCm / 2.54).toFixed(1)}") - DPI {Math.round(pixelW / (maxWidthCm / 2.54))}</span>
                          </div>
                          
                          {/* Helper text */}
                          <p className="mt-3 text-center text-sm text-slate-600">
                            Find your optimal DPI and size by adjusting the slider
                          </p>
                        </div>
                      )
                    })()}
                  </>
                )}

            {error && (
                  <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
              </div>

              {/* AI Assistant - appears to the right when open */}
              {analysis && isAiChatOpen && (
                <div className="w-96 flex-shrink-0">
                  <div className="sticky top-20 h-[600px]">
                    <ArtworkChat
                      quality={analysis.quality}
                      colors={analysis.colors}
                      workerUrl={workerBaseUrl}
                      aiName={adminConfig?.aiName || 'McCarthy AI Artwork Assistant'}
                      greetingMessage={adminConfig?.greetingMessage || "Hello! I'm McCarthy, your AI artwork assistant.\n\nI'm here to help you understand your artwork's print quality, DPI, colors, and file specifications.\n\nFeel free to ask me anything about your artwork!"}
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          {analysis ? (
            <section className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <header className="space-y-1">
                <h3 className="text-2xl font-semibold">{analysis.fileName}</h3>
                <p className="text-sm text-slate-500">
                  {analysis.quality.fileType.toUpperCase()} • {formatFileSizeMB(analysis.quality.fileSizeMB)} • Rating:{' '}
                  <span className="font-medium text-primary">{analysis.quality.rating}</span>
                </p>
              </header>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Artwork Technical Specs
                  </h4>
                  <dl className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between text-slate-600">
                      <dt>Artwork file format</dt>
                      <dd>{analysis.quality.pixels ? 'Raster' : 'Vector'}</dd>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <dt className="font-semibold">DPI</dt>
                      <dd className="text-base font-bold text-primary">
                        {analysis.quality.pixels 
                          ? Math.round((analysis.quality.pixels.w / analysis.quality.recommendedSizes.at300dpi.w_in) || 0)
                          : 'N/A'}
                      </dd>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <dt>Pixels</dt>
                      <dd>
                        {analysis.quality.pixels
                          ? `${analysis.quality.pixels.w}×${analysis.quality.pixels.h}`
                          : 'Vector / N/A'}
                      </dd>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <dt>Aspect ratio</dt>
                      <dd>{analysis.quality.aspectRatio}</dd>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <dt>Bit depth</dt>
                      <dd>{analysis.quality.bitDepth ?? 'N/A'}</dd>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <dt>Alpha channel</dt>
                      <dd>{analysis.quality.hasAlpha ? 'Yes' : 'No'}</dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Recommended Print Sizes
                  </h4>
                  <dl className="mt-2 space-y-1 text-sm">
                    <div className="flex justify-between text-slate-600">
                      <dt>300 DPI</dt>
                      <dd>
                        {`${analysis.quality.recommendedSizes.at300dpi.w_in}" × ${analysis.quality.recommendedSizes.at300dpi.h_in}" (${analysis.quality.recommendedSizes.at300dpi.w_cm} × ${analysis.quality.recommendedSizes.at300dpi.h_cm} cm)`}
                      </dd>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <dt>150 DPI</dt>
                      <dd>
                        {`${analysis.quality.recommendedSizes.at150dpi.w_in}" × ${analysis.quality.recommendedSizes.at150dpi.h_in}" (${analysis.quality.recommendedSizes.at150dpi.w_cm} × ${analysis.quality.recommendedSizes.at150dpi.h_cm} cm)`}
                      </dd>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <dt>72 DPI</dt>
                      <dd>
                        {analysis.quality.pixels && analysis.quality.recommendedSizes
                          ? `${((analysis.quality.pixels.w / 72)).toFixed(2)}" × ${((analysis.quality.pixels.h / 72)).toFixed(2)}" (${((analysis.quality.pixels.w / 72) * 2.54).toFixed(2)} × ${((analysis.quality.pixels.h / 72) * 2.54).toFixed(2)} cm)`
                          : 'N/A'}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* ICC Profile Details - separate section */}
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  ICC Profile Details
                </h4>
                <dl className="mt-2 space-y-1 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <dt>ICC profile</dt>
                    <dd>
                      {analysis.quality.hasICC
                        ? analysis.quality.iccProfile ?? 'Embedded'
                        : 'Not embedded'}
                    </dd>
                  </div>
                </dl>
              </div>

              {alphaStats && (
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Alpha Channel Details
                  </h4>
                  <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-3">
                    <div className="flex justify-between text-slate-600">
                      <dt>Sample size</dt>
                      <dd>{alphaStats.sampleSize.toLocaleString()}</dd>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <dt>Minimum value</dt>
                      <dd>{alphaStats.min}</dd>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <dt>Maximum value</dt>
                      <dd>{alphaStats.max}</dd>
                    </div>
                  </dl>
                  <div className="mt-3 overflow-x-auto">
                    <table className="min-w-full divide-y divide-border/60 text-sm">
                      <thead className="bg-muted/20 text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2">Alpha range</th>
                          <th className="px-3 py-2">Transparency</th>
                          <th className="px-3 py-2 text-right">Pixels</th>
                          <th className="px-3 py-2 text-right">Percent</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        <tr>
                          <td className="px-3 py-2 font-medium text-slate-700">0</td>
                          <td className="px-3 py-2">Fully transparent</td>
                          <td className="px-3 py-2 text-right">{alphaStats.transparentCount.toLocaleString()}</td>
                          <td className="px-3 py-2 text-right">{alphaStats.transparentPercent.toFixed(2)}%</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 font-medium text-slate-700">1-254</td>
                          <td className="px-3 py-2">Semi transparent</td>
                          <td className="px-3 py-2 text-right">{alphaStats.semiTransparentCount.toLocaleString()}</td>
                          <td className="px-3 py-2 text-right">{alphaStats.semiTransparentPercent.toFixed(2)}%</td>
                        </tr>
                        <tr>
                          <td className="px-3 py-2 font-medium text-slate-700">255</td>
                          <td className="px-3 py-2">Fully opaque</td>
                          <td className="px-3 py-2 text-right">{alphaStats.opaqueCount.toLocaleString()}</td>
                          <td className="px-3 py-2 text-right">{alphaStats.opaquePercent.toFixed(2)}%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {analysis.colors && analysis.colors.top.length > 0 && (
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        Colour Palette Overview
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Dominant colours detected across the artwork; exported alongside the AI prompt.
                      </p>
                    </div>
                    {downloads && (
                      <div className="flex gap-2 text-xs">
                        <a
                          href={downloads.csvUrl}
                          download={`${analysis.fileName}-palette.csv`}
                          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 transition hover:border-indigo-300"
                        >
                          Download CSV
                        </a>
                        <a
                          href={downloads.jsonUrl}
                          download={`${analysis.fileName}-palette.json`}
                          className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600 transition hover:border-indigo-300"
                        >
                          Download JSON
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {analysis.colors.top.map((swatch) => (
                      <div
                        key={swatch.hex}
                        className="flex flex-col overflow-hidden rounded-lg border border-border/60 bg-background/90"
                      >
                        <div
                          className="h-20 w-full"
                          style={{ backgroundColor: swatch.hex }}
                          aria-hidden="true"
                        />
                        <div className="flex flex-col gap-1 px-3 py-2 text-xs text-muted-foreground">
                          <span className="font-medium text-slate-700">{swatch.hex}</span>
                          {typeof swatch.percent === 'number' && (
                            <span>{swatch.percent.toFixed(2)}% of sampled pixels</span>
                          )}
                          {typeof swatch.count === 'number' && swatch.count > 0 && (
                            <span>{swatch.count} samples</span>
                          )}
                          <span>
                            RGB {`(${swatch.rgb[0]}, ${swatch.rgb[1]}, ${swatch.rgb[2]})`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Important Notes
                </h4>
                <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                  <li><strong>Minimum Text Size:</strong> Text must be at least 8pt (≈2.5mm x-height) for DTF printing. Smaller text may break or become illegible.</li>
                  <li><strong>Minimum Line Thickness:</strong> Lines should be at least 1mm thick for DTF, or 0.5-1mm for UV DTF to avoid patchy or weak areas.</li>
                  <li><strong>Transparency Requirements:</strong> DTF requires 100% opaque pixels. Semi-transparent pixels (1-99% opacity) will cause washed-out colors, poor adhesion, and incomplete edges.</li>
                  <li><strong>Gradients & Fades:</strong> Soft gradients that fade to zero opacity don't work in DTF/UV DTF. Use halftone dots (solid 100% opacity) for smooth transitions.</li>
                  <li><strong>Resolution:</strong> Minimum 300 DPI required. Low-resolution artwork creates fuzzy edges with partial-opacity pixels that won't receive white underbase.</li>
                  <li><strong>Color Profiles:</strong> RGB or CMYK recommended. Avoid unsupported embedded profiles or wide-gamut custom spaces for consistent vibrancy.</li>
                </ul>
              </div>
            </section>
          ) : null}
        </>
      ) : (
        <section className="w-full max-w-5xl grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="space-y-1">
            <h3 className="text-2xl font-semibold">Admin configuration</h3>
            <p className="text-sm text-muted-foreground">
              Update AI provider settings and manage RAG documents. API keys are stored encrypted in KV; leave the field blank to keep the current key unchanged.
            </p>
          </header>

          <div className="grid gap-6 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="grid gap-4">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-slate-700">Admin token</span>
                  <input
                    className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    value={adminToken}
                  onChange={(event) => setAdminToken(event.target.value)}
                    placeholder="Enter admin token to access secured endpoints"
                    type="password"
                  />
                  <label className="mt-1 inline-flex items-center gap-2 text-xs text-slate-500">
                    <input
                      type="checkbox"
                      checked={rememberToken}
                      onChange={(event) => {
                        setRememberToken(event.target.checked)
                        if (!event.target.checked) {
                          window.localStorage.removeItem('artwork-admin-token')
                        } else if (adminToken.trim()) {
                          window.localStorage.setItem('artwork-admin-token', adminToken.trim())
                        }
                      }}
                    />
                    Remember token in this browser
                  </label>
                </label>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => void handleUnlock()}
                  className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={configLoading}
                >
                  {configLoading ? 'Unlocking...' : unlocked ? 'Refresh configuration' : 'Unlock admin panel'}
                </button>
                {adminError && (
                  <span className="text-sm text-destructive" role="alert">
                    {adminError}
                  </span>
                )}
                {adminMessage && unlocked && <span className="text-sm text-slate-500">{adminMessage}</span>}
              </div>
            </div>

            {configLoading && !unlocked ? (
              <p className="text-sm text-slate-500">Loading configuration...</p>
            ) : unlocked && adminConfig ? (
              <div className="grid gap-4">
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-medium text-slate-700">Provider</span>
                    <select
                      className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                      value={adminConfig.provider}
                      onChange={(event) =>
                        setAdminConfig((current) =>
                          current
                            ? {
                                ...current,
                                provider: event.target.value as 'claude' | 'openai',
                              }
                            : current
                        )
                      }
                    >
                      {providerOptions.map((option) => (
                        <option key={option.value} value={option.value} disabled={option.disabled}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-medium text-slate-700">Chat model</span>
                    <input
                      className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                      value={adminConfig.model}
                      onChange={(event) =>
                        setAdminConfig((current) =>
                          current ? { ...current, model: event.target.value } : current
                        )
                      }
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-medium text-slate-700">Embedding model</span>
                    <input
                      className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                      value={adminConfig.embeddingModel}
                      onChange={(event) =>
                        setAdminConfig((current) =>
                          current
                            ? { ...current, embeddingModel: event.target.value }
                            : current
                        )
                      }
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-medium text-slate-700">API key</span>
                    <input
                      className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                      value={apiKeyInput}
                      onChange={(event) => setApiKeyInput(event.target.value)}
                      placeholder={adminConfig.apiKey ? 'Current key hidden - enter to replace' : 'Enter provider API key'}
                      type="password"
                    />
                  </label>
                </div>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-slate-700">System prompt</span>
                  <textarea
                    className="min-h-[120px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    value={adminConfig.systemPrompt}
                    onChange={(event) =>
                      setAdminConfig((current) =>
                        current
                          ? { ...current, systemPrompt: event.target.value }
                          : current
                      )
                    }
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-slate-700">AI Assistant Name</span>
                  <input
                    className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    value={adminConfig.aiName || 'McCarthy AI Artwork Assistant'}
                    onChange={(event) =>
                      setAdminConfig((current) =>
                        current
                          ? { ...current, aiName: event.target.value }
                          : current
                      )
                    }
                    placeholder="McCarthy AI Artwork Assistant"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-slate-700">Greeting Message</span>
                  <textarea
                    className="min-h-[120px] rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                    value={adminConfig.greetingMessage || "Hello! I'm McCarthy, your AI artwork assistant.\n\nI'm here to help you understand your artwork's print quality, DPI, colors, and file specifications.\n\nFeel free to ask me anything about your artwork!"}
                    onChange={(event) =>
                      setAdminConfig((current) =>
                        current
                          ? { ...current, greetingMessage: event.target.value }
                          : current
                      )
                    }
                    placeholder="Separate 3 messages with double line breaks (\\n\\n)"
                  />
                  <p className="text-xs text-slate-500">Tip: Separate your greeting into 3 parts using double line breaks. Each part will appear 2-3 seconds apart with typing animation.</p>
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => void handleSaveConfig()}
                    disabled={configSaving}
                    className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {configSaving ? 'Saving…' : 'Save configuration'}
                  </button>
                  {adminMessage && <span className="text-sm text-slate-500">{adminMessage}</span>}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Enter your admin token above and click "Unlock admin panel" to load configuration settings.
              </p>
            )}
          </div>

          <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Knowledge-base documents
                </h4>
                <p className="text-xs text-slate-500">
                  Upload Markdown or plain text files (max 2 MB); they will be chunked, embedded, and added to the RAG store.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <input
                  ref={docInputRef}
                  type="file"
                  accept=".txt,.md,.markdown,.TXT,.MD,.MARKDOWN"
                  onChange={handleDocFileChange}
                  className="text-xs text-muted-foreground"
                  disabled={!unlocked}
                />
                <button
                  type="button"
                  onClick={() => void handleUploadDocument()}
                  disabled={!unlocked || docUploading || !docFile}
                  className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1 text-xs font-medium transition hover:border-indigo-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {docUploading
                    ? `Uploading${docProgress !== null ? ` ${docProgress}%` : '...'}`
                    : 'Upload'}
                </button>
              </div>

              {docProgress !== null && (
                <div className="h-2 w-full overflow-hidden rounded bg-slate-200">
                  <div
                    className="h-full bg-primary transition-[width] duration-200"
                    style={{ width: `${Math.max(0, Math.min(100, docProgress))}%` }}
                  />
                </div>
              )}
            </div>

            {docMessage && (
              <span className={`text-xs ${docMessageClass}`}>
                {docMessage}
              </span>
            )}

            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="min-w-full divide-y divide-border/70 text-sm">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Document</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Chunks</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Updated</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70 bg-background/60">
                  {docsLoading ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-4 text-center text-muted-foreground">
                        Loading documents...
                      </td>
                    </tr>
                  ) : docs.length ? (
                    docs.map((doc) => (
                      <tr key={doc.source}>
                        <td className="px-3 py-2 font-medium text-slate-700">{doc.source}</td>
                        <td className="px-3 py-2 text-muted-foreground">{doc.chunks}</td>
                        <td className="px-3 py-2 text-muted-foreground">{formatTimestamp(doc.updated_at)}</td>
                        <td className="px-3 py-2 text-right">
                          <button
                            type="button"
                            onClick={() => void handleDeleteDocument(doc.source)}
                            className="rounded-md border border-slate-200 px-2 py-1 text-xs text-destructive transition hover:border-destructive"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-3 py-4 text-center text-muted-foreground">
                        No documents uploaded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </AppShell>
  )
}

export default App

