import { describe, it, expect } from 'vitest'
import {
  computeCompleteness,
  completenessColor,
  completenessBg,
  completenessHint,
} from '../profile-utils'

// ── computeCompleteness ───────────────────────────────────────────────────────

describe('computeCompleteness', () => {
  it('returns 0 for empty/null profile', () => {
    expect(computeCompleteness({})).toBe(0)
    expect(computeCompleteness({ contact: null })).toBe(0)
  })

  it('returns 0 when there are no scoreable fields', () => {
    // No contact, education, experience, etc. → total = 0 → 0
    expect(computeCompleteness({})).toBe(0)
  })

  it('scores contact fields (4 fields)', () => {
    const profile = {
      contact: { phone: '123', linkedin: 'li', github: 'gh', portfolio: 'port' },
    }
    expect(computeCompleteness(profile)).toBe(100)
  })

  it('partial contact score (2 of 4)', () => {
    const profile = {
      contact: { phone: '123', linkedin: 'li', github: null, portfolio: null },
    }
    expect(computeCompleteness(profile)).toBe(50)
  })

  it('education adds 2 points when non-empty', () => {
    const profile = { education: [{ school: 'MIT' }] }
    expect(computeCompleteness(profile)).toBeGreaterThan(0)
  })

  it('experience adds 3 points when non-empty', () => {
    const profile = { experience: [{ company: 'Acme', role: 'Eng' }] }
    expect(computeCompleteness(profile)).toBeGreaterThan(0)
  })

  it('projects adds 2 points when non-empty', () => {
    const profile = { projects: [{ title: 'App' }] }
    expect(computeCompleteness(profile)).toBeGreaterThan(0)
  })

  it('skills adds 2 points when any language/framework/tool exists', () => {
    const profile = { skills: { languages: ['TS'], frameworks: [], tools: [] } }
    expect(computeCompleteness(profile)).toBeGreaterThan(0)
  })

  it('skills: empty arrays do not score', () => {
    const profile = { skills: { languages: [], frameworks: [], tools: [] } }
    expect(computeCompleteness(profile)).toBe(0)
  })

  it('githubUsername adds 1 point when present', () => {
    const profile = { githubUsername: 'janedoe' }
    expect(computeCompleteness(profile)).toBe(100)
  })

  it('full profile returns 100', () => {
    const profile = {
      contact: { phone: '123', linkedin: 'li', github: 'gh', portfolio: 'p' },
      education: [{ school: 'MIT' }],
      experience: [{ company: 'X', role: 'Y' }],
      projects: [{ title: 'Z' }],
      skills: { languages: ['TS'], frameworks: [], tools: [] },
      githubUsername: 'user',
    }
    expect(computeCompleteness(profile)).toBe(100)
  })

  it('rounds to nearest integer', () => {
    // 1 of 4 contact fields = 25%
    const profile = {
      contact: { phone: '123', linkedin: null, github: null, portfolio: null },
    }
    expect(computeCompleteness(profile)).toBe(25)
  })
})

// ── completenessColor ─────────────────────────────────────────────────────────

describe('completenessColor', () => {
  it('returns text-success for score >= 80', () => {
    expect(completenessColor(80)).toBe('text-success')
    expect(completenessColor(100)).toBe('text-success')
    expect(completenessColor(95)).toBe('text-success')
  })

  it('returns text-warning for score 50–79', () => {
    expect(completenessColor(50)).toBe('text-warning')
    expect(completenessColor(79)).toBe('text-warning')
    expect(completenessColor(65)).toBe('text-warning')
  })

  it('returns text-error for score below 50', () => {
    expect(completenessColor(0)).toBe('text-error')
    expect(completenessColor(49)).toBe('text-error')
    expect(completenessColor(25)).toBe('text-error')
  })
})

// ── completenessBg ────────────────────────────────────────────────────────────

describe('completenessBg', () => {
  it('returns bg-success for score >= 80', () => {
    expect(completenessBg(80)).toBe('bg-success')
    expect(completenessBg(100)).toBe('bg-success')
  })

  it('returns bg-warning for score 50–79', () => {
    expect(completenessBg(50)).toBe('bg-warning')
    expect(completenessBg(79)).toBe('bg-warning')
  })

  it('returns bg-error for score below 50', () => {
    expect(completenessBg(0)).toBe('bg-error')
    expect(completenessBg(49)).toBe('bg-error')
  })
})

// ── completenessHint ──────────────────────────────────────────────────────────

describe('completenessHint', () => {
  it('returns "Great job" hint for score >= 80', () => {
    expect(completenessHint(80)).toContain('Great job')
    expect(completenessHint(100)).toContain('Great job')
  })

  it('returns "Good start" hint for score 50–79', () => {
    expect(completenessHint(50)).toContain('Good start')
    expect(completenessHint(79)).toContain('Good start')
  })

  it('returns "Complete your profile" hint for score below 50', () => {
    expect(completenessHint(0)).toContain('Complete your profile')
    expect(completenessHint(49)).toContain('Complete your profile')
  })
})
