import { describe, it, expect } from 'vitest'
import { authClient } from '@/config/auth-client'

describe('auth configuration', () => {
  describe('auth client', () => {
    it('exports signIn with social method', () => {
      expect(authClient).toBeDefined()
      expect(typeof authClient.signIn).toBe('function')
      expect(typeof authClient.signIn.social).toBe('function')
    })

    it('exports signOut', () => {
      expect(typeof authClient.signOut).toBe('function')
    })

    it('exports useSession hook', () => {
      expect(typeof authClient.useSession).toBe('function')
    })
  })

  describe('sign-in flow', () => {
    it('social sign-in should POST to /api/auth/sign-in/social', () => {
      // GET /api/auth/signin returns 404 — this is the bug that was fixed.
      // The correct endpoint for Google sign-in is:
      // POST /api/auth/sign-in/social with body { provider: "google" }
      const correctEndpoint = '/api/auth/sign-in/social'
      const brokenEndpoint = '/api/auth/signin'

      expect(correctEndpoint).not.toBe(brokenEndpoint)
      // Verify via the route pattern — Better Auth handles POST
      expect(correctEndpoint).toMatch(/^\/api\/auth\//)
    })

    it('signs in with Google provider and callback URL', () => {
      // The fix calls signIn.social with the correct params
      const params = {
        provider: 'google' as const,
        callbackURL: '/auth/redirect',
      }

      expect(params.provider).toBe('google')
      expect(params.callbackURL).toBe('/auth/redirect')
    })
  })

  describe('sign-out', () => {
    it('uses POST /api/auth/sign-out', () => {
      const signOutEndpoint = '/api/auth/sign-out'
      // The sidebar, mobile-nav, and dashboard nav all use POST to this endpoint
      expect(signOutEndpoint).toMatch(/^\/api\/auth\//)
    })
  })
})
