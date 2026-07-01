import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GithubUseCases } from '../github-use-cases'
import type { IGitHubRepoRepository, IProfileRepository } from '../../../domain/repositories'
import type { IAIService } from '../../ports/ai-service'
import type { Profile } from '../../../domain/entities'

// ── Factories ─────────────────────────────────────────────────────────────────

function makeGithubRepo(): IGitHubRepoRepository {
  return { upsertRepos: vi.fn().mockResolvedValue(undefined) }
}

function makeProfileRepo(existingProfile: Profile | null = null): IProfileRepository {
  return {
    findByUserId: vi.fn().mockResolvedValue(existingProfile),
    upsert: vi.fn().mockResolvedValue({ projects: [] } as any),
    saveRaw: vi.fn(),
  }
}

function makeAiService(bullets = ['Built the app using Node.js']): IAIService {
  return {
    generateStructuredData: vi.fn().mockResolvedValue(bullets),
  }
}

function buildUC(
  profileRepo: IProfileRepository = makeProfileRepo(),
  githubRepo: IGitHubRepoRepository = makeGithubRepo(),
  ai: IAIService = makeAiService(),
) {
  const arraySchema = { parse: (d: unknown) => d as string[] }
  return new GithubUseCases(githubRepo, profileRepo, ai, 'Generate bullets from README', arraySchema)
}

const repos = [
  { name: 'my-api', url: 'https://github.com/user/my-api', language: 'TypeScript' },
]

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GithubUseCases.importRepos', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '# My API\n\nA great project.',
    }))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches README from GitHub API', async () => {
    const uc = buildUC()
    await uc.importRepos('user-1', repos)
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      expect.stringContaining('api.github.com'),
      expect.objectContaining({ headers: expect.objectContaining({ Accept: 'application/vnd.github.v3.raw' }) })
    )
  })

  it('uses AI to generate bullets from README', async () => {
    const ai = makeAiService(['Implemented REST API', 'Deployed on Railway'])
    const uc = buildUC(makeProfileRepo(), makeGithubRepo(), ai)
    const result = await uc.importRepos('user-1', repos)
    expect(ai.generateStructuredData).toHaveBeenCalledOnce()
    expect(result.imported).toBe(1)
  })

  it('uses fallback bullet when README fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    const ai = makeAiService()
    const uc = buildUC(makeProfileRepo(), makeGithubRepo(), ai)
    const result = await uc.importRepos('user-1', repos)
    // Should not throw, AI won't be called (caught), fallback used
    expect(result.imported).toBe(1)
    // Repo still upserted
    expect(result.projects).toHaveLength(1)
  })

  it('upserts repos to githubRepo', async () => {
    const githubRepo = makeGithubRepo()
    const uc = buildUC(makeProfileRepo(), githubRepo)
    await uc.importRepos('user-1', repos)
    expect(githubRepo.upsertRepos).toHaveBeenCalledWith('user-1', expect.arrayContaining([
      expect.objectContaining({ repoName: 'my-api', repoUrl: 'https://github.com/user/my-api' }),
    ]))
  })

  it('deduplicates repos: does not add project if URL already exists', async () => {
    const existingProfile: any = {
      projects: [{ id: 'p-existing', title: 'my-api', url: 'https://github.com/user/my-api', techStack: [], vaultBullets: [] }],
      contact: {}, education: [], experience: [], skills: { languages: [], frameworks: [], tools: [] }, certificates: [],
    }
    const profileRepo = makeProfileRepo(existingProfile)
    const uc = buildUC(profileRepo)
    const result = await uc.importRepos('user-1', repos)
    // imported counts the repos processed, but merged result should not duplicate
    const urls = result.projects.map(p => p.url)
    expect(urls.filter(u => u === 'https://github.com/user/my-api')).toHaveLength(1)
  })

  it('prepends new projects to the front of existing projects list', async () => {
    const existingProfile: any = {
      projects: [{ id: 'p-old', title: 'old-repo', url: 'https://github.com/user/old-repo', techStack: [], vaultBullets: [] }],
      contact: {}, education: [], experience: [], skills: { languages: [], frameworks: [], tools: [] }, certificates: [],
    }
    const profileRepo = makeProfileRepo(existingProfile)
    const uc = buildUC(profileRepo)
    const result = await uc.importRepos('user-1', [
      { name: 'new-api', url: 'https://github.com/user/new-api', language: 'Go' },
    ])
    // New projects come before old ones
    expect(result.projects[0].title).toBe('new-api')
    expect(result.projects[result.projects.length - 1].title).toBe('old-repo')
  })

  it('creates vaultBullets from generated bullets', async () => {
    const ai = makeAiService(['Led team', 'Deployed microservices'])
    const uc = buildUC(makeProfileRepo(), makeGithubRepo(), ai)
    const result = await uc.importRepos('user-1', repos)
    const project = result.projects[0]
    expect(project.vaultBullets).toHaveLength(2)
    expect(project.vaultBullets[0]).toHaveProperty('id')
    expect(project.vaultBullets[0].text).toBe('Led team')
  })

  it('handles null language gracefully', async () => {
    const uc = buildUC()
    const result = await uc.importRepos('user-1', [
      { name: 'no-lang', url: 'https://github.com/user/no-lang', language: null },
    ])
    expect(result.projects[0].techStack).toEqual([])
  })
})
