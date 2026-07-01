import { describe, it, expect, vi } from 'vitest'
import { HistoryUseCases } from '../history-use-cases'
import type { ITailoredResumeRepository } from '../../../domain/repositories'

function makeRepo(overrides: Partial<ITailoredResumeRepository> = {}): ITailoredResumeRepository {
  return {
    create: vi.fn(),
    findByUserId: vi.fn(),
    findById: vi.fn(),
    deleteById: vi.fn(),
    updateStyling: vi.fn(),
    ...overrides,
  }
}

describe('HistoryUseCases', () => {
  describe('list', () => {
    it('delegates to repo.findByUserId', async () => {
      const items = [{ id: '1', companyName: 'Acme', jobTitle: 'Eng', createdAt: new Date() }]
      const repo = makeRepo({ findByUserId: vi.fn().mockResolvedValue(items) })
      const uc = new HistoryUseCases(repo)
      const result = await uc.list('user-1')
      expect(result).toBe(items)
      expect(repo.findByUserId).toHaveBeenCalledWith('user-1', undefined)
    })

    it('passes search string to repo', async () => {
      const repo = makeRepo({ findByUserId: vi.fn().mockResolvedValue([]) })
      const uc = new HistoryUseCases(repo)
      await uc.list('user-1', 'google')
      expect(repo.findByUserId).toHaveBeenCalledWith('user-1', 'google')
    })
  })

  describe('get', () => {
    it('returns the item when found', async () => {
      const item = { id: 'h-1', tailoredData: {} }
      const repo = makeRepo({ findById: vi.fn().mockResolvedValue(item) })
      const uc = new HistoryUseCases(repo)
      const result = await uc.get('h-1', 'user-1')
      expect(result).toBe(item)
      expect(repo.findById).toHaveBeenCalledWith('h-1', 'user-1')
    })

    it('returns null when item not found', async () => {
      const repo = makeRepo({ findById: vi.fn().mockResolvedValue(null) })
      const uc = new HistoryUseCases(repo)
      expect(await uc.get('missing', 'user-1')).toBeNull()
    })
  })

  describe('delete', () => {
    it('calls repo.deleteById with correct args', async () => {
      const repo = makeRepo({ deleteById: vi.fn().mockResolvedValue(undefined) })
      const uc = new HistoryUseCases(repo)
      await uc.delete('h-1', 'user-1')
      expect(repo.deleteById).toHaveBeenCalledWith('h-1', 'user-1')
    })
  })

  describe('updateStyling', () => {
    it('calls repo.updateStyling with id, userId, and styleConfig', async () => {
      const repo = makeRepo({ updateStyling: vi.fn().mockResolvedValue(undefined) })
      const uc = new HistoryUseCases(repo)
      const config = { color: '#1a1a2e', font: 'Inter' }
      await uc.updateStyling('h-1', 'user-1', config)
      expect(repo.updateStyling).toHaveBeenCalledWith('h-1', 'user-1', config)
    })
  })
})
