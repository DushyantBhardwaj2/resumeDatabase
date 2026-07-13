import { describe, it, expect } from 'vitest'

describe('auth redirect URL construction', () => {
  it('should encode error param in redirect URL', () => {
    const error = 'access_denied'
    const redirectUrl = `/?error=${encodeURIComponent(error)}`
    expect(redirectUrl).toBe('/?error=access_denied')
  })
})
