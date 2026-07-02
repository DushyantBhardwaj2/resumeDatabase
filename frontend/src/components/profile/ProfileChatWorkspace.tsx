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
import type { SectionName, Profile } from '@resumint/shared'
import { SECTION_LABELS, SECTION_ORDER } from '@resumint/shared'
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

  const handleProfileChange = useCallback((updated: Profile) => {
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
    await sendMessage(text)
  }, [sendMessage])

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

  const [activeTab, setActiveTab] = useState<'info'|'education'|'experience'|'projects'|'skills'>('experience')

  return (
    <div className="flex h-[calc(100vh-2rem)] gap-6 p-6 overflow-hidden">
      
      {/* Left Column: Chat Area */}
      <div className="flex-[4] glass card-lift rounded-[var(--radius-xl)] flex flex-col relative overflow-hidden h-full">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand/20 via-brand to-brand/20"></div>
        
        {/* Chat Header */}
        <div className="px-5 py-4 border-b border-edge/50 flex items-center gap-3 bg-surface/30 backdrop-blur-md">
          <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
            <span className="w-2 h-2 rounded-full bg-brand animate-pulse-glow" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-[15px] text-fg leading-none mb-1">Career Agent</h3>
            <p className="text-[11px] text-content-muted leading-none">Online &amp; ready to help</p>
          </div>
        </div>

        <div className="flex-1 overflow-hidden relative z-10 bg-surface/10">
          <ChatContainer
            mode="PROFILE"
            renderWidget={handleRenderWidget}
            renderInput={false}
          />
        </div>

        <div className="shrink-0 p-4 bg-surface/40 backdrop-blur-md border-t border-edge/50">
          <div className="flex items-center gap-2 bg-card border border-edge rounded-[var(--radius-md)] px-3 py-2 focus-within:border-brand focus-within:ring-1 focus-within:ring-brand/50 transition-all">
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
              placeholder="E.g., I led a team of 5 engineers to build a new API..."
              className="flex-1 bg-transparent text-[13px] text-fg placeholder:text-content-subtle outline-none"
            />
            <button
              onClick={() => {
                if (userInput.trim()) {
                  handleChatSubmit(userInput.trim())
                  setUserInput('')
                }
              }}
              className="flex items-center justify-center h-8 w-8 rounded-[var(--radius-sm)] bg-brand text-brand-fg hover:opacity-90 transition-all shrink-0 hover:-translate-y-px"
              aria-label="Send"
            >
              <ChatCircleDots size={16} weight="fill" />
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Profile Vault Summary */}
      <div className="flex-[5] glass card-lift rounded-[var(--radius-xl)] flex flex-col overflow-hidden h-full">
        <div className="px-6 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-2xl text-fg flex items-center gap-3 m-0">
              <div className="w-3 h-3 rounded-full bg-brand shadow-[0_0_12px_rgba(22,163,74,0.6)]"></div>
              Your Career Vault
            </h2>
            <span className="text-[11px] text-content-muted bg-surface px-3 py-1 rounded-[var(--radius-pill)] border border-edge">
              Live Preview
            </span>
          </div>

          <div className="flex gap-6 border-b border-edge">
            {(['info', 'education', 'experience', 'projects', 'skills'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium transition-colors relative capitalize ${
                  activeTab === tab ? 'text-brand' : 'text-content-muted hover:text-fg'
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 w-full h-[2px] bg-brand rounded-t-full shadow-[0_0_8px_rgba(22,163,74,0.5)]"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-surface/20 space-y-4">
          {activeTab === 'info' && (
            <div className="space-y-4">
              <p className="text-sm text-content-muted">Email: {profile?.contact?.email || 'Not set'}</p>
              <p className="text-sm text-content-muted">Phone: {profile?.contact?.phone || 'Not set'}</p>
              <p className="text-sm text-content-muted">LinkedIn: {profile?.contact?.linkedin || 'Not set'}</p>
            </div>
          )}
          {activeTab === 'experience' && (
            profile?.experience && profile.experience.length > 0 ? (
              profile.experience.map((exp: any, i: number) => (
                <div key={i} className="bg-card border border-edge rounded-[var(--radius-lg)] p-5 relative group overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-brand opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <h4 className="font-display font-semibold text-lg text-fg">{exp.jobTitle || 'Role'}</h4>
                  <p className="text-sm text-brand font-medium mb-3">{exp.companyName || 'Company'}</p>
                  <ul className="space-y-2">
                    {exp.bullets?.map((b: any, j: number) => (
                      <li key={j} className="text-[13px] text-content-muted leading-relaxed flex items-start gap-2">
                        <span className="text-brand text-[10px] mt-1">&#9679;</span>
                        <span className="flex-1">{b.text || b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <p className="text-sm text-content-subtle">No experience added yet.</p>
            )
          )}
          {activeTab === 'education' && (
            profile?.education && profile.education.length > 0 ? (
              profile.education.map((edu: any, i: number) => (
                <div key={i} className="bg-card border border-edge rounded-[var(--radius-lg)] p-5">
                  <h4 className="font-display font-semibold text-lg text-fg">{edu.degree || 'Degree'}</h4>
                  <p className="text-sm text-brand font-medium">{edu.institutionName || 'Institution'}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-content-subtle">No education added yet.</p>
            )
          )}
          {activeTab === 'projects' && (
            profile?.projects && profile.projects.length > 0 ? (
              profile.projects.map((proj: any, i: number) => (
                <div key={i} className="bg-card border border-edge rounded-[var(--radius-lg)] p-5">
                  <h4 className="font-display font-semibold text-lg text-fg">{proj.projectName || 'Project'}</h4>
                  <ul className="space-y-2 mt-3">
                    {proj.bullets?.map((b: any, j: number) => (
                      <li key={j} className="text-[13px] text-content-muted flex items-start gap-2">
                        <span className="text-brand text-[10px] mt-1">&#9679;</span>
                        <span className="flex-1">{b.text || b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <p className="text-sm text-content-subtle">No projects added yet.</p>
            )
          )}
          {activeTab === 'skills' && (
            <div className="bg-card border border-edge rounded-[var(--radius-lg)] p-5">
              <h4 className="font-display font-semibold text-sm text-fg mb-3">Languages</h4>
              <div className="flex flex-wrap gap-2 mb-6">
                {profile?.skills?.languages?.map((s: string) => (
                  <span key={s} className="bg-surface border border-edge text-content-muted text-[11px] px-2.5 py-1 rounded-full">{s}</span>
                )) || <p className="text-xs text-content-subtle">None</p>}
              </div>
              <h4 className="font-display font-semibold text-sm text-fg mb-3">Frameworks</h4>
              <div className="flex flex-wrap gap-2 mb-6">
                {profile?.skills?.frameworks?.map((s: string) => (
                  <span key={s} className="bg-surface border border-edge text-content-muted text-[11px] px-2.5 py-1 rounded-full">{s}</span>
                )) || <p className="text-xs text-content-subtle">None</p>}
              </div>
              <h4 className="font-display font-semibold text-sm text-fg mb-3">Tools</h4>
              <div className="flex flex-wrap gap-2">
                {profile?.skills?.tools?.map((s: string) => (
                  <span key={s} className="bg-surface border border-edge text-content-muted text-[11px] px-2.5 py-1 rounded-full">{s}</span>
                )) || <p className="text-xs text-content-subtle">None</p>}
              </div>
            </div>
          )}
        </div>
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
