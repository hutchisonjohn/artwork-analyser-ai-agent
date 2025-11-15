import type { Bindings, AppConfig } from '../config'
import { MODEL_CONFIGS } from '../config'
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
    sections.push('🚫 DO NOT ANALYZE THE ARTWORK. DO NOT GIVE UNSOLICITED ADVICE.')
    sections.push('\nUSER QUESTION:')
    sections.push(question.trim())
    
    // Check if it's a pure greeting (hi, hey, hello) vs a technical question
    const isPureGreeting = /^(hi|hello|hey|howdy|greetings|good morning|good afternoon|good evening)$/i.test(question.toLowerCase().trim())
    
    if (isPureGreeting) {
      // For pure greetings, NEVER give advice - just ask what they need
      sections.push('\n📋 INSTRUCTION:')
      sections.push('This is a GREETING. Respond with ONE sentence asking what they would like help with.')
      sections.push('DO NOT give printing advice. DO NOT mention DPI, text size, or transparency.')
      sections.push('DO NOT use knowledge base information.')
      sections.push('Example: "Hi! What would you like to know about your artwork?"')
    } else if (context) {
      // For technical questions with RAG context
      sections.push('\n📚 KNOWLEDGE BASE INFORMATION (USE THIS AND ONLY THIS):')
      sections.push(context)
      sections.push('\n🚨 CRITICAL: Answer using ONLY the information above. Do NOT use your general printing knowledge.')
      sections.push('Extract the relevant facts and present them in 2-3 sentences.')
    } else {
      // For technical questions without RAG context
      sections.push('\n📋 INSTRUCTION:')
      sections.push('This is a GENERAL technical question. Answer ONLY the question asked.')
      sections.push('DO NOT mention or analyze the uploaded artwork.')
      sections.push('Keep your response to 2-3 sentences maximum.')
    }
  } else {
    // For specific questions, send ONLY what's needed to answer
    sections.push('USER QUESTION:')
    sections.push(question.trim())
    
    // Build minimal data based on what the question asks for
    const lowerQ = question.toLowerCase()
    const essentialInfo: Record<string, any> = {}
    
    // Always include basics for context
    essentialInfo.pixels = `${quality.pixels?.w || 0}×${quality.pixels?.h || 0}`
    essentialInfo.dpi = quality.pixels && quality.recommendedSizes 
      ? Math.round(quality.pixels.w / quality.recommendedSizes.at300dpi.w_in)
      : 0
    
    // Only add size info if they ask about size/max/print
    if (lowerQ.includes('size') || lowerQ.includes('max') || lowerQ.includes('print') || lowerQ.includes('large') || lowerQ.includes('big')) {
      essentialInfo.maxSize300 = quality.recommendedSizes 
        ? `${quality.recommendedSizes.at300dpi.w_cm}×${quality.recommendedSizes.at300dpi.h_cm} cm (${quality.recommendedSizes.at300dpi.w_in}"×${quality.recommendedSizes.at300dpi.h_in}")`
        : 'N/A'
      essentialInfo.maxSize250 = quality.pixels && quality.recommendedSizes
        ? `${((quality.pixels.w / 250) * 2.54).toFixed(2)}×${((quality.pixels.h / 250) * 2.54).toFixed(2)} cm (${(quality.pixels.w / 250).toFixed(2)}"×${(quality.pixels.h / 250).toFixed(2)}")`
        : 'N/A'
    }
    
    // Only add transparency if they ask about it
    if (lowerQ.includes('transparen') || lowerQ.includes('alpha') || lowerQ.includes('opaque')) {
      essentialInfo.transparency = quality.alphaStats 
        ? `${quality.alphaStats.semiTransparentPercent.toFixed(2)}% semi-transparent`
        : 'None'
    }
    
    // Only add ICC if they ask about color/profile
    if (lowerQ.includes('icc') || lowerQ.includes('profile') || lowerQ.includes('color')) {
      essentialInfo.hasICC = quality.hasICC ? 'Yes' : 'No'
    }
    
    sections.push('\nARTWORK DATA (answer using ONLY this):')
    sections.push(JSON.stringify(essentialInfo, null, 2))
    
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

  const modelConfig = MODEL_CONFIGS['claude']

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
    max_tokens: modelConfig.maxTokens,
    messages,
    system: buildSystemMessage(config),
  }

  const response = await fetch(modelConfig.apiEndpoint, {
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

async function callOpenAI(config: AppConfig, payload: ChatRequestPayload): Promise<string> {
  if (!config.apiKey) {
    throw new Error('OpenAI API key is required but not configured')
  }

  const modelConfig = MODEL_CONFIGS[config.provider as keyof typeof MODEL_CONFIGS]
  
  // Build messages array with conversation history
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: buildSystemMessage(config) }
  ]
  
  // Add conversation history if present
  if (payload.history && payload.history.length > 0) {
    messages.push(...payload.history.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content
    })))
  }
  
  // Add the current question
  messages.push({ role: 'user', content: buildUserMessage(payload) })

  const body = {
    model: modelConfig.model,
    max_tokens: modelConfig.maxTokens,
    messages,
    temperature: 0.7,
  }

  const response = await fetch(modelConfig.apiEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`OpenAI API request failed: ${response.status} ${text}`)
  }

  const data = await response.json() as any
  return data.choices?.[0]?.message?.content || ''
}

async function callGemini(config: AppConfig, payload: ChatRequestPayload): Promise<string> {
  if (!config.apiKey) {
    throw new Error('Google API key is required but not configured')
  }

  const modelConfig = MODEL_CONFIGS[config.provider as keyof typeof MODEL_CONFIGS]
  
  // Gemini has a different message format
  const systemInstruction = buildSystemMessage(config)
  const userMessage = buildUserMessage(payload)
  
  // Build conversation history in Gemini format
  const contents: Array<{ role: string; parts: Array<{ text: string }> }> = []
  
  if (payload.history && payload.history.length > 0) {
    payload.history.forEach(msg => {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      })
    })
  }
  
  // Add current question
  contents.push({
    role: 'user',
    parts: [{ text: userMessage }]
  })

  const body = {
    system_instruction: {
      parts: [{ text: systemInstruction }]
    },
    contents,
    generation_config: {
      max_output_tokens: modelConfig.maxTokens,
      temperature: 0.7,
    }
  }

  const response = await fetch(`${modelConfig.apiEndpoint}?key=${config.apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Gemini API request failed: ${response.status} ${text}`)
  }

  const data = await response.json() as any
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

export async function runChatCompletion(
  env: Bindings,
  config: AppConfig,
  payload: ChatRequestPayload
): Promise<ChatResponse> {
  let answer: string

  // Route to appropriate provider
  if (config.provider === 'claude') {
    answer = config.apiKey 
      ? await callClaudeAPI(config, payload)
      : await callWorkersAI(env, config, payload)
  } else if (config.provider === 'openai-gpt4o-mini' || config.provider === 'openai-gpt4o') {
    if (!config.apiKey) {
      throw new Error('OpenAI API key is required but not configured')
    }
    answer = await callOpenAI(config, payload)
  } else if (config.provider === 'google-gemini') {
    if (!config.apiKey) {
      throw new Error('Google API key is required but not configured')
    }
    answer = await callGemini(config, payload)
  } else {
    throw new Error(`Provider ${config.provider} not yet implemented`)
  }
  
  return { answer }
}
