import { describe, it, expect, vi } from 'vitest'
import { ResumeUseCases } from '../resume-use-cases'
import type { IProfileRepository, ITailoredResumeRepository } from '../../../domain/repositories'
import type { IAIService } from '../../ports/ai-service'
import type { IPDFParser } from '../../ports/pdf-parser'
import type { ILatexTemplateFiller, TemplateConfig } from '../../ports/latex-compiler'
import type { Profile } from '../../../domain/entities'

// ── Mock factories ────────────────────────────────────────────────────────────

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    contact: { name: 'Alice', email: 'a@a.com', phone: null, linkedin: null, github: null, leetcode: null, portfolio: null },
    education: [],
    experience: [
      {
        id: 'exp-1',
        company: 'Acme',
        role: 'Engineer',
        startDate: '2022-01',
        endDate: '2023-01',
        vaultBullets: [
          { id: 'b1', text: 'Did X', keywords: ['ts'], isAIGenerated: false },
          { id: 'b2', text: 'Did Y', keywords: ['js'], isAIGenerated: false },
          { id: 'b3', text: 'Did Z', keywords: [], isAIGenerated: false },
        ],
      },
    ],
    projects: [
      {
        id: 'proj-1',
        title: 'MyApp',
        url: null,
        techStack: ['React'],
        vaultBullets: [
          { id: 'pb1', text: 'Built UI', keywords: [], isAIGenerated: false },
        ],
      },
    ],
    skills: { languages: ['TS'], frameworks: ['React'], tools: [] },
    certificates: [],
    githubUsername: null,
    ...overrides,
  }
}

function makeTemplateConfig(overrides: Partial<TemplateConfig> = {}): TemplateConfig {
  return {
    id: 'nsut-canonical',
    name: 'NSUT',
    description: 'Test template',
    placeholders: {
      contact: [],
      education: { maxEntries: 2, fields: [] },
      experience: { maxEntries: 3, maxBullets: 5, fields: [] },
      projects: { maxEntries: 3, maxBullets: 5, fields: [] },
      skills: [],
    },
    sections: [],
    ...overrides,
  }
}

function makeProfileRepo(profile: Profile | null): IProfileRepository {
  return {
    findByUserId: vi.fn().mockResolvedValue(profile),
    upsert: vi.fn(),
    saveRaw: vi.fn(),
  }
}

function makeTailorRepo(): ITailoredResumeRepository {
  return {
    create: vi.fn().mockResolvedValue(undefined),
    findByUserId: vi.fn(),
    findById: vi.fn(),
    deleteById: vi.fn(),
    updateStyling: vi.fn(),
  }
}

function makeAiService(selectionResult?: object, summaryResult?: object): IAIService {
  const defaultSelection = {
    selectedExperienceIds: ['exp-1'],
    selectedProjectIds: ['proj-1'],
    selections: { 'exp-1': ['b1', 'b2'], 'proj-1': ['pb1'] },
    rationale: 'good match',
  }
  const defaultSummary = { summary: 'Generated summary.' }
  let callCount = 0
  return {
    generateStructuredData: vi.fn().mockImplementation(() => {
      callCount++
      if (callCount === 1) return Promise.resolve(selectionResult ?? defaultSelection)
      return Promise.resolve(summaryResult ?? defaultSummary)
    }),
  }
}

function makePdfParser(text = 'parsed pdf text'): IPDFParser {
  return { extractText: vi.fn().mockResolvedValue(text) }
}

function makeLatexFiller(config?: Partial<TemplateConfig>): ILatexTemplateFiller {
  return {
    getTemplateConfig: vi.fn().mockReturnValue(makeTemplateConfig(config)),
    fill: vi.fn().mockReturnValue('%PDF latex source'),
  }
}

function buildUseCases(profileRepo: IProfileRepository, overrides?: {
  tailorRepo?: ITailoredResumeRepository
  aiService?: IAIService
  pdfParser?: IPDFParser
  latexTemplate?: ILatexTemplateFiller
}) {
  const schema = { parse: (d: unknown) => d }
  return new ResumeUseCases(
    profileRepo,
    overrides?.tailorRepo ?? makeTailorRepo(),
    overrides?.aiService ?? makeAiService(),
    overrides?.pdfParser ?? makePdfParser(),
    overrides?.latexTemplate ?? makeLatexFiller(),
    'parse prompt',
    schema,
    () => 'bullet selector prompt',
    schema,
  )
}

