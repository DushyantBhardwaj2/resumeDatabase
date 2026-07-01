import { Hono } from 'hono'
import { container } from '../../di/container'
import type { Variables } from '../types'

export const chatRouter = new Hono<{ Variables: Variables }>()
  .post('/interact', async (c) => {
    const body = await c.req.json()
    try {
      const result = await container.chatUseCases.parseIntent(body)
      return c.json(result)
    } catch (err: any) {
      console.error("Chat intent error:", err)
      return c.json({ error: err.message }, 500)
    }
  })
