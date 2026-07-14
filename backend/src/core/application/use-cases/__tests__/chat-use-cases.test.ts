import { describe, it, expect, vi } from 'vitest'
import { ChatUseCases } from '../chat-use-cases'
import type { IAIService } from '../../ports/ai-service'
import type { IRetrieverService } from '../../ports/retriever'
import type { IKnowledgeBaseService } from '../../ports/knowledge-base'
import type { IConfidenceService } from '../../ports/system-confidence'

function makeAiService(intentResult?: any, memoryResult?: any): IAIService {
  return {
    generate: vi.fn().mockResolvedValue('Hi general chat!'),
    generateStructuredData: vi.fn()
      .mockImplementation(async (systemPrompt, userContent, schema) => {
        if (systemPrompt.includes('intent')) {
          return intentResult ?? {
            intent: 'GENERAL_CHAT',
            confidence: 0.9,
            reply: 'Hello!',
            targetWidget: null,
          }
        }
        return memoryResult ?? {
          actions: [],
          reply: 'Here are the cards.',
        }
      }),
  }
}

function makeRetriever(): IRetrieverService {
  return {
    search: vi.fn().mockResolvedValue([]),
    detectMerge: vi.fn().mockResolvedValue({ shouldSuggest: false, targetEntry: null, matchScore: 0 }),
  }
}

function makeKB(): IKnowledgeBaseService {
  return {
    getCurrentVersion: vi.fn().mockReturnValue('v1'),
    getVersions: vi.fn().mockReturnValue(['v1']),
    getBundle: vi.fn().mockReturnValue({ version: 'v1', files: [], loadedAt: '' }),
    getContext: vi.fn().mockReturnValue({ version: 'v1', files: [] }),
    getPrompt: vi.fn().mockReturnValue('Some prompt'),
  }
}

function makeConfidenceService(): IConfidenceService {
  return {
    compute: vi.fn().mockReturnValue(0.95),
    getLabel: vi.fn().mockReturnValue('high'),
    getColor: vi.fn().mockReturnValue('green'),
  }
}

function makeChatRepo(): any {
  return {
    save: vi.fn().mockResolvedValue(undefined),
    findByUserId: vi.fn().mockResolvedValue([]),
  }
}

describe('ChatUseCases', () => {
  it('handles GENERAL_CHAT intent correctly', async () => {
    const ai = makeAiService({ intent: 'GENERAL_CHAT', confidence: 0.9, reply: 'Hi general chat!', targetWidget: null })
    const retriever = makeRetriever()
    const kb = makeKB()
    const confidence = makeConfidenceService()
    const chatRepo = makeChatRepo()

    const uc = new ChatUseCases(ai, retriever, kb, confidence, chatRepo, 'intent-prompt', 'memory-prompt')

    const res = await uc.interact({ message: 'Hello' }, 'user-1')

    expect(chatRepo.save).toHaveBeenCalledWith({ userId: 'user-1', role: 'user', content: 'Hello' })
    expect(res.intent).toBe('GENERAL_CHAT')
    expect(res.type).toBe('text')
    expect(res.reply).toBe('Hi general chat!')
  })

  it('handles CREATE_MEMORY intent with memory extract details', async () => {
    const ai = makeAiService(
      { intent: 'CREATE_MEMORY', confidence: 0.85, reply: 'Extracted experience.', targetWidget: 'EXPERIENCE' },
      {
        actions: [{ type: 'CREATE_EXPERIENCE', experience: { company: 'Acme', role: 'SWE', startDate: '2024' } }],
        reply: 'Confirm this experience:'
      }
    )
    const retriever = makeRetriever()
    const kb = makeKB()
    const confidence = makeConfidenceService()
    const chatRepo = makeChatRepo()

    const uc = new ChatUseCases(ai, retriever, kb, confidence, chatRepo, 'intent-prompt', 'memory-prompt')

    const res = await uc.interact({ message: 'I worked at Acme' }, 'user-1')

    expect(res.intent).toBe('CREATE_MEMORY')
    expect(res.type).toBe('proposal-cards')
    expect(res.actions).toHaveLength(1)
    expect(res.actions![0].type).toBe('CREATE_EXPERIENCE')
  })
})
