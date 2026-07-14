import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { logger } from '../../infrastructure/logger'
import { container as defaultContainer } from '../../di/container'
import type { Variables } from '../types'
import type { Container } from '../../di/container'

const interactSchema = z.object({
  message: z.string().min(1),
  activeDraftId: z.string().optional(),
})

const saveMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1),
})

export function createChatRouter(container: Container) {
  return new Hono<{ Variables: Variables }>()
    .post('/interact', zValidator('json', interactSchema), async (c) => {
      const session = c.get('session')
      if (!session) return c.json({ error: 'Unauthorized' }, 401)
      const { message, activeDraftId } = c.req.valid('json')
      try {
        const result = await container.chatUseCases.interact({ message, activeDraftId }, session.user.id)
        return c.json(result)
      } catch (err: any) {
        logger.error({ err, tag: 'chat-interact' }, 'Chat interact error')
        return c.json({ error: err.message }, 500)
      }
    })
    .post('/save', zValidator('json', saveMessageSchema), async (c) => {
      const session = c.get('session')
      if (!session) return c.json({ error: 'Unauthorized' }, 401)
      const { role, content } = c.req.valid('json')
      const msg = await container.chatRepository.save({ userId: session.user.id, role, content })
      return c.json(msg)
    })
    .get('/history', async (c) => {
      const session = c.get('session')
      const messages = await container.chatRepository.findByUserId(session.user.id, 50)
      return c.json(messages)
    })
}

export const chatRouter = createChatRouter(defaultContainer)
