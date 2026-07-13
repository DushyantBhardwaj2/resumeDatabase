import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { logger } from '../../infrastructure/logger'
import { container as defaultContainer } from '../../di/container'
import type { Variables } from '../types'
import type { Container } from '../../di/container'

const saveMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1),
  widget: z.string().nullable().optional(),
  mode: z.enum(['ONBOARDING', 'BUILDER', 'DASHBOARD', 'TAILOR', 'PROFILE']),
})

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
        logger.error({ err }, 'Chat intent error')
        return c.json({ error: err.message }, 500)
      }
    })
    .post('/save', zValidator('json', saveMessageSchema), async (c) => {
      const session = c.get('session')
      if (!session) return c.json({ error: 'Unauthorized' }, 401)
      const { role, content, widget, mode } = c.req.valid('json')
      const msg = await container.chatRepository.save(session.user.id, role, content, widget || null, mode)
      return c.json(msg)
    })
    .get('/history', async (c) => {
      const session = c.get('session')
      if (!session) return c.json({ error: 'Unauthorized' }, 401)
      const mode = c.req.query('mode') || undefined
      const messages = await container.chatRepository.findByUserId(session.user.id, mode)
      return c.json(messages)
    })
    .delete('/clear', async (c) => {
      const session = c.get('session')
      if (!session) return c.json({ error: 'Unauthorized' }, 401)
      const mode = c.req.query('mode') || undefined
      await container.chatRepository.clearByUserId(session.user.id, mode)
      return c.json({ success: true })
    })
}

export const chatRouter = createChatRouter(defaultContainer)