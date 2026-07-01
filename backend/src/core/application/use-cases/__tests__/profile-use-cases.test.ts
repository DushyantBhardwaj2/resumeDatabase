import { describe, it, expect, vi } from 'vitest'
import { ProfileUseCases } from '../profile-use-cases'
import type { IProfileRepository } from '../../../domain/repositories'
import type { Profile } from '../../../domain/entities'

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    contact: { name: 'Alice', email: 'a@a.com', phone: null, linkedin: null, github: null, leetcode: null, portfolio: null },
    education: [],
    experience: [],
    projects: [],
    skills: { languages: [], frameworks: [], tools: [] },
    certificates: [],
    githubUsername: null,
    ...overrides,
  }
}

function makeRepo(overrides: Partial<IProfileRepository> = {}): IProfileRepository {
  return {
    findByUserId: vi.fn(),
    upsert: vi.fn(),
    saveRaw: vi.fn(),
    ...overrides,
  }
}

describe('ProfileUseCases', () => {
  describe('getProfile', () => {
    it('returns the profile when found', async () => {
      const profile = makeProfile()
      const repo = makeRepo({ findByUserId: vi.fn().mockResolvedValue(profile) })
      const uc = new ProfileUseCases(repo)
      expect(await uc.getProfile('user-1')).toEqual(profile)
      expect(repo.findByUserId).toHaveBeenCalledWith('user-1')
    })

    it('returns null when profile does not exist', async () => {
      const repo = makeRepo({ findByUserId: vi.fn().mockResolvedValue(null) })
      const uc = new ProfileUseCases(repo)
      expect(await uc.getProfile('user-1')).toBeNull()
    })
  })

  describe('updateProfile', () => {
    it('delegates to repo.upsert with correct args', async () => {
      const profile = makeProfile()
      const repo = makeRepo({ upsert: vi.fn().mockResolvedValue(profile) })
      const uc = new ProfileUseCases(repo)
      const patch = { githubUsername: 'bob' }
      const result = await uc.updateProfile('user-1', patch)
      expect(repo.upsert).toHaveBeenCalledWith('user-1', patch)
      expect(result).toEqual(profile)
    })
  })

  describe('saveFromOnboarding', () => {
    it('calls saveRaw with userId, rawText, and parsed profile', async () => {
      const profile = makeProfile()
      const repo = makeRepo({ saveRaw: vi.fn().mockResolvedValue(profile) })
      const uc = new ProfileUseCases(repo)
      await uc.saveFromOnboarding('user-1', 'raw text here', profile)
      expect(repo.saveRaw).toHaveBeenCalledWith('user-1', 'raw text here', profile)
    })

    it('fills missing contact.name from userInfo', async () => {
      const parsed = makeProfile({ contact: { name: null, email: null, phone: null, linkedin: null, github: null, leetcode: null, portfolio: null } })
      const repo = makeRepo({ saveRaw: vi.fn().mockResolvedValue(parsed) })
      const uc = new ProfileUseCases(repo)
      await uc.saveFromOnboarding('user-1', '', parsed, { name: 'Carol', email: 'c@c.com' })
      const savedProfile = (repo.saveRaw as ReturnType<typeof vi.fn>).mock.calls[0][2] as Profile
      expect(savedProfile.contact.name).toBe('Carol')
      expect(savedProfile.contact.email).toBe('c@c.com')
    })

    it('does NOT overwrite existing contact.name with userInfo', async () => {
      const parsed = makeProfile({ contact: { name: 'Existing', email: 'e@e.com', phone: null, linkedin: null, github: null, leetcode: null, portfolio: null } })
      const repo = makeRepo({ saveRaw: vi.fn().mockResolvedValue(parsed) })
      const uc = new ProfileUseCases(repo)
      await uc.saveFromOnboarding('user-1', '', parsed, { name: 'Override', email: 'o@o.com' })
      const savedProfile = (repo.saveRaw as ReturnType<typeof vi.fn>).mock.calls[0][2] as Profile
      expect(savedProfile.contact.name).toBe('Existing')
      expect(savedProfile.contact.email).toBe('e@e.com')
    })

    it('creates contact object when parsed.contact is missing', async () => {
      const parsed = { ...makeProfile(), contact: null as any }
      const repo = makeRepo({ saveRaw: vi.fn().mockResolvedValue(makeProfile()) })
      const uc = new ProfileUseCases(repo)
      await uc.saveFromOnboarding('user-1', '', parsed, { name: 'Dave', email: 'd@d.com' })
      const savedProfile = (repo.saveRaw as ReturnType<typeof vi.fn>).mock.calls[0][2]
      expect(savedProfile.contact.name).toBe('Dave')
    })

    it('works without userInfo (no crash)', async () => {
      const profile = makeProfile()
      const repo = makeRepo({ saveRaw: vi.fn().mockResolvedValue(profile) })
      const uc = new ProfileUseCases(repo)
      await expect(uc.saveFromOnboarding('user-1', '', profile)).resolves.not.toThrow()
    })
  })
})
