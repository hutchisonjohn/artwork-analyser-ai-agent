import type { Bindings, AppConfig } from '../config'
import type { QualityReport, ColorReport } from '@shared/types'

export interface ChatRequestPayload {
  quality: QualityReport
  colors?: ColorReport
  question: string
  context?: string
  history?: Array<{ role: 'user' | 'assistant'; content: string }>
}

export interface ChatResponse {
  answer: string
}

interface WorkersAIChatRequest {
  model: string
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  stream?: boolean
}

interface WorkersAIChatResponse {
  result?: {
    response?: string
    output_text?: string
  }
  response?: {
    messages?: Array<{ role: string; content: string }>
  }
}

function buildSystemMessage(config: AppConfig): string {
  return config.systemPrompt
}

function isGreetingOrGeneral(question: string): boolean {
  const lower = question.toLowerCase().trim()
  
  // Greetings and introductions (always general)
  const greetingPatterns = [
    /^(hi|hello|hey|howdy|greetings|good morning|good afternoon|good evening)/i,
    /^(i have|i've got|i got) (some )?questions?$/i,
    /^(tell me|let me know|i('d| would) like to know) more$/i,
    /^(what can you|can you help)/i,
    /^(i'm|i am|my name is) \w+/i,
  ]
  
  if (greetingPatterns.some(pattern => pattern.test(lower)) || lower.length < 15) {
    return true
  }
  
  // Questions that REQUIRE artwork data (NOT general)
  const requiresArtworkPatterns = [
    // Explicit references to their artwork
    /(my|this|the) (artwork|image|file|design|graphic)/i,
    /what('s| is) (my|the) (dpi|resolution|size)/i,
    
    // Questions about printing "this" or "I"
    /can (i|this) (print|be printed)/i,
    /how (big|large|small) can (i|this)/i,
    /(analyze|check|review|look at) (my|this|the)/i,
    
    // Questions about max size, DPI calculations (implies "my artwork")
    /what (is|are) (the )?max(imum)? (size|print)/i,
    /what (dpi|resolution) (will|would) (i|this) (get|have|be)/i,
    /if (i|it('s| is)) (print|printed) (at|to)/i,
    /what size (gives?|for) (me )?\d+\s?dpi/i,
    
    // Questions about dimensions/calculations
    /at \d+(\.\d+)?\s?(cm|inch|in)/i, // "at 28.5cm"
    /\d+\s?(cm|inch|in) wide/i, // "28.5cm wide"
  ]
  
  // If it requires artwork data, it's NOT general
  if (requiresArtworkPatterns.some(pattern => pattern.test(lower))) {
    return false
  }
  
  // Pure knowledge questions (don't need artwork)
  const pureKnowledgePatterns = [
    /what (is|are) (the )?(minimum|maximum|required|recommended)/i,
    /why (do|does|is|are)/i,
    /how (do|does) (dtf|uv dtf|printing|halftones)/i,
    /what.*problems.*cause/i,
    /tell me about/i,
    /explain/i,
  ]
  
  // If it's a pure knowledge question, it's general
  if (pureKnowledgePatterns.some(pattern => pattern.test(lower))) {
    return true
  }
  
  // Default: if unsure, send artwork data (better to have it and not need it)
  return false
}

function buildUserMessage({ quality, colors, question, context }: ChatRequestPayload): string {
  const sections: string[] = []
  
  // Check if this is a greeting or general question
  const isGreeting = isGreetingOrGeneral(question)
  
  if (isGreeting) {
    // For greetings/general questions, DON'T send the full analysis - just the question
    sections.push('🚫 DO NOT ANALYZE THE ARTWORK. DO NOT USE YOUR GENERAL KNOWLEDGE.')
    sections.push('\nUSER QUESTION:')
    sections.push(question.trim())
    
    if (context) {
      sections.push('\n📚 KNOWLEDGE BASE INFORMATION (USE THIS AND ONLY THIS):')
      sections.push(context)
      sections.push('\n🚨 CRITICAL: Answer using ONLY the information above. Do NOT use your general printing knowledge.')
      sections.push('Extract the relevant facts and present them in 2-3 sentences.')
    } else {
      sections.push('\n📋 INSTRUCTION:')
      sections.push('This is a GENERAL question or greeting. Answer ONLY the question asked.')
      sections.push('DO NOT mention or analyze the uploaded artwork.')
      sections.push('Keep your response to 2-3 sentences maximum.')
      sections.push('If it\'s a greeting, ask what they want to know. If it\'s a technical question, just answer it.')
    }
  } else {
    // For specific questions, send the full analysis
    sections.push('USER QUESTION:')
    sections.push(question.trim())
    sections.push('\nANALYSIS SUMMARY:')
    sections.push(JSON.stringify({ quality, colors }, null, 2))
    if (context) {
      console.log('[AI] Including RAG context in message')
      sections.push('\nKNOWLEDGE CONTEXT:')
      sections.push(context)
    } else {
      console.log('[AI] No RAG context available for this question')
    }
  }
  
  return sections.join('\n')
}

async function callWorkersAI(env: Bindings, config: AppConfig, payload: ChatRequestPayload): Promise<string> {
  const body: WorkersAIChatRequest = {
    model: config.model,
    messages: [
      { role: 'system', content: buildSystemMessage(config) },
      { role: 'user', content: buildUserMessage(payload) },
    ],
  }

  const response = await env.WORKERS_AI.fetch('/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Workers AI request failed: ${response.status} ${text}`)
  }

  const data = (await response.json()) as WorkersAIChatResponse
  return (
    data.result?.response ||
    data.result?.output_text ||
    data.response?.messages?.find((message) => message.role === 'assistant')?.content ||
    ''
  )
}

async function callClaudeAPI(config: AppConfig, payload: ChatRequestPayload): Promise<string> {
  if (!config.apiKey) {
    throw new Error('Claude API key is required but not configured')
  }

  // Build messages array with conversation history
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = []
  
  // Add conversation history if present
  if (payload.history && payload.history.length > 0) {
    messages.push(...payload.history)
  }
  
  // Add the current question
  messages.push({ role: 'user', content: buildUserMessage(payload) })

  const body = {
    model: config.model,
    max_tokens: 200, // Increased to 200 to allow for calculations and complete answers
    messages,
    system: buildSystemMessage(config),
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Claude API request failed: ${response.status} ${text}`)
  }

  const data = await response.json() as any
  return data.content?.[0]?.text || ''
}

export async function runChatCompletion(
  env: Bindings,
  config: AppConfig,
  payload: ChatRequestPayload
): Promise<ChatResponse> {
  if (config.provider !== 'claude') {
    throw new Error(`Provider ${config.provider} not yet implemented`)
  }

  // Use Claude API if key is configured, otherwise fall back to Workers AI
  const answer = config.apiKey 
    ? await callClaudeAPI(config, payload)
    : await callWorkersAI(env, config, payload)
  
  return { answer }
}
