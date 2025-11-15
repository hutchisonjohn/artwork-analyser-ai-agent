import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Context } from 'hono'
import { z } from 'zod'
import {
  configSchema,
  getAppConfig,
  setAppConfig,
  getMaskedConfig,
  type Bindings,
} from './config'
import { runChatCompletion, type ChatRequestPayload } from './services/ai'
import { fetchContextSnippet } from './services/rag'
import { ingestDocument, listDocuments, removeDocument } from './services/docs'
import { searchYouTube, detectTutorialNeed } from './services/youtube'

const chatRequestSchema = z.object({
  question: z.string().min(1),
  quality: z.any(),
  colors: z.any().optional(),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).optional(),
})

const partialConfigSchema = configSchema.partial()

const uploadSchema = z.object({
  filename: z.string().min(1),
  content: z.string().min(1),
})

function requireAdmin(c: Context<{ Bindings: Bindings }>) {
  const expected = c.env.ADMIN_TOKEN
  if (!expected) {
    return true
  }

  const header = c.req.header('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : header
  if (token && token === expected) {
    return true
  }

  const alt = c.req.header('x-admin-token')
  if (alt && alt === expected) {
    return true
  }

  return false
}

export const router = new Hono<{ Bindings: Bindings }>()

router.use(
  '*',
  cors({
    origin: (origin) => origin ?? '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Admin-Token'],
    exposeHeaders: ['Content-Type'],
    maxAge: 86400,
  })
)

router.get('/health', (c) =>
  c.json({ status: 'ok', timestamp: new Date().toISOString() })
)

router.get('/config', async (c) => {
  if (!requireAdmin(c)) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  const config = await getMaskedConfig(c.env)
  return c.json(config)
})

router.put('/config', async (c) => {
  if (!requireAdmin(c)) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  const raw = await c.req.json()
  const parsed = partialConfigSchema.safeParse(raw)
  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400)
  }

  const existing = await getAppConfig(c.env)
  const merged = { ...existing, ...parsed.data }

  if ('apiKey' in parsed.data) {
    const value = parsed.data.apiKey?.trim()
    merged.apiKey = value ? value : existing.apiKey
  }

  const updated = configSchema.parse(merged)

  await setAppConfig(c.env, updated)
  return c.json(await getMaskedConfig(c.env))
})

// Test endpoint to debug RAG retrieval
router.get('/test-rag', async (c) => {
  const question = c.req.query('q') || 'why do halftones matter?'
  const config = await getAppConfig(c.env)
  const context = await fetchContextSnippet(c.env, config, question)
  
  return c.json({
    question,
    contextFound: !!context,
    context: context || 'No context retrieved',
  })
})

router.post('/ai/chat', async (c) => {
  try {
    const raw = await c.req.json()
    const parsed = chatRequestSchema.safeParse(raw)
    if (!parsed.success) {
      return c.json({ error: parsed.error.message }, 400)
    }

    const config = await getAppConfig(c.env)
    const context = await fetchContextSnippet(c.env, config, parsed.data.question)

    console.log(`[CHAT] Question: "${parsed.data.question}"`)
    console.log(`[CHAT] RAG context retrieved: ${context ? 'YES' : 'NO'}`)
    if (context) {
      console.log(`[CHAT] Context preview: ${context.substring(0, 200)}...`)
    }

    const payload: ChatRequestPayload = {
      question: parsed.data.question,
      quality: parsed.data.quality,
      colors: parsed.data.colors,
      context: context ?? undefined,
      history: parsed.data.history,
    }

    const result = await runChatCompletion(c.env, config, payload)
    return c.json(result)
  } catch (err) {
    console.error('Chat error:', err)
    return c.json({ 
      error: err instanceof Error ? err.message : 'Internal server error',
      answer: 'Sorry, I encountered an error processing your question. Please try again.'
    }, 500)
  }
})

router.get('/docs', async (c) => {
  if (!requireAdmin(c)) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  const docs = await listDocuments(c.env)
  return c.json(docs)
})

router.post('/docs', async (c) => {
  if (!requireAdmin(c)) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  const raw = await c.req.json()
  const parsed = uploadSchema.safeParse(raw)
  if (!parsed.success) {
    return c.json({ error: parsed.error.message }, 400)
  }

  const { filename, content } = parsed.data
  const config = await getAppConfig(c.env)
  const chunkCount = await ingestDocument(c.env, config, filename, content)

  return c.json({ success: true, chunks: chunkCount })
})

router.delete('/docs/:source', async (c) => {
  if (!requireAdmin(c)) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  const source = c.req.param('source')
  await removeDocument(c.env, source)
  return c.json({ success: true })
})

// YouTube tutorial search endpoint
router.post('/ai/tutorials', async (c) => {
  try {
    const { question } = await c.req.json()
    
    if (!question || typeof question !== 'string') {
      return c.json({ error: 'Question is required' }, 400)
    }

    const config = await getAppConfig(c.env)
    
    // Check if YouTube API key is configured
    if (!config.youtubeApiKey) {
      return c.json({ 
        error: 'YouTube API not configured',
        fallback: 'Please search YouTube manually for relevant tutorials.'
      }, 503)
    }

    // Detect what tutorial they need
    const searchQuery = detectTutorialNeed(question)
    
    if (!searchQuery) {
      return c.json({ 
        videos: [],
        message: 'No tutorial needed for this question.'
      })
    }

    // Search YouTube
    const result = await searchYouTube(searchQuery, config.youtubeApiKey, 5)
    
    return c.json({
      videos: result.videos,
      query: result.query,
      originalQuestion: question
    })
  } catch (err) {
    console.error('YouTube search error:', err)
    return c.json({ 
      error: err instanceof Error ? err.message : 'Failed to search YouTube',
      fallback: 'Please search YouTube manually for relevant tutorials.'
    }, 500)
  }
})
