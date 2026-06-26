'use client'

import { ArrowRight } from '@phosphor-icons/react/dist/ssr'
import { signIn } from '@/config/auth-client'

export function SignInButton({ variant = 'default' }: { variant?: 'default' | 'minimal' }) {
  const handleSignIn = () => {
    signIn.social({
      provider: 'google',
      callbackURL: '/auth/redirect',
    })
  }

  if (variant === 'minimal') {
    return (
      <button
        onClick={handleSignIn}
        className="bg-brand text-brand-fg px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium hover:opacity-90 transition-opacity"
      >
        Sign In
      </button>
    )
  }

  return (
    <button
      onClick={handleSignIn}
      className="bg-brand text-brand-fg rounded-[var(--radius-md)] px-6 py-3 font-medium text-sm inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
    >
      Sign in with Google
      <ArrowRight size={16} />
    </button>
  )
}
