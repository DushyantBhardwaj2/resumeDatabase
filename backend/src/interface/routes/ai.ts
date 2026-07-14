import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { logger } from '../../infrastructure/logger'
import { container as defaultContainer } from '../../di/container'
import type { Variables } from '../types'
import type { Container } from '../../di/container'

const expandVaultSchema = z.object({
  type: z.enum(['PROJECT', 'EXPERIENCE']).optional().default('PROJECT'),
  title: z.string().min(1),
  rawDescription: z.string().min(1),
  content: z.string().optional(),
  count: z.number().int().positive().optional(),
})

export function createAiRouter(container: Container) {
  return new Hono<{ Variables: Variables }>()
    .post('/expand-vault', zValidator('json', expandVaultSchema), async (c) => {
      const session = c.get('session')
      if (!session) return c.json({ error: 'Unauthorized' }, 401)
      const body = c.req.valid('json')
      try {
        const result = await container.aiService.generate(
          `Expand this ${body.type.toLowerCase()} description into compelling bullet points.\n\nTitle: ${body.title}\nDescription: ${body.rawDescription}`,
          { temperature: 0.5, maxTokens: 2000 }
        )
        return c.json({ vaultBullets: JSON.parse(result) })
      } catch (err: any) {
        logger.error({ err }, 'Vault expansion error')
        return c.json({ error: err.message }, 500)
      }
    })
}

export const aiRouter = createAiRouter(defaultContainer)
