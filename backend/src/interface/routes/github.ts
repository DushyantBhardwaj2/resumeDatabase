import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { logger } from '../../infrastructure/logger'
import { container as defaultContainer } from '../../di/container'
import type { Variables } from '../types'
import type { Container } from '../../di/container'

const analyzeSchema = z.object({
  url: z.string().url(),
})

export function createGithubRouter(container: Container) {
  return new Hono<{ Variables: Variables }>()
    .post('/analyze', zValidator('json', analyzeSchema), async (c) => {
      const session = c.get('session')
      if (!session) return c.json({ error: 'Unauthorized' }, 401)
      const { url } = c.req.valid('json')
      try {
        const analysis = await container.githubUseCases.analyze(url)
        return c.json({ repo: analysis, analysis })
      } catch (err: any) {
        logger.error({ err, tag: 'github-analyze' }, 'GitHub analyze error')
        return c.json({ error: err.message }, 500)
      }
    })
    .post('/import', zValidator('json', analyzeSchema), async (c) => {
      const session = c.get('session')
      if (!session) return c.json({ error: 'Unauthorized' }, 401)
      const { url } = c.req.valid('json')
      try {
        const result = await container.githubUseCases.importRepo(url, session.user.id)
        return c.json(result)
      } catch (err: any) {
        logger.error({ err, tag: 'github-import' }, 'GitHub import error')
        return c.json({ error: err.message }, 500)
      }
    })
}

export const githubRouter = createGithubRouter(defaultContainer)
