import type { Bindings, AppConfig } from '../config'
import { MODEL_CONFIGS } from '../config'
import type { QualityReport, ColorReport } from '@shared/types'
import { searchYouTube, detectTutorialNeed } from './youtube'

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
    /(i'm|i am|my name is) \w+$/i, // Catches "Hi there. I'm Stan"
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
    // Catch greetings with introductions like "Hi I'm Joe" or "Hello, I'm Stan"
    const isPureGreeting = /^(hi|hello|hey|howdy|greetings|good morning|good afternoon|good evening)(\s|,|\.|!)*(\s*(i'm|i am|my name is)\s+\w+)?$/i.test(question.toLowerCase().trim())
    
    if (isPureGreeting) {
      // For pure greetings, NEVER give advice - just ask what they need
      sections.push('\n🚨🚨🚨 CRITICAL INSTRUCTION - THIS IS A GREETING 🚨🚨🚨')
      sections.push('DO NOT GIVE ANY PRINTING ADVICE.')
      sections.push('DO NOT MENTION: DPI, text size, transparency, DTF, UV DTF, printing, quality, resolution.')
      sections.push('DO NOT USE: knowledge base, artwork data, technical information.')
      sections.push('\nRESPOND WITH EXACTLY THIS FORMAT:')
      sections.push('"Hi [name]! I\'m McCarthy, your artwork assistant. Upload an artwork and I\'ll help you analyze it for printing. What can I help you with?"')
      sections.push('\nIf they didn\'t give a name, just say "Hi!" instead of "Hi [name]!"')
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
    sections.push('🚨 CRITICAL: Answer in EXACTLY 3 sentences. NO emojis. NO extra commentary.')
    sections.push('\nUSER QUESTION:')
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
      // If they ask for "optimal" or "max", prioritize 250 DPI (largest optimal size)
      if (lowerQ.includes('optimal') || lowerQ.includes('optimum')) {
        essentialInfo.maxSizeOptimal = quality.pixels && quality.recommendedSizes
          ? `${((quality.pixels.w / 250) * 2.54).toFixed(2)}×${((quality.pixels.h / 250) * 2.54).toFixed(2)} cm (${(quality.pixels.w / 250).toFixed(2)}"×${(quality.pixels.h / 250).toFixed(2)}") at 250 DPI - largest size while maintaining optimal quality (250-300 DPI range)`
          : 'N/A'
      } else {
        // Otherwise, show both 300 and 250 DPI options
        essentialInfo.maxSize300 = quality.recommendedSizes 
          ? `${quality.recommendedSizes.at300dpi.w_cm}×${quality.recommendedSizes.at300dpi.h_cm} cm (${quality.recommendedSizes.at300dpi.w_in}"×${quality.recommendedSizes.at300dpi.h_in}")`
          : 'N/A'
        essentialInfo.maxSize250 = quality.pixels && quality.recommendedSizes
          ? `${((quality.pixels.w / 250) * 2.54).toFixed(2)}×${((quality.pixels.h / 250) * 2.54).toFixed(2)} cm (${(quality.pixels.w / 250).toFixed(2)}"×${(quality.pixels.h / 250).toFixed(2)}")`
          : 'N/A'
      }
    }
    
    // Add transparency/alpha info if they ask about it
    if (lowerQ.includes('transparen') || lowerQ.includes('alpha') || lowerQ.includes('opaque') || lowerQ.includes('channel')) {
      if (quality.alphaStats) {
        essentialInfo.alphaChannel = {
          hasAlpha: quality.hasAlpha,
          transparent: `${quality.alphaStats.transparentCount.toLocaleString()} pixels (${quality.alphaStats.transparentPercent.toFixed(2)}%)`,
          semiTransparent: `${quality.alphaStats.semiTransparentCount.toLocaleString()} pixels (${quality.alphaStats.semiTransparentPercent.toFixed(2)}%)`,
          fullyOpaque: `${quality.alphaStats.opaqueCount.toLocaleString()} pixels (${quality.alphaStats.opaquePercent.toFixed(2)}%)`
        }
      } else {
        essentialInfo.alphaChannel = 'No alpha channel'
      }
    }
    
    // Add ICC/color profile ONLY if they specifically ask about profile/ICC
    if (lowerQ.includes('icc') || lowerQ.includes('profile')) {
      essentialInfo.iccProfile = quality.hasICC ? (quality.iccProfile || 'Embedded') : 'Not embedded'
    }
    
    // Add color palette if they ask about colors/colours (with RGB values)
    if ((lowerQ.includes('color') || lowerQ.includes('colour')) && !lowerQ.includes('profile') && colors && colors.top && colors.top.length > 0) {
      const colorCount = lowerQ.match(/\d+/) ? parseInt(lowerQ.match(/\d+/)![0]) : 5 // Extract number if they ask for specific count
      essentialInfo.colors = colors.top.slice(0, Math.min(colorCount, colors.top.length)).map(c => ({
        hex: c.hex,
        rgb: `RGB(${c.rgb[0]}, ${c.rgb[1]}, ${c.rgb[2]})`,
        percent: `${c.percent.toFixed(1)}%`
      }))
    }
    
    // Add bit depth if they ask
    if (lowerQ.includes('bit') && lowerQ.includes('depth')) {
      essentialInfo.bitDepth = quality.bitDepth || 'Unknown'
    }
    
    // Add aspect ratio if they ask
    if (lowerQ.includes('aspect') && lowerQ.includes('ratio')) {
      essentialInfo.aspectRatio = quality.aspectRatio || 'Unknown'
    }
    
    // Add file format/type if they ask about vector/raster
    if (lowerQ.includes('vector') || lowerQ.includes('raster') || lowerQ.includes('file') && lowerQ.includes('type')) {
      essentialInfo.fileType = quality.pixels ? 'Raster (pixel-based)' : 'Vector'
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
  
  // Check if user is confirming they want tutorials (yes/sure/please/tutorials)
  const isRequestingTutorials = /^(yes|yeah|yep|sure|please|ok|okay|tutorials?|videos?|show me|i('d| would) like|that('d| would) be (great|helpful|nice))(\s|!|\.|,|$)/i.test(payload.question.trim())
  
  // Check if this is a "how to" question that needs tutorial offer
  const tutorialQuery = detectTutorialNeed(payload.question)
  
  // If user is requesting tutorials, check conversation history for the last "how to" question
  if (isRequestingTutorials && config.youtubeApiKey && payload.history && payload.history.length > 0) {
    // Look for the last user message that was a "how to" question
    for (let i = payload.history.length - 1; i >= 0; i--) {
      if (payload.history[i].role === 'user') {
        const lastQuestion = payload.history[i].content
        const lastTutorialQuery = detectTutorialNeed(lastQuestion)
        
        if (lastTutorialQuery) {
          try {
            console.log(`[TUTORIAL] User confirmed, searching for: "${lastTutorialQuery}"`)
            const result = await searchYouTube(lastTutorialQuery, config.youtubeApiKey, 3)
            
            if (result.videos.length > 0) {
              // Replace the answer with tutorial links
              answer = 'Here are some helpful tutorial videos:\n\n'
              result.videos.forEach((video, index) => {
                answer += `${index + 1}. [${video.title}](${video.url})\n`
              })
            }
          } catch (err) {
            console.error('[TUTORIAL] YouTube search failed:', err)
            answer = "I'm having trouble fetching tutorial videos right now. Try searching YouTube for relevant tutorials."
          }
          break
        }
      }
    }
  }
  
  return { answer }
}
