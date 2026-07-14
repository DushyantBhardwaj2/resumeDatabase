import { describe, it, expect, vi } from 'vitest'
import { Hono } from 'hono'
import { createAiRouter } from '../../../interface/routes/ai'

const SESSION = {
  user: { id: 'user-1', email: 'test@test.com', name: 'Test User' },
  session: { id: 'sess-1', expiresAt: new Date() },
}

function buildApp(overrides: Record<string, unknown> = {}) {
  const mockContainer: any = {
    aiService: {
      generate: vi.fn().mockResolvedValue(JSON.stringify([{ id: '1', text: 'Expanded bullet point', keywords: [] }])),
    },
    ...overrides,
  }
  const app = new Hono<{ Variables: any }>()
  app.use('*', async (c, next) => { c.set('session', SESSION); await next() })
  app.route('/', createAiRouter(mockContainer))
  return { app, container: mockContainer }
}

describe('POST /expand-vault', () => {
  it('returns vaultBullets from expandVault', async () => {
    const { app, container } = buildApp()
    const res = await app.request('/expand-vault', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'EXPERIENCE', title: 'SWE', rawDescription: 'Built stuff' }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.vaultBullets).toHaveLength(1)
    expect(body.vaultBullets[0].text).toBe('Expanded bullet point')
    expect(container.aiService.generate).toHaveBeenCalledOnce()
  })

  it('returns 500 on AI service failure', async () => {
    const { app } = buildApp({
      aiService: {
        generate: vi.fn().mockRejectedValue(new Error('AI down')),
      },
    })
    const res = await app.request('/expand-vault', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'EXPERIENCE', title: 'SWE', rawDescription: 'Built stuff' }),
    })
    expect(res.status).toBe(500)
  })
})
