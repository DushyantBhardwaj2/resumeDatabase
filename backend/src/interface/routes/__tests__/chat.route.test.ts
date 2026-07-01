import { describe, it, expect, vi } from 'vitest'
import { Hono } from 'hono'
import { createChatRouter } from '../../../interface/routes/chat'

const SESSION = {
  user: { id: 'user-1', email: 'test@test.com', name: 'Test User' },
  session: { id: 'sess-1', expiresAt: new Date() },
}

function buildApp(parseIntentFn?: ReturnType<typeof vi.fn>) {
  const mockContainer: any = {
    chatUseCases: {
      parseIntent: parseIntentFn ?? vi.fn().mockResolvedValue({
        reply: 'Hello!',
        intent: 'GENERAL_CHAT',
        targetWidget: null,
        extractedData: {},
      }),
    },
  }
  const app = new Hono<{ Variables: any }>()
  app.use('*', async (c, next) => { c.set('session', SESSION); await next() })
  app.route('/', createChatRouter(mockContainer))
  return { app, container: mockContainer }
}

// ── POST /interact ────────────────────────────────────────────────────────────

describe('POST /interact (chat)', () => {
  it('returns AI response on success', async () => {
    const { app } = buildApp()
    const res = await app.request('/interact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hi' }],
        currentState: { phase: 'GREETING' },
      }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.reply).toBe('Hello!')
    expect(body.intent).toBe('GENERAL_CHAT')
  })

  it('passes full request body to chatUseCases.parseIntent', async () => {
    const { app, container } = buildApp()
    const reqBody = {
      messages: [{ role: 'user', content: 'My name is Bob' }],
      currentState: { phase: 'REVIEW_EXPERIENCE' },
      mode: 'ONBOARDING',
    }
    await app.request('/interact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reqBody),
    })
    expect(container.chatUseCases.parseIntent).toHaveBeenCalledWith(reqBody)
  })

  it('returns 500 when parseIntent throws', async () => {
    const { app } = buildApp(vi.fn().mockRejectedValue(new Error('AI failure')))
    const res = await app.request('/interact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [] }),
    })
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body).toHaveProperty('error', 'AI failure')
  })
})
