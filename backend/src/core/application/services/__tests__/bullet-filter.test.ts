import { describe, it, expect } from 'vitest'
import { filterExperienceBySelection, filterProjectsBySelection } from '../bullet-filter'

function makeExp(id: string, bulletCount: number) {
  return {
    id,
    company: 'TestCo',
    role: 'Engineer',
    vaultBullets: Array.from({ length: bulletCount }, (_, i) => ({
      id: `${id}-b${i}`,
      text: `bullet ${i}`,
    })),
  }
}

function makeProj(id: string, bulletCount: number) {
  return {
    id,
    title: 'TestProj',
    vaultBullets: Array.from({ length: bulletCount }, (_, i) => ({
      id: `${id}-b${i}`,
      text: `bullet ${i}`,
    })),
  }
}

describe('filterExperienceBySelection', () => {
  it('returns all bullets when selection key is absent (undefined)', () => {
    const exp = [makeExp('e1', 3)]
    const result = filterExperienceBySelection(exp, {})
    expect(result[0].vaultBullets).toHaveLength(3)
  })

  it('returns all bullets when selectedBulletIds is null', () => {
    const exp = [makeExp('e1', 3)]
    const result = filterExperienceBySelection(exp, null)
    expect(result[0].vaultBullets).toHaveLength(3)
  })

  it('returns all bullets when selectedBulletIds is undefined', () => {
    const exp = [makeExp('e1', 3)]
    const result = filterExperienceBySelection(exp, undefined)
    expect(result[0].vaultBullets).toHaveLength(3)
  })

  it('returns zero bullets when selection key is present with empty array', () => {
    const exp = [makeExp('e1', 3)]
    const result = filterExperienceBySelection(exp, { e1: [] })
    expect(result[0].vaultBullets).toHaveLength(0)
  })

  it('returns only matching bullets when specific IDs are selected', () => {
    const exp = [makeExp('e1', 3)]
    const result = filterExperienceBySelection(exp, { e1: ['e1-b0', 'e1-b2'] })
    expect(result[0].vaultBullets).toHaveLength(2)
    expect(result[0].vaultBullets![0].id).toBe('e1-b0')
    expect(result[0].vaultBullets![1].id).toBe('e1-b2')
  })

  it('handles empty experience array', () => {
    const result = filterExperienceBySelection([], {})
    expect(result).toHaveLength(0)
  })

  it('handles entries without vaultBullets', () => {
    const exp = [{ id: 'e1', company: 'TestCo', role: 'Engineer' }]
    const result = filterExperienceBySelection(exp as any, {})
    expect(result[0].vaultBullets).toBeUndefined()
  })
})

describe('filterProjectsBySelection', () => {
  it('returns all bullets when selection key is absent (undefined)', () => {
    const projs = [makeProj('p1', 3)]
    const result = filterProjectsBySelection(projs, {})
    expect(result[0].vaultBullets).toHaveLength(3)
  })

  it('returns zero bullets when selection key is present with empty array', () => {
    const projs = [makeProj('p1', 3)]
    const result = filterProjectsBySelection(projs, { p1: [] })
    expect(result[0].vaultBullets).toHaveLength(0)
  })

  it('returns only matching bullets when specific IDs are selected', () => {
    const projs = [makeProj('p1', 3)]
    const result = filterProjectsBySelection(projs, { p1: ['p1-b1'] })
    expect(result[0].vaultBullets).toHaveLength(1)
    expect(result[0].vaultBullets![0].id).toBe('p1-b1')
  })

  it('handles empty projects array', () => {
    const result = filterProjectsBySelection([], {})
    expect(result).toHaveLength(0)
  })
})
