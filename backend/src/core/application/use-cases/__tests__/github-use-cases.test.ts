import { describe, it, expect, vi } from 'vitest'
import { GithubUseCases } from '../github-use-cases'
import type { IGitHubAnalyzer } from '../../ports/github-analyzer'
import type { IProjectRepository } from '../../../domain/repositories'

function makeAnalyzer(overrides: Partial<IGitHubAnalyzer> = {}): IGitHubAnalyzer {
  return {
    analyze: vi.fn().mockResolvedValue({
      name: 'my-project',
      fullName: 'user/my-project',
      description: 'Test description',
      readme: '# My README\nWith instructions.',
      languages: { TypeScript: 12000, CSS: 300 },
      topics: ['aws', 'serverless'],
      commitCount: 24,
      recentCommits: [
        { message: 'fix login bug', sha: 'sha1', date: '2024-01-01' },
        { message: 'setup routes', sha: 'sha2', date: '2024-01-02' }
      ],
      packageJson: { dependencies: { react: '18.2.0', next: '14.0.0' } },
      frameworks: [{ name: 'Next.js', confidence: 1, source: 'pkgjson' }],
      techStack: [{ name: 'React', confidence: 1, source: 'pkgjson' }],
    }),
    ...overrides,
  }
}

function makeProjectRepo(overrides: Partial<IProjectRepository> = {}): IProjectRepository {
  return {
    create: vi.fn(),
    findByUserId: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    ...overrides,
  }
}

describe('GithubUseCases', () => {
  describe('analyze', () => {
    it('delegates to githubAnalyzer.analyze', async () => {
      const analyzer = makeAnalyzer()
      const projectRepo = makeProjectRepo()
      const uc = new GithubUseCases(analyzer, projectRepo)
      const res = await uc.analyze('https://github.com/user/my-project')
      expect(analyzer.analyze).toHaveBeenCalledWith('https://github.com/user/my-project')
      expect(res.name).toBe('my-project')
    })
  })

  describe('importRepo', () => {
    it('returns a CREATE_PROJECT action structured correctly from repo analysis', async () => {
      const analyzer = makeAnalyzer()
      const projectRepo = makeProjectRepo()
      const uc = new GithubUseCases(analyzer, projectRepo)

      const result = await uc.importRepo('https://github.com/user/my-project', 'user-123')
      expect(analyzer.analyze).toHaveBeenCalledWith('https://github.com/user/my-project')
      expect(result.actions).toHaveLength(1)

      const action = result.actions[0]
      expect(action.type).toBe('CREATE_PROJECT')
      expect(action.project.title).toBe('my-project')
      expect(action.project.githubUrl).toBe('https://github.com/user/my-project')
      expect(action.project.userId).toBe('user-123')
      expect(action.project.bullets).toHaveLength(3) // 2 commits + 1 readme snippet
      expect(action.project.bullets[0].text).toBe('fix login bug')
      expect(action.project.techStack).toContain('TypeScript')
      expect(action.project.techStack).toContain('React')
      expect(action.project.techStack).toContain('Next.js')
      expect(action.project.tags).toContain('aws')
      expect(action.project.tags).toContain('TypeScript')
    })
  })
})
