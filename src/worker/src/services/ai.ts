import type { Bindings, AppConfig } from '../config'
import type { QualityReport, ColorReport } from '@shared/types'

export interface ChatRequestPayload {
  quality: QualityReport
  colors?: ColorReport
  question: string
  context?: string
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

function buildUserMessage({ quality, colors, question, context }: ChatRequestPayload): string {
  const sections: string[] = []
  sections.push('USER QUESTION:')
  sections.push(question.trim())
  sections.push('\nANALYSIS SUMMARY:')
  sections.push(JSON.stringify({ quality, colors }, null, 2))
  if (context) {
    sections.push('\nKNOWLEDGE CONTEXT:')
    sections.push(context)
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

export async function runChatCompletion(
  env: Bindings,
  config: AppConfig,
  payload: ChatRequestPayload
): Promise<ChatResponse> {
  if (config.provider !== 'claude') {
    throw new Error(`Provider ${config.provider} not yet implemented`)
  }

  const answer = await callWorkersAI(env, config, payload)
  return { answer }
}
