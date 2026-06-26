import { describe, it, expect, beforeAll } from 'vitest'
import { LatexTemplateFiller } from '../latex-template'

let filler: LatexTemplateFiller

beforeAll(() => {
  filler = new LatexTemplateFiller()
})

describe('LatexTemplateFiller', () => {
  it('loads nsut-canonical template config', () => {
    const config = filler.getTemplateConfig('nsut-canonical')
    expect(config.id).toBe('nsut-canonical')
    expect(config.placeholders.experience.maxEntries).toBe(5)
    expect(config.placeholders.projects.maxBullets).toBe(5)
  })

  it('loads ats-clean template config', () => {
    const config = filler.getTemplateConfig('ats-clean')
    expect(config.id).toBe('ats-clean')
    expect(config.placeholders.experience.maxEntries).toBe(10)
  })

  it('generated LaTeX includes NSUT_logo.png', () => {
    const result = filler.fill(
      'nsut-canonical',
      { name: 'Test User', phone: '', email: 'test@test.com', linkedin: '', github: '', leetcode: '' },
      [],
      [],
      [],
      null,
      {}
    )
    expect(result).toContain('NSUT_logo.png')
  })

  it('handles project URL null safely', () => {
    const contact = { name: 'Test', phone: '', email: 't@t.com', linkedin: '', github: '', leetcode: '' }
    const projects = [
      {
        title: 'Proj1',
        techStack: ['Node'],
        vaultBullets: [{ id: 'b1', text: 'Did stuff', keywords: [] }],
        url: null,
      },
    ]
    const result = filler.fill('nsut-canonical', contact, [], [], projects, null, { projects })
    // Should not throw — the url null should be safely cast to ""
    expect(result).toContain('Proj1')
  })

  it('handles project URL undefined safely', () => {
    const contact = { name: 'Test', phone: '', email: 't@t.com', linkedin: '', github: '', leetcode: '' }
    const projects = [
      {
        title: 'Proj2',
        techStack: ['Node'],
        vaultBullets: [{ id: 'b1', text: 'Did stuff', keywords: [] }],
      },
    ]
    const result = filler.fill('nsut-canonical', contact, [], [], projects, null, { projects })
    expect(result).toContain('Proj2')
  })

  it('handles project URL string safely', () => {
    const contact = { name: 'Test', phone: '', email: 't@t.com', linkedin: '', github: '', leetcode: '' }
    const projects = [
      {
        title: 'Proj3',
        techStack: ['Node'],
        vaultBullets: [{ id: 'b1', text: 'Did stuff', keywords: [] }],
        url: 'https://github.com/test/proj',
      },
    ]
    const result = filler.fill('nsut-canonical', contact, [], [], projects, null, { projects })
    expect(result).toContain('https://github.com/test/proj')
  })
})
