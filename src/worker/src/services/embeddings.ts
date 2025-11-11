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
  const body = {
    model: config.embeddingModel,
    input: [text],
  }

  const response = await env.WORKERS_AI.fetch('/v1/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const payload = await response.text()
    throw new Error(`Embedding request failed: ${response.status} ${payload}`)
  }

  const data = (await response.json()) as EmbeddingResponse
  const vector = data.result?.embedding || data.data?.[0]?.embedding
  if (!vector || !vector.length) {
    throw new Error('No embedding returned from Workers AI')
  }

  return vector
}
