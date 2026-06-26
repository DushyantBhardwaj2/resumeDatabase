'use client'

import { useEffect, useRef, useState, useCallback, useMemo, startTransition } from 'react'
import { toast } from 'sonner'
import {
  ChatCircleDots,
  EnvelopeSimple,
  GraduationCap,
  Briefcase,
  FolderOpen,
  GearSix,
  Certificate,
  FloppyDisk,
  CheckCircle,
  ArrowClockwise,
} from '@phosphor-icons/react'
import { ChatContainer } from '@/components/chat/ChatContainer'
import { useChatStore } from '@/store/useChatStore'
import { ProfileSectionEditor } from '@/components/chat/widgets/ProfileSectionEditor'
import type { ProfileData, SectionName } from '@/lib/profile-types'
import { SECTION_LABELS, SECTION_ORDER } from '@/lib/profile-types'
import { normalizeProfile, countSectionItems, getEmptyProfile } from '@/lib/normalize-profile'

const DRAFT_KEY = 'profile-draft'

const SECTION_ICONS: Record<SectionName, React.ElementType> = {
  contact: EnvelopeSimple,
  education: GraduationCap,
  experience: Briefcase,
  projects: FolderOpen,
  skills: GearSix,
  certificates: Certificate,
}

export default function ProfilePage() {
  const addMessage = useChatStore((s) => s.addMessage)
  const clearChat = useChatStore((s) => s.clearChat)
  const sendMessage = useChatStore((s) => s.sendMessage)
  const initRef = useRef(false)
  const [profile, setProfile] = useState<ProfileData>(getEmptyProfile)
  const [originalProfile, setOriginalProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [editingSection, setEditingSection] = useState<SectionName | null>(null)
  const [userInput, setUserInput] = useState('')

  const isDirty = useMemo(() => {
    if (!originalProfile) return false
    return JSON.stringify(profile) !== JSON.stringify(originalProfile)
  }, [profile, originalProfile])

  // Load profile
  const loadProfile = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/protected/profile', { credentials: 'include' })
      if (!res.ok) throw new Error()
      const data = await res.json()
      const normalized = normalizeProfile(data)
      setProfile(normalized)
      setOriginalProfile(structuredClone(normalized))
    } catch {
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSave = useCallback(async () => {
    if (!isDirty) return
    setSaving('saving')
    try {
      const res = await fetch('/api/protected/profile', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      const normalized = normalizeProfile(data)
      setProfile(normalized)
      setOriginalProfile(structuredClone(normalized))
      localStorage.removeItem(DRAFT_KEY)
      setSaving('saved')
      setTimeout(() => setSaving('idle'), 2000)
      toast.success('Profile saved')
    } catch {
      setSaving('error')
      toast.error('Failed to save profile')
    }
  }, [profile, isDirty])

  // Persist draft to localStorage on changes
  useEffect(() => {
    if (!originalProfile || !isDirty) return
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(profile))
    } catch { /* quota exceeded? ignore */ }
  }, [profile, originalProfile, isDirty])

  // Restore draft on mount
  useEffect(() => {
    startTransition(() => {
      loadProfile()
    })
  }, [loadProfile])

  // Init chat
  useEffect(() => {
    if (initRef.current || loading) return
    initRef.current = true
    clearChat()

    const counts = countSectionItems(profile)
    const overview = [
      `${counts.contact} contact`,
      `${counts.education} education`,
      `${counts.experience} experience entries`,
      `${counts.projects} projects`,
      `${counts.skills} skills`,
      `${counts.certificates} certificates`,
    ].join(' · ')

    addMessage({
      id: 'profile-greeting',
      role: 'assistant',
      content: `Here's your Career Vault profile.\n${overview}\n\nTap a section below to edit it, or type what you want to change.`,
    })

    addMessage({
      id: 'profile-sections',
      role: 'assistant',
      content: 'Which section would you like to edit?',
      widget: 'PROFILE_SECTIONS',
    })
  }, [addMessage, clearChat, loading, profile])

  const handleEditSection = useCallback((section: SectionName) => {
    setEditingSection(section)
    const msgId = `editing-${section}-${Date.now()}`
    addMessage({
      id: msgId,
      role: 'assistant',
      content: `Editing **${SECTION_LABELS[section]}**. Make your changes below and save when done.`,
      widget: 'PROFILE_EDITOR',
    })
  }, [addMessage])

  const handleProfileChange = useCallback((updated: ProfileData) => {
    setProfile(updated)
  }, [])

  const handleBackToSections = useCallback(() => {
    setEditingSection(null)
    addMessage({
      id: 'back-sections-' + Date.now(),
      role: 'assistant',
      content: 'Which section would you like to edit?',
      widget: 'PROFILE_SECTIONS',
    })
  }, [addMessage])

  const handleChatSubmit = useCallback(async (text: string) => {
    if (!text.trim()) return
    const lower = text.toLowerCase()

    // Simple NL section detection without backend call
    const sectionKeywords: [RegExp, SectionName][] = [
      [/contact|email|phone|linkedin/, 'contact'],
      [/education|school|college|university|degree/, 'education'],
      [/experience|internship|job|work|company/, 'experience'],
      [/project|github|repo/, 'projects'],
      [/skill|language|framework|tool|tech stack/, 'skills'],
      [/certificate|certification|credential/, 'certificates'],
    ]

    for (const [regex, section] of sectionKeywords) {
      if (regex.test(lower)) {
        handleEditSection(section)
        return
      }
    }

    // Default: try backend chat
    await sendMessage(text)
  }, [handleEditSection, sendMessage])

  const handleRenderWidget = useCallback((widget: string | null | undefined) => {
    if (widget === 'PROFILE_SECTIONS') {
      const counts = countSectionItems(profile)
      return (
        <SectionPicker
          counts={counts}
          onSelect={handleEditSection}
        />
      )
    }
    if (widget === 'PROFILE_EDITOR' && editingSection) {
      return (
        <div className="mt-3">
          <ProfileSectionEditor
            section={editingSection}
            data={profile}
            onChange={handleProfileChange}
          />
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-edge">
            <button
              onClick={handleSave}
              disabled={!isDirty || saving === 'saving'}
              className="h-8 px-4 bg-brand text-brand-fg rounded-[var(--radius-md)] text-xs font-medium hover:opacity-90 transition-all disabled:opacity-40 flex items-center gap-1.5"
            >
              {saving === 'saving' ? (
                <><ArrowClockwise size={14} className="animate-spin" /> Saving...</>
              ) : saving === 'saved' ? (
                <><CheckCircle size={14} /> Saved</>
              ) : (
                <><FloppyDisk size={14} /> Save</>
              )}
            </button>
            <button
              onClick={handleBackToSections}
              className="h-8 px-4 border border-edge rounded-[var(--radius-md)] text-xs text-content-muted hover:text-content transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      )
    }
    return null
  }, [profile, editingSection, handleEditSection, handleProfileChange, handleSave, saving, isDirty, handleBackToSections])

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
    <div className="h-full flex flex-col max-w-3xl mx-auto px-4 pt-8 pb-4">
      <div className="flex-1 overflow-hidden">
        <ChatContainer
          mode="DASHBOARD"
          renderWidget={handleRenderWidget}
          renderInput={false}
        />
      </div>
      {/* Chat input bar */}
      <div className="shrink-0 mt-3 border border-edge rounded-[var(--radius-md)] bg-card flex items-center gap-2 px-3 py-2">
        <input
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              if (userInput.trim()) {
                handleChatSubmit(userInput.trim())
                setUserInput('')
              }
            }
          }}
          placeholder="Type a message..."
          className="flex-1 bg-transparent text-sm text-content placeholder:text-content-subtle outline-none"
        />
        <button
          onClick={() => {
            if (userInput.trim()) {
              handleChatSubmit(userInput.trim())
              setUserInput('')
            }
          }}
          className="flex items-center justify-center h-7 w-7 rounded-[var(--radius-md)] bg-brand text-brand-fg hover:opacity-90 transition-all shrink-0"
          aria-label="Send"
        >
          <ChatCircleDots size={16} weight="fill" />
        </button>
      </div>
    </div>
  )
}

// ── Section Picker ───────────────────────────────────────────────

function SectionPicker({
  counts,
  onSelect,
}: {
  counts: Record<string, number>
  onSelect: (section: SectionName) => void
}) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      {SECTION_ORDER.map((key) => {
        const Icon = SECTION_ICONS[key]
        const count = counts[key]
        const countLabel = key === 'skills'
          ? `${count} tags`
          : `${count} ${count === 1 ? 'entry' : 'entries'}`
        return (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className="flex items-center gap-3 text-left p-3 rounded-[var(--radius-md)] border border-edge bg-card hover:bg-surface transition-colors group"
          >
            <div className="h-8 w-8 rounded-[var(--radius-md)] bg-muted-bg flex items-center justify-center group-hover:bg-surface-subtle transition-colors shrink-0">
              <Icon size={16} className="text-content-muted" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-content">{SECTION_LABELS[key]}</p>
              <p className="text-[10px] text-content-muted mt-0.5">
                {key === 'contact'
                  ? (count > 0 ? 'Details added' : 'Not set')
                  : countLabel}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
