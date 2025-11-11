import { describe, expect, it } from 'vitest'
import { router } from '../routes'
import type { Bindings } from '../config'
import type {
  D1Database,
  D1PreparedStatement,
  Fetcher,
  KVNamespace,
} from '@cloudflare/workers-types'

function createMockEnv(overrides: Partial<Bindings> = {}): Bindings {
  const kv: KVNamespace = {
    async get() {
      return null
    },
    async put() {
      return undefined
    },
    async delete() {
      return undefined
    },
    async list() {
      return { keys: [], list_complete: true }
    },
  }

  const statement = {
    bind() {
      return {
        async run() {
          return { success: true }
        },
        async first() {
          return null
        },
        async all() {
          return { results: [] }
        },
      }
    },
  }

  const d1: D1Database = {
    prepare() {
      return statement as unknown as D1PreparedStatement
    },
    async batch() {
      return []
    },
  }

  const fetcher: Fetcher = {
    async fetch() {
      return new Response('{}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    },
  }

  return {
    APP_CONFIG: kv,
    DOCS_DB: d1,
    WORKERS_AI: fetcher,
    ADMIN_TOKEN: 'test-token',
    ...overrides,
  }
}

describe('router', () => {
  it('responds OK on /health', async () => {
    const env = createMockEnv()
    const request = new Request('http://localhost/health')
    const response = await router.fetch(request, env)
    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.status).toBe('ok')
  })

  it('rejects unauthorized access to config', async () => {
    const env = createMockEnv()
    const request = new Request('http://localhost/config')
    const response = await router.fetch(request, env)
    expect(response.status).toBe(401)
  })

  it('allows authorized access to config', async () => {
    const env = createMockEnv()
    const request = new Request('http://localhost/config', {
      headers: {
        Authorization: 'Bearer test-token',
      },
    })
    const response = await router.fetch(request, env)
    expect(response.status).toBe(200)
    const payload = await response.json()
    expect(payload.provider).toBe('claude')
  })
})
