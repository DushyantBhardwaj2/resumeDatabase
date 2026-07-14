import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { createResumeRouter } from '../../../interface/routes/resume'

// ── Mocks ──────────────────────────────────────────────────────────────────────

let mockPdfJobId = 'job-123'
let mockJobState = 'completed'
let mockRedisResult: string | null = 'base64-pdf-content'

vi.mock('../../../infrastructure/queue/pdf-queue', () => ({
  addPdfJob: vi.fn().mockImplementation(async () => mockPdfJobId),
  pdfQueue: {
    getJob: vi.fn().mockImplementation(async (id: string) => {
      if (id === 'missing') return null
      return {
        getState: vi.fn().mockResolvedValue(mockJobState),
        failedReason: mockJobState === 'failed' ? 'error message' : undefined,
      }
    }),
  },
}))

vi.mock('../../../infrastructure/queue/redis', () => ({
  redisClient: {
    get: vi.fn().mockImplementation(async () => mockRedisResult),
  },
}))

// ── Test setup ────────────────────────────────────────────────────────────────

const SESSION = {
  user: { id: 'user-1', email: 'test@test.com', name: 'Test User' },
  session: { id: 'sess-1', expiresAt: new Date() },
}

function buildApp(overrides: Record<string, unknown> = {}) {
  const mockContainer: any = {
    latexTemplate: {
      fill: vi.fn().mockReturnValue('latex-source'),
    },
    ...overrides,
  }
  const app = new Hono<{ Variables: any }>()
  app.use('*', async (c, next) => { c.set('session', SESSION); await next() })
  app.route('/', createResumeRouter(mockContainer))
  return { app, container: mockContainer }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /compile-live', () => {
  it('enqueues job and returns jobId', async () => {
    const { app } = buildApp()
    const payload = { templateId: 'ats-clean', profile: { experience: [], projects: [], education: [], skills: { languages: [], frameworks: [], tools: [] } }, selectedBulletIds: {} }
    const res = await app.request('/compile-live', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('jobId', 'job-123')
  })
})

describe('GET /compile-status/:jobId', () => {
  beforeEach(() => { mockJobState = 'completed' })

  it('returns 404 for missing job', async () => {
    const { app } = buildApp()
    const res = await app.request('/compile-status/missing')
    expect(res.status).toBe(404)
    expect(await res.json()).toHaveProperty('status', 'not_found')
  })

  it('returns completed status', async () => {
    const { app } = buildApp()
    const res = await app.request('/compile-status/job-123')
    expect(res.status).toBe(200)
    expect(await res.json()).toHaveProperty('status', 'completed')
  })

  it('returns error when failed', async () => {
    mockJobState = 'failed'
    const { app } = buildApp()
    const res = await app.request('/compile-status/job-123')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('failed')
    expect(body.error).toBe('error message')
  })
})

describe('GET /compile-result/:jobId', () => {
  beforeEach(() => { mockRedisResult = 'base64-pdf-content' })

  it('returns 404 if result not found in redis', async () => {
    mockRedisResult = null
    const { app } = buildApp()
    const res = await app.request('/compile-result/missing')
    expect(res.status).toBe(404)
  })

  it('returns PDF buffer', async () => {
    const { app } = buildApp()
    const res = await app.request('/compile-result/job-123')
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('application/pdf')
    const buffer = await res.arrayBuffer()
    expect(buffer.byteLength).toBeGreaterThan(0)
  })
})
