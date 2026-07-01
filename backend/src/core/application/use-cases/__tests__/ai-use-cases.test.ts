import { describe, it, expect, vi } from 'vitest'
import { AiUseCases } from '../ai-use-cases'
import type { IAIService } from '../../ports/ai-service'

function makeAiService(overrides: Partial<IAIService> = {}): IAIService {
  return {
    generateStructuredData: vi.fn().mockResolvedValue({ vaultBullets: [] }),
    ...overrides,
  }
}

describe('AiUseCases', () => {
  describe('generate', () => {
    it('throws when section is unknown', async () => {
      const ai = makeAiService()
      const uc = new AiUseCases(ai, {})
      await expect(uc.generate('nonexistent' as any, 'raw')).rejects.toThrow('Unknown section: nonexistent')
    })

    it('calls aiService.generateStructuredData for a known section', async () => {
      const ai = makeAiService()
      const schema = { parse: (d: unknown) => d }
      const configs = {
        experience: { prompt: 'Generate bullets for experience', schema },
      }
      const uc = new AiUseCases(ai, configs)
      await uc.generate('experience' as any, 'I worked at Acme')
      expect(ai.generateStructuredData).toHaveBeenCalledOnce()
    })

    it('appends context to the system prompt', async () => {
      const ai = makeAiService()
      const schema = { parse: (d: unknown) => d }
      const configs = {
        experience: { prompt: 'Base prompt', schema },
      }
      const uc = new AiUseCases(ai, configs)
      const ctx = { userId: 'u1', extra: true }
      await uc.generate('experience' as any, 'raw input', ctx)
      const [systemPrompt] = (ai.generateStructuredData as ReturnType<typeof vi.fn>).mock.calls[0]
      expect(systemPrompt).toContain('Base prompt')
      expect(systemPrompt).toContain(JSON.stringify(ctx))
    })

    it('passes rawInput as userContent', async () => {
      const ai = makeAiService()
      const schema = { parse: (d: unknown) => d }
      const configs = {
        skills: { prompt: 'Skill prompt', schema },
      }
      const uc = new AiUseCases(ai, configs)
      await uc.generate('skills' as any, 'TypeScript, React')
      const [, userContent] = (ai.generateStructuredData as ReturnType<typeof vi.fn>).mock.calls[0]
      expect(userContent).toContain('TypeScript, React')
    })

    it('returns AI service result', async () => {
      const expected = { vaultBullets: [{ id: '1', text: 'Did stuff', keywords: [], isAIGenerated: true }] }
      const ai = makeAiService({ generateStructuredData: vi.fn().mockResolvedValue(expected) })
      const schema = { parse: (d: unknown) => d }
      const configs = { experience: { prompt: 'p', schema } }
      const uc = new AiUseCases(ai, configs)
      const result = await uc.generate('experience' as any, 'raw')
      expect(result).toEqual(expected)
    })
  })
})
