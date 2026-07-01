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
    resumeUseCases: {
      tailorResume: vi.fn().mockResolvedValue({ tailored: true }),
      parseResume: vi.fn().mockResolvedValue({ parsed: true }),
    },
    profileUseCases: {
      getProfile: vi.fn().mockResolvedValue(null),
    },
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

describe('POST /tailor', () => {
  it('calls resumeUseCases.tailorResume and returns result', async () => {
    const { app, container } = buildApp()
    const res = await app.request('/tailor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'SWE', company: 'Google', description: 'JD' }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('tailored', true)
    expect(container.resumeUseCases.tailorResume).toHaveBeenCalledWith(
      'user-1',
      { jobTitle: 'SWE', company: 'Google', jobDescription: 'JD' },
      'nsut-canonical'
    )
  })
})

describe('POST /parse', () => {
  it('returns existing profile if found (fromDb: true)', async () => {
    const existing = { contact: { name: 'Bob' } }
    const { app } = buildApp({ profileUseCases: { getProfile: vi.fn().mockResolvedValue(existing) } })
    const res = await app.request('/parse', { method: 'POST' })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.fromDb).toBe(true)
    expect(body.parsed.contact.name).toBe('Bob')
  })

  it('rejects if no file uploaded', async () => {
    const { app } = buildApp()
    const formData = new FormData()
    const res = await app.request('/parse', {
      method: 'POST',
      body: formData,
    })
    expect(res.status).toBe(400)
    expect(await res.json()).toHaveProperty('error', 'No file uploaded')
  })

  it('rejects if file is not pdf', async () => {
    const { app } = buildApp()
    const formData = new FormData()
    formData.append('file', new File(['test'], 'test.txt', { type: 'text/plain' }))
    const res = await app.request('/parse', {
      method: 'POST',
      body: formData,
    })
    expect(res.status).toBe(400)
    expect(await res.json()).toHaveProperty('error', 'Only PDF files are accepted')
  })

  it('rejects if file is too large', async () => {
    const { app } = buildApp()
    const formData = new FormData()
    const largeContent = new Uint8Array(6 * 1024 * 1024)
    formData.append('file', new File([largeContent], 'test.pdf', { type: 'application/pdf' }))
    const res = await app.request('/parse', {
      method: 'POST',
      body: formData,
    })
    expect(res.status).toBe(400)
    expect(await res.json()).toHaveProperty('error', 'File size exceeds 5MB limit')
  })

  it('calls resumeUseCases.parseResume and returns result', async () => {
    const { app, container } = buildApp()
    const formData = new FormData()
    formData.append('file', new File(['%PDF...'], 'test.pdf', { type: 'application/pdf' }))
    const res = await app.request('/parse', {
      method: 'POST',
      body: formData,
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('parsed', true)
    expect(container.resumeUseCases.parseResume).toHaveBeenCalledOnce()
  })
})

describe('POST /compile-live', () => {
  it('enqueues job and returns jobId', async () => {
    const { app } = buildApp()
    const payload = { templateId: 'ats-clean', profile: {}, selectedBulletIds: {} }
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
