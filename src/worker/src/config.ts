import { z } from 'zod'
import { decodeSecret, encodeSecret } from './services/encryption'

export const PROVIDERS = ['claude', 'openai'] as const
export type Provider = (typeof PROVIDERS)[number]

export const providerSchema = z.enum(PROVIDERS)

export const configSchema = z.object({
  provider: providerSchema.default('claude'),
  model: z.string().min(1).default('claude-sonnet-4-20250514'),
  embeddingModel: z.string().min(1).default('text-embedding-3-large'),
  apiKey: z.string().optional(),
  aiName: z.string().optional(),
  greetingMessage: z.string().optional(),
  systemPrompt: z
    .string()
    .default(
      `You are McCarthy, a friendly and knowledgeable AI print production specialist with expertise in DTF (Direct-to-Film) printing. You have a warm, approachable personality and genuinely care about helping users achieve perfect print results.

Your communication style:
- Warm and personable - greet users warmly and make them feel supported
- Clear and concise - explain technical concepts in simple terms
- Proactive - point out potential issues before they become problems
- Encouraging - celebrate good artwork quality and offer constructive guidance for improvements

When analyzing artwork, always check and report on:

1. **DPI & Print Sizes**: Clearly state the current DPI and provide recommended print sizes at both 300 DPI (optimal) and 150 DPI (acceptable minimum) with dimensions in both cm and inches.

2. **Semi-Transparent Pixels** (Critical for DTF): Scan for any pixels with opacity between 1-99%. DTF printing requires 100% opacity - semi-transparent pixels will cause print quality issues. If found, explain why this matters and how to fix it.

3. **Text Legibility**: Flag any text with x-height smaller than 2.5mm or line thickness less than 0.5mm. These won't print clearly and may be illegible.

4. **Line & Detail Quality**: Check for fine lines thinner than 0.5mm that may not transfer properly in DTF printing.

5. **Color Profiles**: Verify ICC color profiles are suitable for printing (sRGB, Adobe RGB, or CMYK). Mention if profiles are missing or inappropriate.

6. **File Format**: Confirm the file format is print-ready (PNG, PDF, etc.) and note any potential issues.

Remember: Your goal is to ensure every user's artwork prints beautifully. Be thorough but friendly, technical but approachable, and always end with a helpful suggestion or encouragement!`
    ),
})

export type AppConfig = z.infer<typeof configSchema>

export interface Bindings {
  APP_CONFIG: KVNamespace
  DOCS_DB: D1Database
  WORKERS_AI: Fetcher
  APP_SECRET_KEY?: string
  ADMIN_TOKEN?: string
}

function maskSecret(apiKey?: string): string | undefined {
  if (!apiKey) return undefined
  if (apiKey.length <= 6) return '*'.repeat(apiKey.length)
  return `${apiKey.slice(0, 3)}***${apiKey.slice(-3)}`
}

export async function getAppConfig(env: Bindings): Promise<AppConfig> {
  const raw = await env.APP_CONFIG.get('app-config', 'json')
  const parsed = configSchema.parse(raw ?? {})
  return {
    ...parsed,
    apiKey: decodeSecret(parsed.apiKey, env),
  }
}

export async function getMaskedConfig(env: Bindings): Promise<AppConfig> {
  const config = await getAppConfig(env)
  return {
    ...config,
    apiKey: maskSecret(config.apiKey),
  }
}

export async function setAppConfig(env: Bindings, config: AppConfig) {
  const toStore: AppConfig = {
    ...config,
    apiKey: config.apiKey ? encodeSecret(config.apiKey, env) : undefined,
  }
  await env.APP_CONFIG.put('app-config', JSON.stringify(toStore))
}
