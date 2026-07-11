import { describe, it, expect, vi } from 'vitest'
import { Hono } from 'hono'
import { createAiRouter } from '../../../interface/routes/ai'
import type { Profile } from '../../domain/entities'

const SESSION = {
  user: { id: 'user-1', email: 'test@test.com', name: 'Test User' },
  session: { id: 'sess-1', expiresAt: new Date() },
}

const PROFILE: Profile = {
  contact: { name: 'Alice', email: 'a@a.com', phone: null, linkedin: null, github: null, leetcode: null, portfolio: null },
  education: [],
  experience: [{ id: 'exp-1', company: 'Acme', role: 'Eng', startDate: null, endDate: null, vaultBullets: [] }],
  projects: [],
  skills: { languages: ['TS'], frameworks: [], tools: [] },
  certificates: [],
  githubUsername: null,
}

function buildApp(overrides: Record<string, unknown> = {}) {
  const mockContainer: any = {
    aiUseCases: {
      generate: vi.fn().mockResolvedValue({ vaultBullets: [] }),
    },
    chatUseCases: {
      expandVault: vi.fn().mockResolvedValue({ vaultBullets: [] }),
      selectBullets: vi.fn().mockResolvedValue({ selectedExperienceIds: [], selectedProjectIds: [], selections: {}, rationale: 'ok' }),
    },
    profileUseCases: {
      getProfile: vi.fn().mockResolvedValue(PROFILE),
    },
    ...overrides,
  }
  const app = new Hono<{ Variables: any }>()
  app.use('*', async (c, next) => { c.set('session', SESSION); await next() })
  app.route('/', createAiRouter(mockContainer))
  return { app, container: mockContainer }
}

// ── POST /generate-bullets ────────────────────────────────────────────────────

describe('POST /generate-bullets', () => {
  it('returns generated bullets', async () => {
    const bullets = [{ id: '1', text: 'Built APIs', keywords: [], isAIGenerated: true }]
    const { app } = buildApp({
      aiUseCases: { generate: vi.fn().mockResolvedValue({ vaultBullets: bullets }) },
    })
    const res = await app.request('/generate-bullets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section: 'experience', rawInput: 'I worked at Acme' }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.vaultBullets).toHaveLength(1)
  })

  it('returns 400 when section is missing', async () => {
    const { app } = buildApp()
    const res = await app.request('/generate-bullets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawInput: 'some input' }),
    })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body).toHaveProperty('error', 'Missing required fields')
  })

  it('returns 400 when rawInput is missing', async () => {
    const { app } = buildApp()
    const res = await app.request('/generate-bullets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section: 'experience' }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 500 when aiUseCases.generate throws', async () => {
    const { app } = buildApp({
      aiUseCases: { generate: vi.fn().mockRejectedValue(new Error('Unknown section: xyz')) },
    })
    const res = await app.request('/generate-bullets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ section: 'xyz', rawInput: 'some input' }),
    })
    expect(res.status).toBe(500)
  })
})

// ── POST /expand-vault ────────────────────────────────────────────────────────

describe('POST /expand-vault', () => {
  it('returns vaultBullets from expandVault', async () => {
    const bullets = [{ id: '1', text: 'Led team', keywords: [], isAIGenerated: true }]
    const { app } = buildApp({
      chatUseCases: {
        expandVault: vi.fn().mockResolvedValue({ vaultBullets: bullets }),
        selectBullets: vi.fn(),
      },
    })
    const res = await app.request('/expand-vault', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'experience', title: 'SWE', rawDescription: 'Built stuff' }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.vaultBullets).toHaveLength(1)
  })

  it('returns 500 on expandVault failure', async () => {
    const { app } = buildApp({
      chatUseCases: {
        expandVault: vi.fn().mockRejectedValue(new Error('AI down')),
        selectBullets: vi.fn(),
      },
    })
    const res = await app.request('/expand-vault', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'experience', title: 'x', rawDescription: 'y' }),
    })
    expect(res.status).toBe(500)
  })
})

// ── POST /select-bullets ──────────────────────────────────────────────────────

describe('POST /select-bullets', () => {
  it('returns selections on success', async () => {
    const { app } = buildApp()
    const res = await app.request('/select-bullets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobDescription: 'Build backend APIs' }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveProperty('selections')
    expect(body).toHaveProperty('rationale')
  })

  it('returns 404 when profile does not exist', async () => {
    const { app } = buildApp({
      profileUseCases: { getProfile: vi.fn().mockResolvedValue(null) },
    })
    const res = await app.request('/select-bullets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobDescription: 'JD' }),
    })
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body).toHaveProperty('error', 'Profile not found')
  })
})
