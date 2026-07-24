'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from '@/config/auth-client'
import { AuthLayout } from '@/components/layout/auth-layout'
import { EnvelopeSimple, GoogleLogo, Eye, EyeSlash, ArrowRight } from '@phosphor-icons/react/dist/ssr'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn.email({ email, password })
      if (result?.error) {
        setError(result.error.message || 'Invalid email or password')
        return
      }
      router.push('/auth/redirect')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = () => {
    signIn.social({ provider: 'google', callbackURL: '/auth/redirect' })
  }

  return (
    <AuthLayout>
      <div className="max-w-sm animate-fade-up">
        <h1 className="font-display text-3xl font-bold text-content tracking-tight mb-1">
          Welcome back
        </h1>
        <p className="text-content-muted text-sm mb-8">
          Sign in to your Resumint account
        </p>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="text-xs font-medium text-content-muted block mb-1.5">
              Email
            </label>
            <div className="relative">
              <EnvelopeSimple size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="w-full h-10 pl-9 pr-3 rounded-[var(--radius-md)] bg-surface border border-edge text-sm text-content placeholder:text-content-muted/50 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-shadow"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="text-xs font-medium text-content-muted block mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                className="w-full h-10 pl-3 pr-9 rounded-[var(--radius-md)] bg-surface border border-edge text-sm text-content placeholder:text-content-muted/50 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-shadow"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted hover:text-content cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-xs font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-[var(--radius-md)] bg-brand text-brand-fg text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
          >
            {loading ? 'Signing in...' : 'Sign in with Email'}
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-edge" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-surface px-3 text-xs text-content-muted">or continue with</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full h-10 rounded-[var(--radius-md)] border border-edge text-sm font-medium flex items-center justify-center gap-2 hover:bg-surface-subtle transition-colors cursor-pointer"
        >
          <GoogleLogo size={18} />
          Google
        </button>

        <p className="mt-6 text-center text-xs text-content-muted">
          Don&apos;t have an account?{' '}
          <button
            onClick={handleGoogleLogin}
            className="text-brand hover:underline font-medium cursor-pointer"
          >
            Sign up with Google
          </button>
        </p>
      </div>
    </AuthLayout>
  )
}
