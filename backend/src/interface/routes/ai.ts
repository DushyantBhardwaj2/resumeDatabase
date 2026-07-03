import { Hono } from 'hono'
import { container as defaultContainer } from '../../di/container'
import type { Variables } from '../types'
import type { Container } from '../../di/container'

export function createAiRouter(container: Container) {
  return new Hono<{ Variables: Variables }>()
    .post('/generate-bullets', async (c) => {
      const session = c.get('session')
      if (!session) return c.json({ error: 'Unauthorized' }, 401)
      const { section, rawInput, context } = await c.req.json()

      if (!section || !rawInput) {
        return c.json({ error: 'Missing required fields' }, 400)
      }

      try {
        const result = await container.aiUseCases.generate(section, rawInput, context)
        return c.json(result)
      } catch (err: any) {
        console.error('AI generation error:', err)
        return c.json({ error: err.message }, 500)
      }
    })
    .post('/expand-vault', async (c) => {
      const session = c.get('session')
      if (!session) return c.json({ error: 'Unauthorized' }, 401)
      const body = await c.req.json()
      try {
        const result = await container.chatUseCases.expandVault(body)
        return c.json(result)
      } catch (err: any) {
        console.error('Vault expansion error:', err)
        return c.json({ error: err.message }, 500)
      }
    })
    .post('/select-bullets', async (c) => {
      const session = c.get('session')
      const { jobDescription } = await c.req.json()
      try {
        const profile = await container.profileUseCases.getProfile(session.user.id)
        if (!profile) return c.json({ error: 'Profile not found' }, 404)
        const result = await container.chatUseCases.selectBullets({ jobDescription, profile })
        return c.json(result)
      } catch (err: any) {
        console.error('Bullet selection error:', err)
        return c.json({ error: err.message }, 500)
      }
    })
}

export const aiRouter = createAiRouter(defaultContainer)
