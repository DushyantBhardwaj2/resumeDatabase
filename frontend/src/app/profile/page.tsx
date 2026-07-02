'use client'

import { useEffect, useState, useCallback } from 'react'
import { useProfileStore } from '@/store/useProfileStore'
import { ProfileChatWorkspace } from '@/components/profile/ProfileChatWorkspace'
import { ProfileVaultPanel } from '@/components/profile/ProfileVaultPanel'
import { Splitter } from '@/components/ui/splitter'
import { ArrowLeft } from '@phosphor-icons/react'

export default function ProfilePage() {
  const loading = useProfileStore((s) => s.loading)
  const loadProfile = useProfileStore((s) => s.loadProfile)
  const updateProfile = useProfileStore((s) => s.updateProfile)
  const [leftWidth, setLeftWidth] = useState(35)
  const [mobilePanel, setMobilePanel] = useState<'chat' | 'vault'>('chat')

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  useEffect(() => {
    try {
      const draft = localStorage.getItem('profile-draft')
      if (draft) {
        const parsed = JSON.parse(draft)
        updateProfile(parsed)
      }
    } catch { /* ignore */ }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleResize = useCallback((delta: number) => {
    setLeftWidth((prev) => {
      const next = prev + (delta / window.innerWidth) * 100
      return Math.max(20, Math.min(60, next))
    })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-24">
        <div className="flex items-center gap-3 text-content-muted text-sm">
          <div className="w-4 h-4 rounded-full border-2 border-brand border-t-transparent animate-spin" />
          Loading your profile...
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] lg:h-screen w-full overflow-hidden">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-12 z-50 flex items-center gap-2 px-3 bg-card border-b border-edge">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-1.5 text-sm text-content-muted hover:text-content transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={() => setMobilePanel('chat')}
            className={`px-3 py-1 text-xs rounded-[var(--radius-sm)] transition-colors ${mobilePanel === 'chat' ? 'bg-brand text-brand-fg' : 'text-content-muted hover:text-content'}`}
          >
            AI Chat
          </button>
          <button
            onClick={() => setMobilePanel('vault')}
            className={`px-3 py-1 text-xs rounded-[var(--radius-sm)] transition-colors ${mobilePanel === 'vault' ? 'bg-brand text-brand-fg' : 'text-content-muted hover:text-content'}`}
          >
            Vault
          </button>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden lg:flex w-full">
        <div
          className="min-w-[280px] border-r border-edge flex flex-col bg-card/40 backdrop-blur-sm"
          style={{ width: `${leftWidth}%` }}
        >
          <div className="shrink-0 px-4 pt-4 pb-2 border-b border-edge">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-1.5 text-xs text-content-muted hover:text-content transition-colors mb-2"
            >
              <ArrowLeft size={14} />
              Back to Dashboard
            </button>
            <h2 className="text-sm font-semibold text-content flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand" />
              AI Assistant
            </h2>
            <p className="text-xs text-content-muted mt-0.5">
              Chat to build and edit your profile
            </p>
          </div>
          <div className="flex-1 overflow-hidden">
            <ProfileChatWorkspace />
          </div>
        </div>

        <Splitter onResize={handleResize} />

        <div className="flex-1 flex flex-col bg-surface">
          <div className="shrink-0 px-4 pt-4 pb-2 border-b border-edge">
            <h2 className="text-sm font-semibold text-content flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand/60" />
              Profile Vault
            </h2>
            <p className="text-xs text-content-muted mt-0.5">
              Your structured career data
            </p>
          </div>
          <div className="flex-1 overflow-hidden">
            <ProfileVaultPanel />
          </div>
        </div>
      </div>

      {/* Mobile layout */}
      <div className="flex lg:hidden flex-1 pt-12">
        {mobilePanel === 'chat' ? (
          <div className="flex-1 flex flex-col">
            <ProfileChatWorkspace />
          </div>
        ) : (
          <div className="flex-1 flex flex-col">
            <ProfileVaultPanel />
          </div>
        )}
      </div>
    </div>
  )
}
