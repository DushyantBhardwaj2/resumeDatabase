import { Hono } from 'hono'
import { container } from '../../di/container'
import { computeCompleteness } from '../../infrastructure/profile-utils'
import type { Variables } from '../types'

export const profileRouter = new Hono<{ Variables: Variables }>()

profileRouter.get('/', async (c) => {
  const session = c.get('session')
  const profile = await container.profileUseCases.getProfile(session.user.id)
  if (!profile) return c.json(null)
  return c.json({ ...profile, completeness: computeCompleteness(profile) })
})

profileRouter.post('/', async (c) => {
  const session = c.get('session')
  const body = await c.req.json()
  const { rawText, parsed: data } = body
  const profile = await container.profileUseCases.saveFromOnboarding(
    session.user.id, rawText || "", data || {},
    { name: session.user.name, email: session.user.email }
  )
  return c.json(profile)
})

profileRouter.patch('/', async (c) => {
  const session = c.get('session')
  const body = await c.req.json()
  try {
    const profile = await container.profileUseCases.updateProfile(session.user.id, body)
    return c.json(profile)
  } catch (err: any) {
    console.error("Profile update error:", err)
    return c.json({ error: err.message }, 500)
  }
})
