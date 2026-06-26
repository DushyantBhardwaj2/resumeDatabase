import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SignInButton } from '@/components/sign-in-button'

// Mock the auth client
const mockSignInSocial = vi.fn()
vi.mock('@/config/auth-client', () => ({
  signIn: {
    social: (params: { provider: string; callbackURL: string }) => mockSignInSocial(params),
  },
}))

describe('SignInButton', () => {
  beforeEach(() => {
    mockSignInSocial.mockReset()
  })

  describe('minimal variant', () => {
    it('renders "Sign In" text', () => {
      render(<SignInButton variant="minimal" />)
      expect(screen.getByText('Sign In')).toBeDefined()
    })

    it('calls signIn.social with google on click', () => {
      render(<SignInButton variant="minimal" />)
      fireEvent.click(screen.getByText('Sign In'))
      expect(mockSignInSocial).toHaveBeenCalledWith({
        provider: 'google',
        callbackURL: '/auth/redirect',
      })
    })
  })

  describe('default variant', () => {
    it('renders "Sign in with Google" text', () => {
      render(<SignInButton />)
      expect(screen.getByText('Sign in with Google')).toBeDefined()
    })

    it('calls signIn.social with google and redirect on click', () => {
      render(<SignInButton />)
      fireEvent.click(screen.getByText('Sign in with Google'))
      expect(mockSignInSocial).toHaveBeenCalledWith({
        provider: 'google',
        callbackURL: '/auth/redirect',
      })
    })

    it('has the correct redirect path', () => {
      render(<SignInButton />)
      fireEvent.click(screen.getByText('Sign in with Google'))
      const { callbackURL } = mockSignInSocial.mock.calls[0][0]
      expect(callbackURL).toBe('/auth/redirect')
    })
  })
})
