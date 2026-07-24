import { Hono } from 'hono'
import { logger } from '../../infrastructure/logger'
import { container as defaultContainer } from '../../di/container'
import type { Variables } from '../types'
import type { Container } from '../../di/container'

export function createParseRouter(container: Container) {
  return new Hono<{ Variables: Variables }>()
    .post('/', async (c) => {
      const session = c.get('session')
      if (!session) return c.json({ error: 'Unauthorized' }, 401)

      try {
        const body = await c.req.parseBody()
        const file = body['file']
        if (!file || !(file instanceof File)) {
          return c.json({ error: 'No file uploaded' }, 400)
        }
        if (!file.name.endsWith('.pdf')) {
          return c.json({ error: 'Only PDF files are accepted' }, 400)
        }
        if (file.size > 10 * 1024 * 1024) {
          return c.json({ error: 'File size exceeds 10MB limit' }, 400)
        }

        const buffer = Buffer.from(await file.arrayBuffer())
        const result = await container.resumeUseCases.parseResume(buffer)
        return c.json(result)
      } catch (err: any) {
        logger.error({ err, tag: 'parse' }, 'PDF parse error')
        return c.json({ error: err.message }, 500)
      }
    })
}

export const parseRouter = createParseRouter(defaultContainer)
