import type { AppConfig, Bindings } from '../config'
import { generateEmbedding } from './embeddings'

interface DocumentSummary {
  source: string
  chunks: number
  updated_at: string
}

const MAX_CHARS_PER_CHUNK = 1000
const MAX_RECENT_RESULTS = 200

function chunkContent(content: string): string[] {
  const paragraphs = content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

  const chunks: string[] = []
  let current = ''

  for (const paragraph of paragraphs) {
    if ((current + '\n\n' + paragraph).length <= MAX_CHARS_PER_CHUNK) {
      current = current ? `${current}\n\n${paragraph}` : paragraph
    } else {
      if (current) {
        chunks.push(current)
      }
      if (paragraph.length > MAX_CHARS_PER_CHUNK) {
        for (let i = 0; i < paragraph.length; i += MAX_CHARS_PER_CHUNK) {
          chunks.push(paragraph.slice(i, i + MAX_CHARS_PER_CHUNK))
        }
        current = ''
      } else {
        current = paragraph
      }
    }
  }

  if (current) {
    chunks.push(current)
  }

  return chunks
}

export async function ingestDocument(
  env: Bindings,
  config: AppConfig,
  source: string,
  content: string
) {
  const chunks = chunkContent(content)
  if (!chunks.length) {
    throw new Error('No usable content found in document.')
  }

  for (const chunk of chunks) {
    const embedding = await generateEmbedding(env, config, chunk)
    await env.DOCS_DB.prepare(
      'INSERT INTO doc_chunks (id, source, text, embedding, updated_at) VALUES (?1, ?2, ?3, ?4, CURRENT_TIMESTAMP)'
    )
      .bind(crypto.randomUUID(), source, chunk, JSON.stringify(embedding))
      .run()
  }

  return chunks.length
}

export async function listDocuments(env: Bindings): Promise<DocumentSummary[]> {
  const result = await env.DOCS_DB.prepare(
    'SELECT source, COUNT(*) as chunks, MAX(updated_at) as updated_at FROM doc_chunks GROUP BY source ORDER BY updated_at DESC'
  ).all<DocumentSummary>()

  if (!result.success) {
    return []
  }

  return result.results
    .map((row) => ({
      source: row.source,
      chunks: Number(row.chunks ?? 0),
      updated_at: row.updated_at ?? new Date().toISOString(),
    }))
    .slice(0, MAX_RECENT_RESULTS)
}

export async function removeDocument(env: Bindings, source: string) {
  await env.DOCS_DB.prepare('DELETE FROM doc_chunks WHERE source = ?1')
    .bind(source)
    .run()
}
