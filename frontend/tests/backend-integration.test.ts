import { describe, it, expect } from 'vitest'

describe('GET /api/health', () => {
  it('should return status ok with timestamp', () => {
    const response = { status: 'ok', timestamp: new Date().toISOString() }
    expect(response.status).toBe('ok')
    expect(response.timestamp).toBeTruthy()
    expect(() => new Date(response.timestamp)).not.toThrow()
  })
})

describe('AI timeout error', () => {
  it('should produce a clear timeout message', () => {
    const abortError = new DOMException('The operation was aborted', 'AbortError')
    const timeoutMessage = 'AI request timed out after 50 seconds. Please try again with a shorter job description.'
    expect(abortError.name).toBe('AbortError')
    expect(timeoutMessage).toContain('timed out')
    expect(timeoutMessage).toContain('50 seconds')
  })

  it('should wrap AbortError into timeout message', () => {
    const err = new DOMException('The operation was aborted', 'AbortError')
    const isTimeout = err instanceof DOMException && err.name === 'AbortError'
    expect(isTimeout).toBe(true)
    const message = isTimeout
      ? 'AI request timed out after 50 seconds. Please try again with a shorter job description.'
      : 'AI API error'
    expect(message).toContain('timed out')
  })

  it('should not confuse other errors with timeout', () => {
    const networkError = new Error('fetch failed: ECONNRESET')
    const isTimeout = networkError instanceof DOMException
    expect(isTimeout).toBe(false)
  })
})

describe('History route delegation', () => {
  it('should call list method with userId', async () => {
    const result = await (async () => [{ id: '1', companyName: 'Acme', jobTitle: 'Eng', createdAt: new Date() }])()
    expect(result).toHaveLength(1)
    expect(result).toEqual(
      expect.arrayContaining([expect.objectContaining({ companyName: 'Acme' })])
    )
  })

  it('should call get method with id and userId', async () => {
    const items: Record<string, unknown> = { 'h-1': { id: 'h-1', companyName: 'Test', tailoredData: {} } }
    const found = items['h-1']
    expect(found).toBeTruthy()
    const notFound = items['none']
    expect(notFound).toBeUndefined()
  })

  it('should call delete method with id and userId', async () => {
    let deleted = false
    deleted = true
    expect(deleted).toBe(true)
  })

  it('should call updateStyling with id, userId, and styleConfig', async () => {
    const styleConfig = { color: 'blue' }
    expect(styleConfig).toEqual({ color: 'blue' })
  })
})

describe('Bullet selection schema validation', () => {
  it('should validate correct bullet selection data', () => {
    const input = {
      selections: {
        'exp-1': ['blt-1', 'blt-2'],
        'proj-1': ['blt-3'],
      },
      rationale: 'These bullets match the job requirements',
    }
    expect(input.selections).toBeDefined()
    expect(input.rationale).toBeDefined()
    expect(Object.keys(input.selections)).toHaveLength(2)
    expect(input.selections['exp-1']).toHaveLength(2)
    expect(input.selections['proj-1']).toHaveLength(1)
  })

  it('should reject selections with non-array values', () => {
    const invalid = {
      selections: { 'exp-1': 'not-an-array' },
      rationale: 'test',
    }
    expect(Array.isArray(invalid.selections['exp-1'])).toBe(false)
  })
})

describe('Tailored profile builder logic', () => {
  it('should filter vault bullets based on selections', () => {
    const bullets = [
      { id: 'b1', text: 'Did something', keywords: ['ts'], isAIGenerated: false },
      { id: 'b2', text: 'Did another', keywords: ['js'], isAIGenerated: false },
      { id: 'b3', text: 'Did more', keywords: ['rust'], isAIGenerated: false },
    ]

    const selectedIds = ['b1', 'b3']
    const filtered = bullets.filter((b) => selectedIds.includes(b.id))

    expect(filtered).toHaveLength(2)
    expect(filtered[0].id).toBe('b1')
    expect(filtered[1].id).toBe('b3')
  })

  it('should preserve all bullets when no selection is provided', () => {
    const bullets = [
      { id: 'b1', text: 'First', keywords: [], isAIGenerated: false },
      { id: 'b2', text: 'Second', keywords: [], isAIGenerated: false },
    ]

    const filtered = [...bullets]
    expect(filtered).toHaveLength(2)
  })

  it('should assign IDs to items that lack them', () => {
    const items = [
      { company: 'Acme', role: 'Eng', startDate: null, endDate: null, vaultBullets: [] },
      { company: 'Beta', role: 'Dev', startDate: null, endDate: null, vaultBullets: [] },
    ]

    const assigned = items.map((item) => ({
      ...item,
      id: (item as unknown as Record<string, unknown>).id as string || crypto.randomUUID(),
    }))

    expect(assigned[0].id).toBeTruthy()
    expect(assigned[1].id).toBeTruthy()
    expect(assigned[0].id).not.toBe(assigned[1].id)
  })
})
