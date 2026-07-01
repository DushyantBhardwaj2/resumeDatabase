'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  ChatCircleDots,
  EnvelopeSimple,
  GraduationCap,
  Briefcase,
  FolderOpen,
  GearSix,
  Certificate,
} from '@phosphor-icons/react'
import { ChatContainer } from '@/components/chat/ChatContainer'
import { useChatStore } from '@/store/useChatStore'
import { useProfileStore } from '@/store/useProfileStore'
import { ProfileSectionEditor } from '@/components/chat/widgets/ProfileSectionEditor'
import { ProfileGenerationCard, type GeneratedDataType } from './ProfileGenerationCard'
import type { SectionName, ProfileData } from '@/lib/profile-types'
import { SECTION_LABELS, SECTION_ORDER } from '@/lib/profile-types'
import { countSectionItems } from '@/lib/normalize-profile'

const SECTION_ICONS: Record<SectionName, React.ElementType> = {
  contact: EnvelopeSimple,
  education: GraduationCap,
  experience: Briefcase,
  projects: FolderOpen,
  skills: GearSix,
  certificates: Certificate,
}

export function ProfileChatWorkspace() {
  const addMessage = useChatStore((s) => s.addMessage)
  const setMode = useChatStore((s) => s.setMode)
  const sendMessage = useChatStore((s) => s.sendMessage)
  const profile = useProfileStore((s) => s.profile)
  const saveProfile = useProfileStore((s) => s.saveProfile)
  const updateProfile = useProfileStore((s) => s.updateProfile)
  const isDirty = useProfileStore((s) => s.isDirty)
  const saving = useProfileStore((s) => s.saving)

  const initRef = useRef(false)
  const [editingSection, setEditingSection] = useState<SectionName | null>(null)
  const [userInput, setUserInput] = useState('')

  // Init chat on mount
  useEffect(() => {
    if (initRef.current) return
    initRef.current = true
    setMode('PROFILE')

    if (!useChatStore.getState().messagesByMode['PROFILE']?.length) {
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
    }
  }, [addMessage, profile, setMode])

  const handleEditSection = useCallback((section: SectionName) => {
    setEditingSection(section)
    addMessage({
      id: `editing-${section}-${Date.now()}`,
      role: 'assistant',
      content: `Editing **${SECTION_LABELS[section]}**. Make your changes below and save when done.`,
      widget: 'PROFILE_EDITOR',
    })
  }, [addMessage])

  const handleProfileChange = useCallback((updated: ProfileData) => {
    updateProfile(updated)
  }, [updateProfile])

  const handleBackToSections = useCallback(() => {
    setEditingSection(null)
    addMessage({
      id: `back-sections-${Date.now()}`,
      role: 'assistant',
      content: 'Which section would you like to edit?',
      widget: 'PROFILE_SECTIONS',
    })
  }, [addMessage])

  const handleAskEdit = useCallback(() => {
    const inputEl = document.querySelector<HTMLInputElement>('[data-profile-chat-input]')
    if (inputEl) inputEl.focus()
  }, [])

  const handleChatSubmit = useCallback(async (text: string) => {
    if (!text.trim()) return
    const lower = text.toLowerCase()

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

    await sendMessage(text)
  }, [handleEditSection, sendMessage])

  const handleRenderWidget = useCallback((widget: string | null | undefined, meta?: Record<string, unknown>) => {
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
              onClick={saveProfile}
              disabled={!isDirty() || saving === 'saving'}
              className="h-8 px-4 bg-brand text-brand-fg rounded-[var(--radius-md)] text-xs font-medium hover:opacity-90 transition-all disabled:opacity-40 flex items-center gap-1.5"
            >
              {saving === 'saving' ? 'Saving...' : saving === 'saved' ? 'Saved' : 'Save'}
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
    if (widget === 'PROFILE_GENERATOR' && meta?.generatedData) {
      return (
        <ProfileGenerationCard
          data={meta.generatedData as GeneratedDataType}
          onAskEdit={handleAskEdit}
        />
      )
    }
    return null
  }, [profile, editingSection, handleEditSection, handleProfileChange, saveProfile, saving, isDirty, handleBackToSections, handleAskEdit])

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-hidden">
        <ChatContainer
          mode="PROFILE"
          renderWidget={handleRenderWidget}
          renderInput={false}
        />
      </div>
      <div className="shrink-0 mt-3 mx-3 border border-edge rounded-[var(--radius-md)] bg-card flex items-center gap-2 px-3 py-2">
        <input
          data-profile-chat-input
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
