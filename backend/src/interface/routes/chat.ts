import { Hono } from 'hono'
import { container as defaultContainer } from '../../di/container'
import { ChatRepository } from '../../infrastructure/persistence/chat-repository'
import type { Variables } from '../types'
import type { Container } from '../../di/container'

export function createChatRouter(container: Container) {
  const chatRepo = new ChatRepository()

  return new Hono<{ Variables: Variables }>()
    .post('/interact', async (c) => {
      const session = c.get('session')
      if (!session) return c.json({ error: 'Unauthorized' }, 401)
      const body = await c.req.json()
      try {
        const result = await container.chatUseCases.parseIntent(body)
        return c.json(result)
      } catch (err: any) {
        console.error('Chat intent error:', err)
        return c.json({ error: err.message }, 500)
      }
    })
    .post('/save', async (c) => {
      const session = c.get('session')
      if (!session) return c.json({ error: 'Unauthorized' }, 401)
      const { role, content, widget, mode } = await c.req.json() as { role: string; content: string; widget?: string; mode: string }
      if (!role || !content || !mode) return c.json({ error: 'Missing required fields: role, content, mode' }, 400)
      const msg = await chatRepo.save(session.user.id, role, content, widget || null, mode)
      return c.json(msg)
    })
    .get('/history', async (c) => {
      const session = c.get('session')
      if (!session) return c.json({ error: 'Unauthorized' }, 401)
      const mode = c.req.query('mode') || undefined
      const messages = await chatRepo.findByUserId(session.user.id, mode)
      return c.json(messages)
    })
    .delete('/clear', async (c) => {
      const session = c.get('session')
      if (!session) return c.json({ error: 'Unauthorized' }, 401)
      const mode = c.req.query('mode') || undefined
      await chatRepo.clearByUserId(session.user.id, mode)
      return c.json({ success: true })
    })
}

export const chatRouter = createChatRouter(defaultContainer)