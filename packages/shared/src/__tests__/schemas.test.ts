import { describe, it, expect } from 'vitest'
import {
  vaultBulletSchema,
  educationSchema,
  experienceEntrySchema,
  projectEntrySchema,
  parsedResumeSchema,
  tailorOutputSchema,
  bulletSelectionSchema,
  bulletsSchema,
  summarySchema,
} from '../index'

// ── educationSchema ───────────────────────────────────────────────────────────

describe('educationSchema', () => {
  it('generates a unique id when omitted', () => {
    const result = educationSchema.parse({ school: 'NSUT', degree: 'B.Tech', gpa: null, startYear: null, endYear: null })
    expect(result.id).toBeTruthy()
    expect(typeof result.id).toBe('string')
  })

  it('preserves a provided id', () => {
    const result = educationSchema.parse({ id: 'edu-123', school: 'NSUT', degree: 'B.Tech', gpa: null, startYear: null, endYear: null })
    expect(result.id).toBe('edu-123')
  })

  it('generates unique ids across multiple entries', () => {
    const a = educationSchema.parse({ school: 'A', degree: 'B', gpa: null, startYear: null, endYear: null })
    const b = educationSchema.parse({ school: 'C', degree: 'D', gpa: null, startYear: null, endYear: null })
    expect(a.id).not.toBe(b.id)
  })
})

// ── vaultBulletSchema ─────────────────────────────────────────────────────────

describe('vaultBulletSchema', () => {
  it('applies default keywords: [] when omitted', () => {
    const result = vaultBulletSchema.parse({ id: '1', text: 'Did X' })
    expect(result.keywords).toEqual([])
  })

  it('applies default isAIGenerated: false when omitted', () => {
    const result = vaultBulletSchema.parse({ id: '1', text: 'Did X' })
    expect(result.isAIGenerated).toBe(false)
  })

  it('preserves provided keywords', () => {
    const result = vaultBulletSchema.parse({ id: '1', text: 'Did X', keywords: ['ts', 'react'] })
    expect(result.keywords).toEqual(['ts', 'react'])
  })

  it('accepts an optional category', () => {
    const result = vaultBulletSchema.parse({ id: '1', text: 'Led team', category: 'LEADERSHIP' })
    expect(result.category).toBe('LEADERSHIP')
  })

  it('rejects invalid category values', () => {
    expect(() => vaultBulletSchema.parse({ id: '1', text: 'x', category: 'INVALID' })).toThrow()
  })

  it('requires id and text', () => {
    expect(() => vaultBulletSchema.parse({})).toThrow()
    expect(() => vaultBulletSchema.parse({ id: '1' })).toThrow()
  })
})

// ── experienceEntrySchema ─────────────────────────────────────────────────────

describe('experienceEntrySchema (transform)', () => {
  const base = {
    company: 'Acme',
    role: 'SWE',
    startDate: '2022-01',
    endDate: '2023-01',
  }

  it('migrates bulletPoints → vaultBullets when vaultBullets is empty', () => {
    const result = experienceEntrySchema.parse({
      ...base,
      vaultBullets: [],
      bulletPoints: ['Built X', 'Led Y'],
    })
    expect(result.vaultBullets).toHaveLength(2)
    expect(result.vaultBullets[0].text).toBe('Built X')
    expect(result.vaultBullets[0].isAIGenerated).toBe(true)
    expect(result.vaultBullets[0].id).toBeTruthy()
  })

  it('preserves existing vaultBullets even when bulletPoints also present', () => {
    const existing = [{ id: 'b1', text: 'Existing', keywords: [], isAIGenerated: false }]
    const result = experienceEntrySchema.parse({
      ...base,
      vaultBullets: existing,
      bulletPoints: ['Override attempt'],
    })
    expect(result.vaultBullets).toHaveLength(1)
    expect(result.vaultBullets[0].id).toBe('b1')
  })

  it('produces empty vaultBullets when both are empty/absent', () => {
    const result = experienceEntrySchema.parse({ ...base, vaultBullets: [] })
    expect(result.vaultBullets).toHaveLength(0)
  })

  it('each migrated vaultBullet has a unique id', () => {
    const result = experienceEntrySchema.parse({
      ...base,
      vaultBullets: [],
      bulletPoints: ['A', 'B', 'C'],
    })
    const ids = result.vaultBullets.map((b: any) => b.id)
    expect(new Set(ids).size).toBe(3)
  })
})

// ── projectEntrySchema ────────────────────────────────────────────────────────

describe('projectEntrySchema (transform)', () => {
  const base = {
    title: 'MyApp',
    url: 'https://example.com',
    techStack: ['React', 'Node.js'],
  }

  it('migrates bulletPoints → vaultBullets when vaultBullets is empty', () => {
    const result = projectEntrySchema.parse({
      ...base,
      vaultBullets: [],
      bulletPoints: ['Shipped MVP', 'Scaled to 10k users'],
    })
    expect(result.vaultBullets).toHaveLength(2)
    expect(result.vaultBullets[1].text).toBe('Scaled to 10k users')
    expect(result.vaultBullets[0].isAIGenerated).toBe(true)
  })

  it('preserves existing vaultBullets over bulletPoints', () => {
    const existing = [{ id: 'p1', text: 'Real bullet', keywords: [], isAIGenerated: false }]
    const result = projectEntrySchema.parse({
      ...base,
      vaultBullets: existing,
      bulletPoints: ['Should be ignored'],
    })
    expect(result.vaultBullets).toHaveLength(1)
    expect(result.vaultBullets[0].text).toBe('Real bullet')
  })

  it('null url is accepted', () => {
    const result = projectEntrySchema.parse({
      title: 'NullUrl',
      url: null,
      techStack: [],
      vaultBullets: [],
    })
    expect(result.url).toBeNull()
  })
})

