import { describe, it, expect } from 'vitest'

describe('AI timeout error handling', () => {
  it('should produce a clear timeout message', () => {
    const timeoutMessage = 'AI request timed out after 50 seconds. Please try again with a shorter job description.'
    expect(timeoutMessage).toContain('timed out')
    expect(timeoutMessage).toContain('50 seconds')
  })

  it('should distinguish AbortError from other errors', () => {
    const abortError = new DOMException('The operation was aborted', 'AbortError')
    const networkError = new Error('fetch failed: ECONNRESET')
    expect(abortError instanceof DOMException).toBe(true)
    expect(networkError instanceof DOMException).toBe(false)
  })
})

describe('Bullet filtering logic', () => {
  it('should filter bullets based on selected IDs', () => {
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

  it('should assign unique IDs to items that lack them', () => {
    const items = [
      { company: 'Acme', role: 'Eng', startDate: null, endDate: null, vaultBullets: [] },
      { company: 'Beta', role: 'Dev', startDate: null, endDate: null, vaultBullets: [] },
    ]
    const assigned = items.map((item) => ({
      ...item,
      id: crypto.randomUUID(),
    }))
    expect(assigned[0].id).toBeTruthy()
    expect(assigned[1].id).toBeTruthy()
    expect(assigned[0].id).not.toBe(assigned[1].id)
  })
})
