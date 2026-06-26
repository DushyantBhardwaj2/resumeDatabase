import { describe, it, expect } from 'vitest'
import { existsSync } from 'fs'
import { join } from 'path'

const DIST_TEMPLATES = join(__dirname, '..', '..', 'dist', 'infrastructure', 'latex', 'templates')
const NSUT_DIR = join(DIST_TEMPLATES, 'nsut-canonical')

describe('Template assets after build', () => {
  it('nsut-canonical/template.tex exists', () => {
    expect(existsSync(join(NSUT_DIR, 'template.tex'))).toBe(true)
  })

  it('nsut-canonical/config.json exists', () => {
    expect(existsSync(join(NSUT_DIR, 'config.json'))).toBe(true)
  })

  it('nsut-canonical/NSUT_logo.png exists', () => {
    expect(existsSync(join(NSUT_DIR, 'NSUT_logo.png'))).toBe(true)
  })
})
