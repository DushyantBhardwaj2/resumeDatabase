'use client'

import { useEffect } from 'react'
import { useProfileStore } from '@/store/useProfileStore'
import { ProfileChatWorkspace } from '@/components/profile/ProfileChatWorkspace'
import { ProfileVaultPanel } from '@/components/profile/ProfileVaultPanel'

export default function ProfilePage() {
  const loading = useProfileStore((s) => s.loading)
  const updateProfile = useProfileStore((s) => s.updateProfile)

  // Restore draft from localStorage on mount
  useEffect(() => {
    try {
      const draft = localStorage.getItem('profile-draft')
      if (draft) {
        const parsed = JSON.parse(draft)
        updateProfile(parsed)
      }
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      {/* Chat workspace — 35% */}
      <div className="w-[35%] min-w-[320px] border-r border-edge flex flex-col bg-card/40 backdrop-blur-sm">
        <div className="shrink-0 px-4 pt-4 pb-2 border-b border-edge">
          <h2 className="text-sm font-semibold text-content flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand" />
            AI Assistant
          </h2>
          <p className="text-[11px] text-content-muted mt-0.5">
            Chat to build and edit your profile
          </p>
        </div>
        <div className="flex-1 overflow-hidden">
          <ProfileChatWorkspace />
        </div>
      </div>

      {/* Profile vault — 65% */}
      <div className="w-[65%] flex flex-col bg-surface">
        <div className="shrink-0 px-4 pt-4 pb-2 border-b border-edge">
          <h2 className="text-sm font-semibold text-content flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand/60" />
            Profile Vault
          </h2>
          <p className="text-[11px] text-content-muted mt-0.5">
            Your structured career data
          </p>
        </div>
        <div className="flex-1 overflow-hidden">
          <ProfileVaultPanel />
        </div>
      </div>
    </div>
  )
}
