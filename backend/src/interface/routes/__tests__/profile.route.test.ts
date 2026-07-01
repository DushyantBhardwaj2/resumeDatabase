import { describe, it, expect, vi } from 'vitest'
import { Hono } from 'hono'
import { createProfileRouter } from '../../../interface/routes/profile'
import type { Profile } from '../../domain/entities'

// ── Test helpers ──────────────────────────────────────────────────────────────

const SESSION = {
  user: { id: 'user-1', email: 'test@test.com', name: 'Test User' },
  session: { id: 'sess-1', expiresAt: new Date() },
}

const EMPTY_PROFILE: Profile = {
  contact: { name: 'Test User', email: 'test@test.com', phone: null, linkedin: null, github: null, leetcode: null, portfolio: null },
  education: [],
  experience: [],
  projects: [],
  skills: { languages: [], frameworks: [], tools: [] },
  certificates: [],
  githubUsername: null,
}

function buildApp(containerOverrides: Record<string, unknown> = {}) {
  const mockContainer: any = {
    profileUseCases: {
      getProfile: vi.fn().mockResolvedValue(EMPTY_PROFILE),
      updateProfile: vi.fn().mockResolvedValue(EMPTY_PROFILE),
      saveFromOnboarding: vi.fn().mockResolvedValue(EMPTY_PROFILE),
    },
    ...containerOverrides,
  }

  const app = new Hono<{ Variables: any }>()
  // Inject session as middleware (simulating auth)
  app.use('*', async (c, next) => {
    c.set('session', SESSION)
    await next()
  })
  app.route('/', createProfileRouter(mockContainer))
  return { app, container: mockContainer }
}

// ── GET / ─────────────────────────────────────────────────────────────────────

describe('GET / (profile route)', () => {
  it('returns 200 with profile + completeness for existing profile', async () => {
    const { app } = buildApp()
    const res = await app.request('/')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('contact')
    expect(body).toHaveProperty('completeness')
    expect(typeof body.completeness).toBe('number')
  })

  it('returns null (200) when profile does not exist', async () => {
    const { app } = buildApp({
      profileUseCases: {
        getProfile: vi.fn().mockResolvedValue(null),
        updateProfile: vi.fn(),
        saveFromOnboarding: vi.fn(),
      },
    })
    const res = await app.request('/')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toBeNull()
  })

  it('calls getProfile with the session userId', async () => {
    const { app, container } = buildApp()
    await app.request('/')
    expect(container.profileUseCases.getProfile).toHaveBeenCalledWith('user-1')
  })
})

// ── POST / ────────────────────────────────────────────────────────────────────

describe('POST / (profile route)', () => {
  it('saves profile from onboarding and returns it', async () => {
    const { app, container } = buildApp()
    const res = await app.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawText: 'resume text', parsed: EMPTY_PROFILE }),
    })
    expect(res.status).toBe(200)
    expect(container.profileUseCases.saveFromOnboarding).toHaveBeenCalledWith(
      'user-1',
      'resume text',
      EMPTY_PROFILE,
      { name: SESSION.user.name, email: SESSION.user.email }
    )
  })

  it('handles empty body gracefully (empty strings, empty object)', async () => {
    const { app } = buildApp()
    const res = await app.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    expect(res.status).toBe(200)
  })
})

// ── PATCH / ───────────────────────────────────────────────────────────────────

describe('PATCH / (profile route)', () => {
  it('updates profile and returns it', async () => {
    const { app, container } = buildApp()
    const patch = { githubUsername: 'newuser' }
    const res = await app.request('/', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    expect(res.status).toBe(200)
    expect(container.profileUseCases.updateProfile).toHaveBeenCalledWith('user-1', patch)
  })

  it('returns 500 when updateProfile throws', async () => {
    const { app } = buildApp({
      profileUseCases: {
        getProfile: vi.fn(),
        saveFromOnboarding: vi.fn(),
        updateProfile: vi.fn().mockRejectedValue(new Error('DB error')),
      },
    })
    const res = await app.request('/', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ githubUsername: 'bad' }),
    })
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body).toHaveProperty('error')
  })
})
