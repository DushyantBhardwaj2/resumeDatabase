import { describe, it, expect } from 'vitest'
import { authClient } from '@/config/auth-client'

describe('auth client configuration', () => {
  it('exports signIn with social method', () => {
    expect(authClient).toBeDefined()
    expect(typeof authClient.signIn).toBe('function')
    expect(typeof authClient.signIn.social).toBe('function')
  })

  it('exports signOut and useSession', () => {
    expect(typeof authClient.signOut).toBe('function')
    expect(typeof authClient.useSession).toBe('function')
  })
})