// ── parseResume ───────────────────────────────────────────────────────────────

describe('ResumeUseCases.parseResume', () => {
  it('extracts text from PDF buffer and parses it via AI', async () => {
    const pdfParser = makePdfParser('resume text')
    const aiService = { generateStructuredData: vi.fn().mockResolvedValue({ contact: {}, experience: [] }) }
    const uc = buildUseCases(makeProfileRepo(null), { pdfParser, aiService })
    const result = await uc.parseResume(Buffer.from('pdf-bytes'))
    expect(pdfParser.extractText).toHaveBeenCalledWith(expect.any(Buffer))
    expect(result.rawText).toBe('resume text')
    expect(result.parsed).toBeDefined()
  })
})

// ── tailorResume ──────────────────────────────────────────────────────────────

describe('ResumeUseCases.tailorResume', () => {
  it('throws when profile is not found', async () => {
    const uc = buildUseCases(makeProfileRepo(null))
    await expect(uc.tailorResume('user-1', { jobTitle: 'SWE', company: 'Google', jobDescription: 'Build stuff' }))
      .rejects.toThrow('Profile not found')
  })

  it('assigns UUIDs to experience/projects that lack ids', async () => {
    const profile = makeProfile({
      experience: [{ company: 'Acme', role: 'Eng', startDate: null, endDate: null, vaultBullets: [] } as any],
      projects: [{ title: 'P', url: null, techStack: [], vaultBullets: [] } as any],
    })
    const profileRepo = makeProfileRepo(profile)
    const aiService = makeAiService({ selectedExperienceIds: [], selectedProjectIds: [], selections: {}, rationale: '' })
    const uc = buildUseCases(profileRepo, { aiService })
    const result = await uc.tailorResume('user-1', { jobTitle: 'SWE', company: 'G', jobDescription: 'JD' })
    // The assigned IDs flow through to the original profile used for tailoring
    expect(result.original.experience[0]).toHaveProperty('id')
    expect(result.original.projects[0]).toHaveProperty('id')
  })

  it('preserves existing ids', async () => {
    const profile = makeProfile()
    const uc = buildUseCases(makeProfileRepo(profile))
    const result = await uc.tailorResume('user-1', { jobTitle: 'SWE', company: 'G', jobDescription: 'JD' })
    expect(result.original.experience[0]).toMatchObject({ id: 'exp-1' })
    expect(result.original.projects[0]).toMatchObject({ id: 'proj-1' })
  })

  it('filters vault bullets based on AI selections', async () => {
    const profile = makeProfile()
    const aiService = makeAiService({
      selectedExperienceIds: ['exp-1'],
      selectedProjectIds: ['proj-1'],
      selections: { 'exp-1': ['b1'], 'proj-1': [] },
      rationale: 'matched',
    })
    const uc = buildUseCases(makeProfileRepo(profile), { aiService })
    const result = await uc.tailorResume('user-1', { jobTitle: 'SWE', company: 'G', jobDescription: 'JD' })
    const tailoredExp = result.tailored.experience.find(e => (e as any).id === 'exp-1')
    expect(tailoredExp?.vaultBullets).toHaveLength(1)
    expect(tailoredExp?.vaultBullets[0].id).toBe('b1')
  })

  it('preserves all bullets when entry key is absent from selections', async () => {
    const profile = makeProfile()
    // 'exp-1' absent from selections → all bullets kept
    const aiService = makeAiService({ selectedExperienceIds: ['exp-1'], selectedProjectIds: ['proj-1'], selections: {}, rationale: '' })
    const uc = buildUseCases(makeProfileRepo(profile), { aiService })
    const result = await uc.tailorResume('user-1', { jobTitle: 'SWE', company: 'G', jobDescription: 'JD' })
    const tailoredExp = result.tailored.experience.find(e => (e as any).id === 'exp-1')
    expect(tailoredExp?.vaultBullets).toHaveLength(3)
  })

  it('applies template maxEntries constraint to experience', async () => {
    const manyExp = Array.from({ length: 5 }, (_, i) => ({
      id: `exp-${i}`,
      company: `Co${i}`,
      role: 'Eng',
      startDate: null,
      endDate: null,
      vaultBullets: [],
    }))
    const profile = makeProfile({ experience: manyExp })
    const config: Partial<TemplateConfig> = {
      placeholders: {
        contact: [],
        education: { maxEntries: 1, fields: [] },
        experience: { maxEntries: 2, maxBullets: 10, fields: [] },
        projects: { maxEntries: 2, maxBullets: 10, fields: [] },
        skills: [],
      },
    }
    const latexTemplate = makeLatexFiller(config)
    const uc = buildUseCases(makeProfileRepo(profile), { latexTemplate })
    const result = await uc.tailorResume('user-1', { jobTitle: 'SWE', company: 'G', jobDescription: 'JD' })
    expect(result.tailored.experience.length).toBeLessThanOrEqual(2)
  })

  it('applies template maxBullets constraint per experience entry', async () => {
    const manyBullets = Array.from({ length: 8 }, (_, i) => ({
      id: `b${i}`, text: `Bullet ${i}`, keywords: [], isAIGenerated: false,
    }))
    const profile = makeProfile({
      experience: [{ id: 'exp-1', company: 'Acme', role: 'Eng', startDate: null, endDate: null, vaultBullets: manyBullets }],
    })
    const config: Partial<TemplateConfig> = {
      placeholders: {
        contact: [],
        education: { maxEntries: 2, fields: [] },
        experience: { maxEntries: 3, maxBullets: 3, fields: [] },
        projects: { maxEntries: 3, maxBullets: 3, fields: [] },
        skills: [],
      },
    }
    const latexTemplate = makeLatexFiller(config)
    // AI selects all 8
    const aiService = makeAiService({
      selectedExperienceIds: ['exp-1'],
      selectedProjectIds: [],
      selections: { 'exp-1': manyBullets.map(b => b.id) },
      rationale: '',
    })
    const uc = buildUseCases(makeProfileRepo(profile), { aiService, latexTemplate })
    const result = await uc.tailorResume('user-1', { jobTitle: 'SWE', company: 'G', jobDescription: 'JD' })
    const tailoredExp = result.tailored.experience.find(e => (e as any).id === 'exp-1')
    expect(tailoredExp?.vaultBullets.length).toBeLessThanOrEqual(3)
  })

  it('sets summary when AI generates one', async () => {
    const profile = makeProfile()
    const aiService = makeAiService(
      { selectedExperienceIds: ['exp-1'], selectedProjectIds: ['proj-1'], selections: {}, rationale: '' },
      { summary: 'A great candidate.' }
    )
    const uc = buildUseCases(makeProfileRepo(profile), { aiService })
    const result = await uc.tailorResume('user-1', { jobTitle: 'SWE', company: 'G', jobDescription: 'JD' })
    expect(result.tailored.summary).toBe('A great candidate.')
  })

  it('leaves summary null when AI summary generation fails', async () => {
    const profile = makeProfile()
    let callCount = 0
    const aiService: IAIService = {
      generateStructuredData: vi.fn().mockImplementation(() => {
        callCount++
        if (callCount === 1) return Promise.resolve({ selectedExperienceIds: ['exp-1'], selectedProjectIds: ['proj-1'], selections: {}, rationale: '' })
        return Promise.reject(new Error('Summary failed'))
      }),
    }
    const uc = buildUseCases(makeProfileRepo(profile), { aiService })
    const result = await uc.tailorResume('user-1', { jobTitle: 'SWE', company: 'G', jobDescription: 'JD' })
    expect(result.tailored.summary).toBeNull()
  })

  it('saves result to tailorRepo', async () => {
    const profile = makeProfile()
    const tailorRepo = makeTailorRepo()
    const uc = buildUseCases(makeProfileRepo(profile), { tailorRepo })
    await uc.tailorResume('user-1', { jobTitle: 'SWE', company: 'Google', jobDescription: 'JD' })
    expect(tailorRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        companyName: 'Google',
        jobTitle: 'SWE',
        jobDescription: 'JD',
      })
    )
  })

  it('returns complete result object with jobTitle, company, original, tailored, latex', async () => {
    const profile = makeProfile()
    const uc = buildUseCases(makeProfileRepo(profile))
    const result = await uc.tailorResume('user-1', { jobTitle: 'PM', company: 'Meta', jobDescription: 'JD' })
    expect(result).toHaveProperty('jobTitle', 'PM')
    expect(result).toHaveProperty('company', 'Meta')
    expect(result).toHaveProperty('original')
    expect(result).toHaveProperty('tailored')
    expect(result).toHaveProperty('latex')
  })
})
