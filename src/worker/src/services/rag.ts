import type { AppConfig, Bindings } from '../config'
import { generateEmbedding } from './embeddings'

const MAX_FETCHED_ROWS = 200
const DEFAULT_LIMIT = 5

function cosineSimilarity(a: number[], b: number[]): number {
  const minLength = Math.min(a.length, b.length)
  if (minLength === 0) {
    return 0
  }

  let dot = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < minLength; i += 1) {
    dot += a[i] * b[i]
    normA += a[i] ** 2
    normB += b[i] ** 2
  }

  if (normA === 0 || normB === 0) {
    return 0
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

interface DocRow {
  text: string
  embedding: string
}

export async function fetchContextSnippet(
  env: Bindings,
  config: AppConfig,
  question: string,
  limit = DEFAULT_LIMIT
): Promise<string | null> {
  const queryEmbedding = await generateEmbedding(env, config, question)

  const result = await env.DOCS_DB.prepare(
    'SELECT text, embedding FROM doc_chunks ORDER BY updated_at DESC LIMIT ?1'
  )
    .bind(MAX_FETCHED_ROWS)
    .all<DocRow>()

  console.log(`[RAG] Question: "${question}"`)
  console.log(`[RAG] Found ${result.results?.length || 0} chunks in database`)

  if (!result.success || !result.results.length) {
    console.log('[RAG] No documents found in database')
    return null
  }

  const scored = result.results
    .map((row) => {
      try {
        const vector = JSON.parse(row.embedding) as number[]
        const score = cosineSimilarity(queryEmbedding, vector)
        return { text: row.text, score }
      } catch (error) {
        console.error('Failed to parse embedding', error)
        return null
      }
    })
    .filter((entry): entry is { text: string; score: number } => Boolean(entry))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  console.log(`[RAG] Top ${scored.length} matches:`, scored.map(s => ({ score: s.score.toFixed(3), preview: s.text.substring(0, 100) })))

  if (!scored.length) {
    console.log('[RAG] No scored results')
    return null
  }

  // Lower threshold to 0.3 (30% similarity) for better recall
  if (scored[0].score < 0.3) {
    console.log(`[RAG] Best match score too low: ${scored[0].score.toFixed(3)} (threshold: 0.3)`)
    return null
  }

  console.log(`[RAG] Returning ${scored.length} context chunks`)
  return scored
    .map(
      (entry, index) =>
        `Document ${index + 1} (score ${(entry.score * 100).toFixed(1)}%):\n${entry.text}`
    )
    .join('\n\n')
}
