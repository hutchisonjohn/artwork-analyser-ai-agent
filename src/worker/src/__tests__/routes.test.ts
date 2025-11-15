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
  const kv = {
    get: async () => null,
    put: async () => undefined,
    delete: async () => undefined,
    list: async () => ({ keys: [], list_complete: true, cacheStatus: null }),
    getWithMetadata: async () => ({ value: null, metadata: null, cacheStatus: null }),
  } as unknown as KVNamespace

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
  } as unknown as D1PreparedStatement

  const d1 = {
    prepare() {
      return statement
    },
    batch: async () => [],
    dump: async () => new Response(),
    exec: async () => ({ count: 0, duration: 0 }),
  } as unknown as D1Database

  const fetcher = {
    fetch: async () => new Response('{}', {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }),
    connect: () => {
      throw new Error('connect not implemented')
    },
  } as unknown as Fetcher

  return {
    APP_CONFIG: kv,
    DOCS_DB: d1,
    WORKERS_AI: fetcher,
    ADMIN_TOKEN: 'test-token',
    ...overrides,
  } as Bindings
}

describe('router', () => {
  it('responds OK on /health', async () => {
    const env = createMockEnv()
    const request = new Request('http://localhost/health')
    const response = await router.fetch(request, env)
    expect(response.status).toBe(200)
    const payload = await response.json() as { status: string }
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
    const payload = await response.json() as { provider: string }
    expect(payload.provider).toBe('openai-gpt4o-mini') // Updated default provider
  })
})
