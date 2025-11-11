import { z } from 'zod'
import { decodeSecret, encodeSecret } from './services/encryption'

export const PROVIDERS = ['claude', 'openai'] as const
export type Provider = (typeof PROVIDERS)[number]

export const providerSchema = z.enum(PROVIDERS)

export const configSchema = z.object({
  provider: providerSchema.default('claude'),
  model: z.string().min(1).default('claude-3-5-sonnet-latest'),
  embeddingModel: z.string().min(1).default('text-embedding-3-large'),
  apiKey: z.string().optional(),
  systemPrompt: z
    .string()
    .default(
      'You are a print production specialist. Always include print size guidance at 300 and 150 DPI.'
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
