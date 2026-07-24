'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthLayout } from '@/components/layout/auth-layout'
import { fetchApi } from '@/config/api-client'
import { Eye, EyeSlash, Check, ArrowRight } from '@phosphor-icons/react/dist/ssr'

export default function SetupPasswordPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchApi('/api/protected/auth/password-status').then(async (res) => {
      if (res.ok) {
        const data = await res.json()
        if (data.hasPassword) {
          router.replace('/auth/redirect')
        }
      }
    }).catch(() => {})
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const res = await fetchApi('/api/protected/auth/set-password', {
        method: 'POST',
        body: JSON.stringify({ name, password }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to set password')
        return
      }

      router.push('/onboarding')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="max-w-sm animate-fade-up">
        <div className="w-10 h-10 rounded-full bg-brand-light flex items-center justify-center mb-4">
          <Check size={20} className="text-brand" />
        </div>

        <h1 className="font-display text-3xl font-bold text-content tracking-tight mb-1">
          Almost there!
        </h1>
        <p className="text-content-muted text-sm mb-8">
          Set your name and a password so you can sign in with email next time.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="text-xs font-medium text-content-muted block mb-1.5">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              required
              className="w-full h-10 px-3 rounded-[var(--radius-md)] bg-surface border border-edge text-sm text-content placeholder:text-content-muted/50 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-shadow"
            />
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
                placeholder="At least 8 characters"
                required
                minLength={8}
                autoComplete="new-password"
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

          <div>
            <label htmlFor="confirmPassword" className="text-xs font-medium text-content-muted block mb-1.5">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              required
              autoComplete="new-password"
              className="w-full h-10 px-3 rounded-[var(--radius-md)] bg-surface border border-edge text-sm text-content placeholder:text-content-muted/50 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-shadow"
            />
          </div>

          {error && (
            <p className="text-red-500 text-xs font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 rounded-[var(--radius-md)] bg-brand text-brand-fg text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
          >
            {loading ? 'Setting up...' : 'Continue'}
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </AuthLayout>
  )
}
