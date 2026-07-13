import { describe, it, expect } from 'vitest'
import { normalizeProfile, getEmptyProfile, countSectionItems } from '@/lib/normalize-profile'

describe('normalizeProfile', () => {
  it('returns empty profile for null/undefined input', () => {
    const empty = getEmptyProfile()
    expect(normalizeProfile(null)).toEqual(empty)
    expect(normalizeProfile(undefined)).toEqual(empty)
    expect(normalizeProfile({})).toEqual(empty)
  })

  it('converts old string bullets to VaultBullet objects', () => {
    const input = {
      contact: {},
      education: [],
      experience: [{ company: 'Acme', role: 'Eng', vaultBullets: ['Did stuff', 'Did more'] }],
      projects: [{ title: 'Proj', techStack: [], vaultBullets: ['Built thing'] }],
      skills: { languages: [], frameworks: [], tools: [] },
    }
    const result = normalizeProfile(input)
    expect(result.experience[0].vaultBullets).toHaveLength(2)
    expect(result.experience[0].vaultBullets[0]).toHaveProperty('id')
    expect(result.experience[0].vaultBullets[0].text).toBe('Did stuff')
    expect(result.experience[0].vaultBullets[0].isAIGenerated).toBe(false)
    expect(result.experience[0].vaultBullets[0].keywords).toEqual([])
    expect(result.projects[0].vaultBullets[0].text).toBe('Built thing')
  })

  it('preserves existing VaultBullet objects', () => {
    const bullet = { id: 'abc-123', text: 'Hello', keywords: ['test'], isAIGenerated: true }
    const input = {
      contact: {},
      education: [],
      experience: [{ company: 'Acme', role: 'Eng', vaultBullets: [bullet] }],
      projects: [],
      skills: { languages: [], frameworks: [], tools: [] },
    }
    const result = normalizeProfile(input)
    expect(result.experience[0].vaultBullets[0].id).toBe('abc-123')
    expect(result.experience[0].vaultBullets[0].keywords).toEqual(['test'])
    expect(result.experience[0].vaultBullets[0].isAIGenerated).toBe(true)
  })

  it('converts single education object to array', () => {
    const input = {
      contact: {},
      education: { school: 'MIT', degree: 'BS', gpa: '4.0' },
      experience: [],
      projects: [],
      skills: { languages: [], frameworks: [], tools: [] },
    }
    const result = normalizeProfile(input)
    expect(Array.isArray(result.education)).toBe(true)
    expect(result.education).toHaveLength(1)
    expect(result.education[0].school).toBe('MIT')
  })

  it('preserves education array', () => {
    const input = {
      contact: {},
      education: [{ school: 'MIT', degree: 'BS' }, { school: 'Stanford', degree: 'MS' }],
      experience: [],
      projects: [],
      skills: { languages: [], frameworks: [], tools: [] },
    }
    const result = normalizeProfile(input)
    expect(result.education).toHaveLength(2)
    expect(result.education[1].school).toBe('Stanford')
  })

  it('generates missing ids on experience and projects', () => {
    const input = {
      contact: {},
      education: [],
      experience: [{ company: 'Acme', role: 'Eng', vaultBullets: [] }],
      projects: [{ title: 'Proj', techStack: [], vaultBullets: [] }],
      skills: { languages: [], frameworks: [], tools: [] },
    }
    const result = normalizeProfile(input)
    expect(result.experience[0].id).toBeTruthy()
    expect(result.projects[0].id).toBeTruthy()
    expect(result.experience[0].id).not.toBe(result.projects[0].id)
  })

  it('converts techStack string to array', () => {
    const input = {
      contact: {},
      education: [],
      experience: [],
      projects: [{ title: 'P', techStack: 'React, Node, TS', vaultBullets: [] }],
      skills: { languages: [], frameworks: [], tools: [] },
    }
    const result = normalizeProfile(input)
    expect(result.projects[0].techStack).toEqual(['React', 'Node', 'TS'])
  })

  it('normalizes contact with all fields', () => {
    const input = {
      contact: { name: 'John', email: 'j@j.com', phone: '123', linkedin: 'in/j', github: 'j', leetcode: 'j', portfolio: 'j.dev' },
      education: [],
      experience: [],
      projects: [],
      skills: { languages: [], frameworks: [], tools: [] },
    }
    const result = normalizeProfile(input)
    expect(result.contact.name).toBe('John')
    expect(result.contact.email).toBe('j@j.com')
    expect(result.contact.leetcode).toBe('j')
    expect(result.contact.portfolio).toBe('j.dev')
  })

  it('handles empty certificates', () => {
    const input = {
      contact: {},
      education: [],
      experience: [],
      projects: [],
      skills: { languages: [], frameworks: [], tools: [] },
    }
    const result = normalizeProfile(input)
    expect(result.certificates).toEqual([])
  })

  it('normalizes certificates', () => {
    const input = {
      contact: {},
      education: [],
      experience: [],
      projects: [],
      skills: { languages: [], frameworks: [], tools: [] },
      certificates: [{ name: 'AWS', issuer: 'Amazon', url: 'https://', date: '2025' }],
    }
    const result = normalizeProfile(input)
    expect(result.certificates).toHaveLength(1)
    expect(result.certificates[0].name).toBe('AWS')
    expect(result.certificates[0].id).toBeTruthy()
  })
})

describe('countSectionItems', () => {
  it('counts all sections correctly', () => {
    const data = getEmptyProfile()
    data.contact.name = 'John'
    data.education.push({ id: crypto.randomUUID(), school: 'MIT', degree: 'BS', gpa: null, startYear: null, endYear: null })
    data.experience.push({ id: '1', company: 'Acme', role: 'Eng', startDate: '', endDate: '', current: false, vaultBullets: [] })
    data.projects.push({ id: '1', title: 'P', url: '', techStack: [], vaultBullets: [] })
    data.skills.languages = ['TS', 'Python']

    const counts = countSectionItems(data)
    expect(counts.contact).toBe(1)
    expect(counts.education).toBe(1)
    expect(counts.experience).toBe(1)
    expect(counts.projects).toBe(1)
    expect(counts.skills).toBe(2)
    expect(counts.certificates).toBe(0)
  })

  it('returns 0 for empty profile', () => {
    const counts = countSectionItems(getEmptyProfile())
    expect(counts.contact).toBe(0)
    expect(counts.education).toBe(0)
  })
})
