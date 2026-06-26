'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useBuilderStore } from '@/store/useBuilderStore'
import { toast } from 'sonner'
import {
  Sparkle,
  CheckSquare,
  Square,
  ArrowClockwise,
  PaperPlaneRight,
} from '@phosphor-icons/react'
import type { TemplateType } from '@/store/useBuilderStore'

type ChatEntry = {
  id: string
  role: 'assistant' | 'user'
  type: 'greeting' | 'job-details-form' | 'user-jd' | 'generating' | 'checklist'
  content?: string
}

type TailorResponse = {
  jobTitle: string
  company: string
  original: {
    contact: Record<string, string>
    education: Record<string, unknown>[]
    experience: Array<{ id?: string; company: string; role: string; startDate?: string; endDate?: string; vaultBullets: Array<{ id: string; text: string }> }>
    projects: Array<{ id?: string; title: string; url?: string; techStack: string[]; vaultBullets: Array<{ id: string; text: string }> }>
    skills: { languages: string[]; frameworks: string[]; tools: string[] }
  }
  tailored: {
    summary: string | null
    experience: Array<{ id?: string; company: string; role: string; vaultBullets: Array<{ id: string; text: string }> }>
    projects: Array<{ id?: string; title: string; url?: string; techStack?: string[]; vaultBullets: Array<{ id: string; text: string }> }>
    skills: { languages: string[]; frameworks: string[]; tools: string[] }
  }
}

const TEMPLATES: { value: TemplateType; label: string }[] = [
  { value: 'nsut-canonical', label: 'NSUT Canonical' },
  { value: 'ats-clean', label: 'ATS Clean' },
  { value: 'modern', label: 'Modern' },
  { value: 'compact', label: 'Compact' },
]

