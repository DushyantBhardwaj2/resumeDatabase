import { Hono } from 'hono'
import { container as defaultContainer } from '../../di/container'
import type { Variables } from '../types'
import type { Container } from '../../di/container'

export function createChatRouter(container: Container) {
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
}

export const chatRouter = createChatRouter(defaultContainer)