// ── bulletsSchema (legacyBulletsSchema) ───────────────────────────────────────

describe('bulletsSchema (legacy migration)', () => {
  it('prefers vaultBullets when non-empty', () => {
    const vault = [{ id: 'v1', text: 'Vault bullet', keywords: [], isAIGenerated: false }]
    const result = bulletsSchema.parse({ vaultBullets: vault, bullets: ['Legacy'] })
    expect(result.vaultBullets[0].id).toBe('v1')
  })

  it('migrates bullets → vaultBullets when vaultBullets is empty', () => {
    const result = bulletsSchema.parse({ vaultBullets: [], bullets: ['A', 'B'] })
    expect(result.vaultBullets).toHaveLength(2)
    expect(result.vaultBullets[0].text).toBe('A')
    expect(result.vaultBullets[0].isAIGenerated).toBe(true)
  })

  it('returns empty vaultBullets when both are empty', () => {
    const result = bulletsSchema.parse({ vaultBullets: [] })
    expect(result.vaultBullets).toEqual([])
  })
})

// ── parsedResumeSchema ────────────────────────────────────────────────────────

describe('parsedResumeSchema', () => {
  it('migrates old bullets[] on experience entries', () => {
    const input = {
      contact: { name: 'Alice', email: 'a@a.com', phone: null, linkedin: null, github: null, portfolio: null },
      education: [],
      experience: [
        {
          company: 'Acme',
          role: 'Eng',
          startDate: '2022-01',
          endDate: '2023-01',
          vaultBullets: [],
          bullets: ['Did something', 'Did another thing'],
        },
      ],
      projects: [],
      skills: { languages: [], frameworks: [], tools: [] },
    }
    const result = parsedResumeSchema.parse(input)
    expect(result.experience[0].vaultBullets).toHaveLength(2)
    expect(result.experience[0].vaultBullets[0].text).toBe('Did something')
  })

  it('migrates old bullets[] on project entries', () => {
    const input = {
      contact: { name: 'Alice', email: 'a@a.com', phone: null, linkedin: null, github: null, portfolio: null },
      education: [],
      experience: [],
      projects: [
        {
          title: 'MyApp',
          techStack: ['React'],
          vaultBullets: [],
          bullets: ['Built UI'],
          url: null,
        },
      ],
      skills: { languages: [], frameworks: [], tools: [] },
    }
    const result = parsedResumeSchema.parse(input)
    expect(result.projects[0].vaultBullets).toHaveLength(1)
    expect(result.projects[0].vaultBullets[0].text).toBe('Built UI')
  })

  it('preserves new vaultBullets format', () => {
    const vault = [{ id: 'v1', text: 'Led team', keywords: ['leadership'], isAIGenerated: false }]
    const input = {
      contact: { name: 'Alice', email: 'a@a.com', phone: null, linkedin: null, github: null, portfolio: null },
      education: [],
      experience: [
        { company: 'Acme', role: 'Eng', startDate: null, endDate: null, vaultBullets: vault, bullets: ['ignored'] },
      ],
      projects: [],
      skills: { languages: [], frameworks: [], tools: [] },
    }
    const result = parsedResumeSchema.parse(input)
    expect(result.experience[0].vaultBullets[0].id).toBe('v1')
  })
})

// ── tailorOutputSchema ────────────────────────────────────────────────────────

describe('tailorOutputSchema', () => {
  it('parses valid tailor output', () => {
    const input = {
      summary: 'A great candidate.',
      experience: [{ company: 'Acme', role: 'Eng', startDate: null, endDate: null }],
      projects: [{ title: 'MyApp', techStack: ['React'], vaultBullets: [], url: null }],
      skills: { languages: ['TS'], frameworks: [], tools: [] },
    }
    const result = tailorOutputSchema.parse(input)
    expect(result.summary).toBe('A great candidate.')
  })

  it('accepts null summary', () => {
    const input = {
      summary: null,
      experience: [],
      projects: [],
      skills: { languages: [], frameworks: [], tools: [] },
    }
    const result = tailorOutputSchema.parse(input)
    expect(result.summary).toBeNull()
  })
})

// ── bulletSelectionSchema ─────────────────────────────────────────────────────

describe('bulletSelectionSchema', () => {
  it('parses valid selection with rationale', () => {
    const input = {
      selectedExperienceIds: ['exp-1'],
      selectedProjectIds: ['proj-1'],
      selections: { 'exp-1': ['b1', 'b2'], 'proj-1': [] },
      rationale: 'These bullets match the JD well.',
    }
    const result = bulletSelectionSchema.parse(input)
    expect(result.selections['exp-1']).toEqual(['b1', 'b2'])
    expect(result.rationale).toBe('These bullets match the JD well.')
  })

  it('fails when rationale is missing', () => {
    expect(() => bulletSelectionSchema.parse({ selectedExperienceIds: [], selectedProjectIds: [], selections: {} })).toThrow()
  })

  it('accepts empty selections record', () => {
    const result = bulletSelectionSchema.parse({ selectedExperienceIds: [], selectedProjectIds: [], selections: {}, rationale: 'No matches.' })
    expect(result.selections).toEqual({})
  })
})

// ── summarySchema ─────────────────────────────────────────────────────────────

describe('summarySchema', () => {
  it('parses a valid summary', () => {
    const result = summarySchema.parse({ summary: 'Great candidate.' })
    expect(result.summary).toBe('Great candidate.')
  })

  it('rejects missing summary', () => {
    expect(() => summarySchema.parse({})).toThrow()
  })
})