export function GenerateChatWorkspace() {
  const [entries, setEntries] = useState<ChatEntry[]>([
    { id: 'greeting', role: 'assistant', type: 'greeting' },
    { id: 'job-form', role: 'assistant', type: 'job-details-form' },
  ])
  const [composerText, setComposerText] = useState('')
  const [generating, setGenerating] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const profile = useBuilderStore((s) => s.profile)
  const jobTitle = useBuilderStore((s) => s.jobTitle)
  const company = useBuilderStore((s) => s.company)
  const template = useBuilderStore((s) => s.template)
  const selectedBulletIds = useBuilderStore((s) => s.selectedBulletIds)
  const status = useBuilderStore((s) => s.status)
  const setJobTitle = useBuilderStore((s) => s.setJobTitle)
  const setCompany = useBuilderStore((s) => s.setCompany)
  const setJobDescription = useBuilderStore((s) => s.setJobDescription)
  const setProfile = useBuilderStore((s) => s.setProfile)
  const setSelections = useBuilderStore((s) => s.setSelections)
  const setPdfUrl = useBuilderStore((s) => s.setPdfUrl)
  const setStatus = useBuilderStore((s) => s.setStatus)
  const setCurrentStage = useBuilderStore((s) => s.setCurrentStage)
  const setTemplate = useBuilderStore((s) => s.setTemplate)
  const toggleBullet = useBuilderStore((s) => s.toggleBullet)
  const templateValue = useBuilderStore((s) => s.template)
  const triggerCompile = useBuilderStore((s) => s.triggerCompile)
  const currentStage = useBuilderStore((s) => s.currentStage)

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [entries, profile, status])

  // Debounced live recompile on bullet toggle
  const compileTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!profile || currentStage !== 'reviewing') return
    if (compileTimer.current) clearTimeout(compileTimer.current)
    compileTimer.current = setTimeout(() => { triggerCompile() }, 600)
    return () => {
      if (compileTimer.current) clearTimeout(compileTimer.current)
    }
  }, [selectedBulletIds, profile, currentStage, triggerCompile])

  // Handle JD submission from composer
  const handleSubmitJD = useCallback(async (jdText: string) => {
    const trimmed = jdText.trim()
    if (!trimmed || generating) return

    const title = jobTitle.trim()
    const comp = company.trim()

    if (!title || !comp) {
      toast.error('Please fill in Job Title and Company in the form above.')
      return
    }

    setGenerating(true)
    setCurrentStage('generating')

    setEntries((prev) => [
      ...prev,
      { id: 'user-jd-' + Date.now(), role: 'user', type: 'user-jd', content: trimmed.length > 120 ? trimmed.slice(0, 120) + '...' : trimmed },
      { id: 'generating-' + Date.now(), role: 'assistant', type: 'generating' },
    ])

    setJobDescription(trimmed)

    try {
      const res = await fetch('/api/protected/resume/tailor', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, company: comp, description: trimmed, templateId: templateValue }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Generation failed')
      }
      const data: TailorResponse = await res.json()

      // Merge original contact/education with tailored experience/projects/skills
      const originalExpMap = new Map(data.original.experience.map((e) => [e.company + '|' + e.role, e]))
      const originalProjMap = new Map(data.original.projects.map((p) => [p.title, p]))

      const mergedProfile = {
        contact: data.original.contact,
        education: data.original.education,
        experience: data.tailored.experience.map((exp) => {
          const orig = originalExpMap.get(exp.company + '|' + exp.role)
          return {
            id: exp.id || orig?.id || crypto.randomUUID(),
            company: exp.company,
            role: exp.role,
            startDate: orig?.startDate || '',
            endDate: orig?.endDate || '',
            current: false,
            vaultBullets: exp.vaultBullets.map((b) => ({
              id: b.id || crypto.randomUUID(),
              text: b.text,
              keywords: [],
              isAIGenerated: true,
            })),
          }
        }),
        projects: data.tailored.projects.map((proj) => {
          const orig = originalProjMap.get(proj.title)
          return {
            id: proj.id || orig?.id || crypto.randomUUID(),
            title: proj.title,
            url: orig?.url || proj.url || '',
            techStack: orig?.techStack || proj.techStack || [],
            vaultBullets: proj.vaultBullets.map((b) => ({
              id: b.id || crypto.randomUUID(),
              text: b.text,
              keywords: [],
              isAIGenerated: true,
            })),
          }
        }),
        skills: data.tailored.skills,
      }

      setProfile(mergedProfile)
      setCurrentStage('reviewing')

      // Select all bullets by default
      const defaultSelections: Record<string, string[]> = {}
      for (const exp of mergedProfile.experience) {
        defaultSelections[exp.id] = exp.vaultBullets.map((b) => b.id)
      }
      for (const proj of mergedProfile.projects) {
        defaultSelections[proj.id] = proj.vaultBullets.map((b) => b.id)
      }
      setSelections(defaultSelections)
      setPdfUrl(null)

      // Replace generating message with checklist
      setEntries((prev) => [
        ...prev.filter((e) => e.type !== 'generating'),
        { id: 'checklist-' + Date.now(), role: 'assistant', type: 'checklist' },
      ])

      // Trigger initial compile
      setStatus('compiling')
      setTimeout(() => {
        const { triggerCompile } = useBuilderStore.getState()
        triggerCompile()
      }, 100)

      toast.success('Resume generated! Toggle bullets to customize.')
      setComposerText('')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Generation failed'
      const isTimeout = message.toLowerCase().includes('timeout') || message.toLowerCase().includes('abort')
      const isNetwork = message.toLowerCase().includes('fetch') || message.toLowerCase().includes('network') || message.toLowerCase().includes('econnreset')
      if (isTimeout) {
        toast.error('The AI took too long. Try a shorter job description or try again.')
      } else if (isNetwork) {
        toast.error('Network error. Check your connection and try again.')
      } else {
        toast.error(message)
      }
      setCurrentStage('collecting')
      setGenerating(false)
      // Remove generating message and add an error entry
      setEntries((prev) => [
        ...prev.filter((e) => e.type !== 'generating'),
        { id: 'error-' + Date.now(), role: 'assistant', type: 'generating', content: isTimeout ? 'Timed out. Try a shorter description.' : 'Generation failed. Please try again.' },
      ])
      return
    } finally {
      setGenerating(false)
    }
  }, [jobTitle, company, generating, templateValue, setJobDescription, setProfile, setSelections, setPdfUrl, setStatus, setCurrentStage])

  const handleSelectAll = useCallback(() => {
    if (!profile) return
    const all: Record<string, string[]> = {}
    for (const exp of profile.experience) {
      all[exp.id] = exp.vaultBullets.map((b) => b.id)
    }
    for (const proj of profile.projects) {
      all[proj.id] = proj.vaultBullets.map((b) => b.id)
    }
    setSelections(all)
  }, [profile, setSelections])

  const handleDeselectAll = useCallback(() => {
    if (!profile) return
    const empty: Record<string, string[]> = {}
    for (const exp of profile.experience) {
      empty[exp.id] = []
    }
    for (const proj of profile.projects) {
      empty[proj.id] = []
    }
    setSelections(empty)
  }, [profile, setSelections])

  const totalBullets = profile
    ? [...profile.experience, ...profile.projects].reduce((s, i) => s + i.vaultBullets.length, 0)
    : 0
  const selectedCount = Object.values(selectedBulletIds).reduce((s, ids) => s + ids.length, 0)

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable message area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-5 scroll-smooth">
        {entries.map((entry) => {
          if (entry.type === 'greeting') {
            return (
              <div key={entry.id} className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                  <Sparkle size={16} className="text-brand" />
                </div>
                <div>
                  <p className="text-sm text-content font-medium">Resume Generator</p>
                  <p className="text-sm text-content-muted mt-1 leading-relaxed">
                    Paste the job description and I&rsquo;ll match your strongest Career Vault bullets.
                  </p>
                </div>
              </div>
            )
          }

          if (entry.type === 'job-details-form') {
            return (
              <div key={entry.id} className="ml-11">
                <div className="bg-card border border-edge rounded-[var(--radius-md)] p-4 space-y-3 max-w-md">
                  <p className="text-xs font-medium text-content">Job Details</p>
                  <div>
                    <label className="text-[11px] text-content-muted block mb-1">Job Title</label>
                    <input
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g. Senior Software Engineer"
                      className="w-full h-8 bg-muted-bg border border-edge rounded-[var(--radius-sm)] px-2.5 text-sm text-content placeholder:text-content-subtle outline-none focus:border-brand transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-content-muted block mb-1">Company</label>
                    <input
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="e.g. Acme Corp"
                      className="w-full h-8 bg-muted-bg border border-edge rounded-[var(--radius-sm)] px-2.5 text-sm text-content placeholder:text-content-subtle outline-none focus:border-brand transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-content-muted block mb-1">Template</label>
                    <select
                      value={template}
                      onChange={(e) => setTemplate(e.target.value as TemplateType)}
                      className="w-full h-8 bg-muted-bg border border-edge rounded-[var(--radius-sm)] px-2.5 text-sm text-content outline-none focus:border-brand transition-colors"
                    >
                      {TEMPLATES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )
          }

          if (entry.type === 'user-jd') {
            return (
              <div key={entry.id} className="flex justify-end">
                <div className="bg-brand/10 border border-brand/20 rounded-[var(--radius-md)] px-3 py-2 max-w-lg">
                  <p className="text-xs text-content-muted mb-0.5">Job Description submitted</p>
                  <p className="text-xs text-content leading-relaxed">{entry.content}</p>
                </div>
              </div>
            )
          }

          if (entry.type === 'generating') {
            return (
              <div key={entry.id} className="flex items-center gap-3 text-content-muted text-sm ml-11">
                <span className="w-4 h-4 rounded-full border-2 border-brand border-t-transparent animate-spin" />
                Matching your Career Vault bullets...
              </div>
            )
          }

          if (entry.type === 'checklist') {
            return (
              <div key={entry.id} className="ml-11">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-content">
                    Select bullets to include
                  </p>
                  <span className="text-[10px] text-content-muted">
                    {selectedCount} / {totalBullets} selected
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <button
                    onClick={handleSelectAll}
                    className="text-[10px] px-2.5 py-1 rounded-[var(--radius-sm)] bg-surface border border-edge text-content-muted hover:text-content transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    onClick={handleDeselectAll}
                    className="text-[10px] px-2.5 py-1 rounded-[var(--radius-sm)] bg-surface border border-edge text-content-muted hover:text-content transition-colors"
                  >
                    Deselect All
                  </button>
                  {status === 'compiling' && (
                    <span className="flex items-center gap-1.5 text-[10px] text-content-muted ml-auto">
                      <ArrowClockwise size={10} className="animate-spin" />
                      Updating preview...
                    </span>
                  )}
                </div>
                {profile && (
                  <div className="space-y-3">
                    {profile.experience.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold tracking-widest text-brand uppercase mb-1.5">Experience</p>
                        {profile.experience.map((exp) => (
                          <ChecklistGroup
                            key={exp.id}
                            id={exp.id}
                            heading={`${exp.role} — ${exp.company}`}
                            bullets={exp.vaultBullets}
                            selectedIds={selectedBulletIds[exp.id] || []}
                            onToggle={toggleBullet}
                          />
                        ))}
                      </div>
                    )}
                    {profile.projects.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold tracking-widest text-brand uppercase mb-1.5">Projects</p>
                        {profile.projects.map((proj) => (
                          <ChecklistGroup
                            key={proj.id}
                            id={proj.id}
                            heading={proj.title}
                            bullets={proj.vaultBullets}
                            selectedIds={selectedBulletIds[proj.id] || []}
                            onToggle={toggleBullet}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          }

          return null
        })}
      </div>

      {/* Sticky composer */}
      <div className="shrink-0 border-t border-edge p-3 md:p-4">
        <div className="flex items-end gap-2 bg-card border border-edge rounded-[var(--radius-md)] px-3 py-2 focus-within:border-brand/50 focus-within:ring-1 focus-within:ring-brand/20 transition-all">
          <textarea
            value={composerText}
            onChange={(e) => setComposerText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (composerText.trim() && !generating) {
                  handleSubmitJD(composerText)
                }
              }
            }}
            placeholder="Paste the job description or tell me the role..."
            rows={2}
            className="flex-1 bg-transparent text-sm text-content placeholder:text-content-subtle resize-none outline-none max-h-32"
          />
          <button
            onClick={() => {
              if (composerText.trim() && !generating) {
                handleSubmitJD(composerText)
              }
            }}
            disabled={!composerText.trim() || generating}
            className="flex items-center justify-center h-8 w-8 rounded-[var(--radius-md)] bg-brand text-white hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed transition-all shrink-0"
            aria-label="Send"
          >
            {generating ? (
              <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <PaperPlaneRight size={16} weight="fill" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Checklist Group ──────────────────────────────────────────────

function ChecklistGroup({
  id,
  heading,
  bullets,
  selectedIds,
  onToggle,
}: {
  id: string
  heading: string
  bullets: Array<{ id: string; text: string }>
  selectedIds: string[]
  onToggle: (itemId: string, bulletId: string) => void
}) {
  return (
    <div className="bg-card border border-edge rounded-[var(--radius-md)] overflow-hidden mb-2">
      <div className="px-3 py-2 bg-surface border-b border-edge flex items-center justify-between">
        <p className="text-xs font-medium text-content truncate">{heading}</p>
        <span className="text-[10px] text-content-muted shrink-0 ml-2">{selectedIds.length}/{bullets.length}</span>
      </div>
      <div className="divide-y divide-edge">
        {bullets.map((bullet) => {
          const isSelected = selectedIds.includes(bullet.id)
          return (
            <button
              key={bullet.id}
              onClick={() => onToggle(id, bullet.id)}
              className="w-full flex items-start gap-2.5 px-3 py-2 text-left hover:bg-surface-subtle transition-colors"
            >
              {isSelected ? (
                <CheckSquare size={14} className="text-brand shrink-0 mt-0.5" weight="fill" />
              ) : (
                <Square size={14} className="text-content-subtle shrink-0 mt-0.5" />
              )}
              <span className={`text-xs leading-relaxed ${isSelected ? 'text-content' : 'text-content-muted'}`}>
                {bullet.text}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
