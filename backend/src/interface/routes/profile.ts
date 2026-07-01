import { Hono } from 'hono'
import { container as defaultContainer } from '../../di/container'
import { computeCompleteness } from '../../infrastructure/profile-utils'
import type { Variables } from '../types'
import type { Container } from '../../di/container'

export function createProfileRouter(container: Container) {
  return new Hono<{ Variables: Variables }>()
    .get('/', async (c) => {
      const session = c.get('session')
      const profile = await container.profileUseCases.getProfile(session.user.id)
      if (!profile) return c.json(null)
      return c.json({ ...profile, completeness: computeCompleteness(profile) })
    })
    .post('/', async (c) => {
      const session = c.get('session')
      const body = await c.req.json()
      const { rawText, parsed: data } = body
      const profile = await container.profileUseCases.saveFromOnboarding(
        session.user.id, rawText || '', data || {},
        { name: session.user.name, email: session.user.email }
      )
      return c.json(profile)
    })
    .patch('/', async (c) => {
      const session = c.get('session')
      const body = await c.req.json()
      try {
        const profile = await container.profileUseCases.updateProfile(session.user.id, body)
        return c.json(profile)
      } catch (err: any) {
        console.error('Profile update error:', err)
        return c.json({ error: err.message }, 500)
      }
    })
}

export const profileRouter = createProfileRouter(defaultContainer)
