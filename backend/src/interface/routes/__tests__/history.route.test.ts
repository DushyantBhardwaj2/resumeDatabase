import { describe, it, expect, vi } from 'vitest'
import { Hono } from 'hono'
import { createHistoryRouter } from '../../../interface/routes/history'

const SESSION = {
  user: { id: 'user-1', email: 'test@test.com', name: 'Test User' },
  session: { id: 'sess-1', expiresAt: new Date() },
}

const HISTORY_ITEM = { id: 'h-1', companyName: 'Google', jobTitle: 'SWE', tailoredData: {} }

function buildApp(historyUseCases: Record<string, unknown> = {}) {
  const mockContainer: any = {
    historyUseCases: {
      list: vi.fn().mockResolvedValue([HISTORY_ITEM]),
      get: vi.fn().mockResolvedValue(HISTORY_ITEM),
      delete: vi.fn().mockResolvedValue(undefined),
      updateStyling: vi.fn().mockResolvedValue(undefined),
      ...historyUseCases,
    },
  }
  const app = new Hono<{ Variables: any }>()
  app.use('*', async (c, next) => { c.set('session', SESSION); await next() })
  app.route('/', createHistoryRouter(mockContainer))
  return { app, container: mockContainer }
}

// ── GET / ─────────────────────────────────────────────────────────────────────

describe('GET / (history)', () => {
  it('returns list of history items', async () => {
    const { app, container } = buildApp()
    const res = await app.request('/')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveLength(1)
    expect(body[0].companyName).toBe('Google')
    expect(container.historyUseCases.list).toHaveBeenCalledWith('user-1')
  })
})

// ── GET /:id ──────────────────────────────────────────────────────────────────

describe('GET /:id (history)', () => {
  it('returns the item when found', async () => {
    const { app } = buildApp()
    const res = await app.request('/h-1')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe('h-1')
  })

  it('returns 404 when item not found', async () => {
    const { app } = buildApp({ get: vi.fn().mockResolvedValue(null) })
    const res = await app.request('/nonexistent')
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body).toHaveProperty('error', 'Not found')
  })
})

// ── DELETE /:id ───────────────────────────────────────────────────────────────

describe('DELETE /:id (history)', () => {
  it('deletes the item and returns success', async () => {
    const { app, container } = buildApp()
    const res = await app.request('/h-1', { method: 'DELETE' })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ success: true })
    expect(container.historyUseCases.delete).toHaveBeenCalledWith('h-1', 'user-1')
  })
})

// ── PATCH /:id ────────────────────────────────────────────────────────────────

describe('PATCH /:id (history)', () => {
  it('updates styling and returns success', async () => {
    const { app, container } = buildApp()
    const styling = { color: '#1a1a2e' }
    const res = await app.request('/h-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(styling),
    })
    expect(res.status).toBe(200)
    expect(container.historyUseCases.updateStyling).toHaveBeenCalledWith('h-1', 'user-1', styling)
  })
})

// ── PUT /:id/styling ──────────────────────────────────────────────────────────

describe('PUT /:id/styling (history)', () => {
  it('updates styling via PUT route and returns success', async () => {
    const { app, container } = buildApp()
    const styling = { font: 'Inter', spacing: 1.5 }
    const res = await app.request('/h-1/styling', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(styling),
    })
    expect(res.status).toBe(200)
    expect(container.historyUseCases.updateStyling).toHaveBeenCalledWith('h-1', 'user-1', styling)
  })
})
