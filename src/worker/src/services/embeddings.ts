import type { AppConfig, Bindings } from '../config'

interface EmbeddingResponse {
  data?: Array<{
    embedding: number[]
  }>
  result?: {
    embedding: number[]
  }
}

export async function generateEmbedding(
  env: Bindings,
  config: AppConfig,
  text: string
): Promise<number[]> {
  // Use Workers AI run method instead of fetch
  const response = await (env.WORKERS_AI as any).run('@cf/baai/bge-base-en-v1.5', {
    text: [text],
  })

  const vector = response?.data?.[0] || response
  if (!vector || !Array.isArray(vector)) {
    throw new Error('No valid embedding returned from Workers AI')
  }

  return vector
}
