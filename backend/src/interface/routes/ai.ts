import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { logger } from '@/infrastructure/logger'
import { container as defaultContainer } from '../../di/container'
import type { Variables } from '../types'
import type { Container } from '../../di/container'

const sectionTypeSchema = z.enum(['experience', 'projects', 'skills', 'summary', 'project', 'experience_entry'])

const generateBulletsSchema = z.object({
  section: sectionTypeSchema,
  rawInput: z.string().min(1),
  context: z.union([z.string(), z.record(z.string(), z.unknown())]).optional(),
})

const expandVaultSchema = z.object({
  type: z.enum(['PROJECT', 'EXPERIENCE']).optional().default('PROJECT'),
  title: z.string().min(1),
  rawDescription: z.string().min(1),
  content: z.string().optional(),
  count: z.number().int().positive().optional(),
})

const selectBulletsSchema = z.object({
  jobDescription: z.string().min(1),
})

export function createAiRouter(container: Container) {
  return new Hono<{ Variables: Variables }>()
    .post('/generate-bullets', zValidator('json', generateBulletsSchema), async (c) => {
      const session = c.get('session')
      if (!session) return c.json({ error: 'Unauthorized' }, 401)
      const { section, rawInput, context: rawContext } = c.req.valid('json')
      const context = typeof rawContext === 'string' ? { raw: rawContext } : rawContext

      try {
        const result = await container.aiUseCases.generate(section, rawInput, context)
        return c.json(result)
      } catch (err: any) {
        logger.error({ err }, 'AI generation error')
        return c.json({ error: err.message }, 500)
      }
    })
    .post('/expand-vault', zValidator('json', expandVaultSchema), async (c) => {
      const session = c.get('session')
      if (!session) return c.json({ error: 'Unauthorized' }, 401)
      const body = c.req.valid('json')
      try {
        const result = await container.chatUseCases.expandVault(body)
        return c.json(result)
      } catch (err: any) {
        logger.error({ err }, 'Vault expansion error')
        return c.json({ error: err.message }, 500)
      }
    })
    .post('/select-bullets', zValidator('json', selectBulletsSchema), async (c) => {
      const session = c.get('session')
      const { jobDescription } = c.req.valid('json')
      try {
        const profile = await container.profileUseCases.getProfile(session.user.id)
        if (!profile) return c.json({ error: 'Profile not found' }, 404)
        const result = await container.chatUseCases.selectBullets({ jobDescription, profile })
        return c.json(result)
      } catch (err: any) {
        logger.error({ err }, 'Bullet selection error')
        return c.json({ error: err.message }, 500)
      }
    })
}

export const aiRouter = createAiRouter(defaultContainer)
