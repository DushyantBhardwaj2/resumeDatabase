import { describe, it, expect, vi } from 'vitest'
import { Hono } from 'hono'
import { createChatRouter } from '../../../interface/routes/chat'

const SESSION = {
  user: { id: 'user-1', email: 'test@test.com', name: 'Test User' },
  session: { id: 'sess-1', expiresAt: new Date() },
}

function buildApp(interactFn?: ReturnType<typeof vi.fn>) {
  const mockContainer: any = {
    chatUseCases: {
      interact: interactFn ?? vi.fn().mockResolvedValue({
        reply: 'Hello!',
        type: 'text',
        intent: 'GENERAL_CHAT',
      }),
    },
    chatRepository: {
      save: vi.fn().mockResolvedValue({ id: 'msg-1', content: 'saved' }),
      findByUserId: vi.fn().mockResolvedValue([]),
    }
  }
  const app = new Hono<{ Variables: any }>()
  app.use('*', async (c, next) => { c.set('session', SESSION); await next() })
  app.route('/', createChatRouter(mockContainer))
  return { app, container: mockContainer }
}

describe('POST /interact (chat)', () => {
  it('returns AI response on success', async () => {
    const { app } = buildApp()
    const res = await app.request('/interact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Hello',
      }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.reply).toBe('Hello!')
    expect(body.intent).toBe('GENERAL_CHAT')
  })

  it('passes request fields to chatUseCases.interact', async () => {
    const { app, container } = buildApp()
    const reqBody = {
      message: 'My name is Bob',
      activeDraftId: 'draft-abc'
    }
    await app.request('/interact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reqBody),
    })
    expect(container.chatUseCases.interact).toHaveBeenCalledWith(reqBody, 'user-1')
  })

  it('returns 500 when interact throws', async () => {
    const { app } = buildApp(vi.fn().mockRejectedValue(new Error('AI failure')))
    const res = await app.request('/interact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hi' }),
    })
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body).toHaveProperty('error', 'AI failure')
  })
})
