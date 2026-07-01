import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ChatUseCases } from '../chat-use-cases'
import type { IAIService } from '../../ports/ai-service'

function makeAiService(result?: object): IAIService {
  return {
    generateStructuredData: vi.fn().mockResolvedValue(result ?? {
      intent: 'GENERAL_CHAT',
      targetWidget: null,
      reply: 'Hello!',
      extractedData: {},
    }),
  }
}

const PROMPTS = {
  chatIntent: 'You are an onboarding assistant.',
  vaultExpander: 'Generate 12 vault bullets.',
  bulletSelector: 'Select the best bullets.',
}

function buildUC(ai?: IAIService) {
  return new ChatUseCases(
    ai ?? makeAiService(),
    PROMPTS.chatIntent,
    PROMPTS.vaultExpander,
    PROMPTS.bulletSelector,
  )
}

// ── parseIntent ───────────────────────────────────────────────────────────────

describe('ChatUseCases.parseIntent', () => {
  it('returns AI result on happy path', async () => {
    const aiResult = { intent: 'NAVIGATE', targetWidget: 'EXPERIENCE', reply: 'Let me show experience.', extractedData: { role: 'SWE' } }
    const uc = buildUC(makeAiService(aiResult))
    const result = await uc.parseIntent({
      messages: [{ role: 'user', content: 'I worked at Google' }],
      currentState: { phase: 'REVIEW_EXPERIENCE' },
    })
    expect(result.intent).toBe('NAVIGATE')
    expect(result.targetWidget).toBe('EXPERIENCE')
    expect(result.reply).toBe('Let me show experience.')
  })

  it('filters system messages before sending to AI', async () => {
    const ai = makeAiService()
    const uc = buildUC(ai)
    await uc.parseIntent({
      messages: [
        { role: 'system', content: 'System prompt — should be stripped' },
        { role: 'user', content: 'Hello' },
      ],
    })
    const [, userContent] = (ai.generateStructuredData as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(userContent).not.toContain('System prompt')
    expect(userContent).toContain('Hello')
  })

  it('appends current phase to system prompt', async () => {
    const ai = makeAiService()
    const uc = buildUC(ai)
    await uc.parseIntent({
      messages: [{ role: 'user', content: 'Hi' }],
      currentState: { phase: 'REVIEW_SKILLS' },
    })
    const [systemPrompt] = (ai.generateStructuredData as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(systemPrompt).toContain('REVIEW_SKILLS')
  })

  it('defaults to GREETING phase when currentState is missing', async () => {
    const ai = makeAiService()
    const uc = buildUC(ai)
    await uc.parseIntent({ messages: [{ role: 'user', content: 'Hi' }] })
    const [systemPrompt] = (ai.generateStructuredData as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(systemPrompt).toContain('GREETING')
  })

  it('returns fallback on AI failure', async () => {
    const ai: IAIService = { generateStructuredData: vi.fn().mockRejectedValue(new Error('API Error')) }
    const uc = buildUC(ai)
    const result = await uc.parseIntent({ messages: [{ role: 'user', content: 'Hi' }] })
    expect(result.reply).toContain("didn't quite catch")
    expect(result.intent).toBe('GENERAL_CHAT')
    expect(result.targetWidget).toBeNull()
    expect(result.extractedData).toEqual({})
  })

  it('fetches Jina reader when user message contains a URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => 'scraped content from the URL',
    })
    vi.stubGlobal('fetch', fetchMock)

    const ai = makeAiService()
    const uc = buildUC(ai)
    await uc.parseIntent({
      messages: [{ role: 'user', content: 'Check this https://example.com/job' }],
    })

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('r.jina.ai'),
      expect.any(Object)
    )
    const [, userContent] = (ai.generateStructuredData as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(userContent).toContain('scraped content from the URL')

    vi.unstubAllGlobals()
  })

  it('continues without URL context when Jina fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    const ai = makeAiService()
    const uc = buildUC(ai)
    // Should not throw
    await expect(uc.parseIntent({
      messages: [{ role: 'user', content: 'See https://example.com' }],
    })).resolves.not.toThrow()
    vi.unstubAllGlobals()
  })
})

// ── expandVault ───────────────────────────────────────────────────────────────

describe('ChatUseCases.expandVault', () => {
  it('sends type, title, and description to AI', async () => {
    const ai = makeAiService({ vaultBullets: [] })
    const uc = buildUC(ai)
    await uc.expandVault({ type: 'experience', title: 'SWE at Acme', rawDescription: 'Worked on backend APIs' })
    const [, userContent] = (ai.generateStructuredData as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(userContent).toContain('SWE at Acme')
    expect(userContent).toContain('Worked on backend APIs')
    expect(userContent).toContain('experience')
  })

  it('uses vault expander prompt', async () => {
    const ai = makeAiService({ vaultBullets: [] })
    const uc = buildUC(ai)
    await uc.expandVault({ type: 'project', title: 'MyApp', rawDescription: 'Built a cool app' })
    const [systemPrompt] = (ai.generateStructuredData as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(systemPrompt).toBe(PROMPTS.vaultExpander)
  })

  it('returns vaultBullets from AI', async () => {
    const bullets = [{ id: '1', text: 'Led team of 5', keywords: ['leadership'], isAIGenerated: true }]
    const ai = makeAiService({ vaultBullets: bullets })
    const uc = buildUC(ai)
    const result = await uc.expandVault({ type: 'experience', title: 'Lead', rawDescription: 'I led stuff' })
    expect(result.vaultBullets).toEqual(bullets)
  })
})

// ── selectBullets ─────────────────────────────────────────────────────────────

describe('ChatUseCases.selectBullets', () => {
  it('JSON-stringifies jobDescription and profile as user content', async () => {
    const ai = makeAiService({ selections: {}, rationale: 'none' })
    const uc = buildUC(ai)
    const profile = { experience: [], projects: [] }
    await uc.selectBullets({ jobDescription: 'Build things', profile: profile as any })
    const [, userContent] = (ai.generateStructuredData as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(JSON.parse(userContent)).toMatchObject({ jobDescription: 'Build things' })
  })

  it('returns selections and rationale', async () => {
    const ai = makeAiService({
      selections: { 'exp-1': ['b1', 'b2'] },
      rationale: 'These match the JD well.',
    })
    const uc = buildUC(ai)
    const result = await uc.selectBullets({ jobDescription: 'JD', profile: { experience: [], projects: [] } as any })
    expect(result.selections).toEqual({ 'exp-1': ['b1', 'b2'] })
    expect(result.rationale).toBe('These match the JD well.')
  })
})
