import { describe, it, expect, vi } from 'vitest'
import { HistoryUseCases } from '../history-use-cases'
import type { IResumeDraftRepository } from '../../../domain/repositories'

function makeRepo(overrides: Partial<IResumeDraftRepository> = {}): IResumeDraftRepository {
  return {
    create: vi.fn(),
    findByUserId: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    ...overrides,
  }
}

describe('HistoryUseCases', () => {
  describe('list', () => {
    it('delegates to repo.findByUserId', async () => {
      const items = [{ id: '1', title: 'Stripe — Eng', jobDescription: 'Java developer', createdAt: new Date().toISOString() }] as any
      const repo = makeRepo({ findByUserId: vi.fn().mockResolvedValue(items) })
      const uc = new HistoryUseCases(repo)
      const result = await uc.list('user-1')
      expect(result).toBe(items)
      expect(repo.findByUserId).toHaveBeenCalledWith('user-1')
    })

    it('filters draft list by search string in use case', async () => {
      const items = [
        { id: '1', title: 'Google SWE', jobDescription: 'Python role', createdAt: new Date().toISOString() },
        { id: '2', title: 'Stripe PM', jobDescription: 'Product manager', createdAt: new Date().toISOString() }
      ] as any
      const repo = makeRepo({ findByUserId: vi.fn().mockResolvedValue(items) })
      const uc = new HistoryUseCases(repo)
      const result = await uc.list('user-1', 'Google')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('1')
    })
  })

  describe('get', () => {
    it('returns the item when found', async () => {
      const item = { id: 'h-1', title: 'Stripe — Eng' } as any
      const repo = makeRepo({ findById: vi.fn().mockResolvedValue(item) })
      const uc = new HistoryUseCases(repo)
      const result = await uc.get('h-1')
      expect(result).toBe(item)
      expect(repo.findById).toHaveBeenCalledWith('h-1')
    })

    it('returns null when item not found', async () => {
      const repo = makeRepo({ findById: vi.fn().mockResolvedValue(null) })
      const uc = new HistoryUseCases(repo)
      expect(await uc.get('missing')).toBeNull()
    })
  })

  describe('delete', () => {
    it('calls repo.delete with correct args', async () => {
      const repo = makeRepo({ delete: vi.fn().mockResolvedValue(undefined) })
      const uc = new HistoryUseCases(repo)
      await uc.delete('h-1')
      expect(repo.delete).toHaveBeenCalledWith('h-1')
    })
  })
})
