'use client'

import { useState } from 'react'
import { api } from '@/config/api-client'
import { useBuilderStore, type TemplateType } from '@/store/useBuilderStore'
import { toast } from 'sonner'

type VaultBulletData = { id: string; text: string; keywords?: string[] }

type TailorResponse = {
  jobTitle: string
  company: string
  original: {
    contact: Record<string, string>
    education: Record<string, unknown>[]
    experience: Array<{ id?: string; company: string; role: string; startDate?: string; endDate?: string; vaultBullets: VaultBulletData[] }>
    projects: Array<{ id?: string; title: string; url?: string; techStack: string[]; vaultBullets: VaultBulletData[] }>
    skills: { languages: string[]; frameworks: string[]; tools: string[] }
  }
  tailored: {
    summary: string | null
    experience: Array<{ id?: string; company: string; role: string; vaultBullets: VaultBulletData[] }>
    projects: Array<{ id?: string; title: string; url?: string; techStack?: string[]; vaultBullets: VaultBulletData[] }>
    skills: { languages: string[]; frameworks: string[]; tools: string[] }
  }
}

const TEMPLATES: { value: TemplateType; label: string }[] = [
  { value: 'nsut-canonical', label: 'NSUT Canonical' },
  { value: 'ats-clean', label: 'ATS Clean' },
  { value: 'modern', label: 'Modern' },
  { value: 'compact', label: 'Compact' },
]

export function JDInputPanel() {
  const [title, setTitle] = useState('')
  const [company, setCompany] = useState('')
  const [description, setDescription] = useState('')
  const [generating, setGenerating] = useState(false)

  const setProfile = useBuilderStore((s) => s.setProfile)
  const setJobDescription = useBuilderStore((s) => s.setJobDescription)
  const setSelections = useBuilderStore((s) => s.setSelections)
  const setStatus = useBuilderStore((s) => s.setStatus)
  const setPdfUrl = useBuilderStore((s) => s.setPdfUrl)
  const template = useBuilderStore((s) => s.template)
  const setTemplate = useBuilderStore((s) => s.setTemplate)
  const status = useBuilderStore((s) => s.status)

  const canGenerate = title.trim() && company.trim() && description.trim().length > 50

  const handleGenerate = async () => {
    if (!canGenerate || generating) return
    setGenerating(true)
    setStatus('selecting')
    try {
      const res = await api.api.protected.resume.tailor.$post({
        json: { title: title.trim(), company: company.trim(), description: description.trim(), templateId: template },
      })
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as any
        throw new Error(err.error || 'Generation failed')
      }
      const data: TailorResponse = (await res.json()) as unknown as TailorResponse
      setJobDescription(description.trim())

      // Merge original contact/education with tailored experience/projects/skills
      // Preserve original metadata (dates, techStack) while using tailored bullets
      const originalExpMap = new Map(data.original.experience.map((e) => [e.company + '|' + e.role, e]))
      const originalProjMap = new Map(data.original.projects.map((p) => [p.title, p]))

      const mergedProfile = {
        contact: data.original.contact,
        education: data.original.education,
        experience: data.tailored.experience.map((exp) => {
          const orig = originalExpMap.get(exp.company + '|' + exp.role)
          const origBullets = new Map(orig?.vaultBullets.map((ob) => [ob.text, ob.keywords]) || [])
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
              keywords: origBullets.get(b.text) || [],
              isAIGenerated: true,
            })),
          }
        }),
        projects: data.tailored.projects.map((proj) => {
          const orig = originalProjMap.get(proj.title)
          const origProjBullets = new Map(orig?.vaultBullets.map((ob) => [ob.text, ob.keywords]) || [])
          return {
            id: proj.id || orig?.id || crypto.randomUUID(),
            title: proj.title,
            url: orig?.url || proj.url || '',
            techStack: orig?.techStack || proj.techStack || [],
            vaultBullets: proj.vaultBullets.map((b) => ({
              id: b.id || crypto.randomUUID(),
              text: b.text,
              keywords: origProjBullets.get(b.text) || [],
              isAIGenerated: true,
            })),
          }
        }),
        skills: data.tailored.skills,
      }

      setProfile(mergedProfile)

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
      toast.success('Resume generated! Toggle bullets to customize.')
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
      setStatus('idle')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-xs font-semibold tracking-widest text-content-subtle uppercase mb-3 px-1">
        Job Details
      </h2>

      <div className="space-y-3 flex-1 flex flex-col">
        <div>
          <label className="block text-xs font-medium text-content-muted mb-1">Job Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Senior Software Engineer"
            className="w-full px-3 py-2 text-sm bg-white dark:bg-[#1a1d23] border border-edge rounded-[var(--radius-md)] text-content placeholder:text-content-subtle focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-content-muted mb-1">Company</label>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g. Acme Corp"
            className="w-full px-3 py-2 text-sm bg-white dark:bg-[#1a1d23] border border-edge rounded-[var(--radius-md)] text-content placeholder:text-content-subtle focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
          />
        </div>

        <div className="flex-1 flex flex-col">
          <label className="block text-xs font-medium text-content-muted mb-1">Job Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Paste the full job description here..."
            className="w-full flex-1 min-h-[160px] px-3 py-2 text-sm bg-white dark:bg-[#1a1d23] border border-edge rounded-[var(--radius-md)] text-content placeholder:text-content-subtle focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all resize-none"
          />
          <p className="text-[11px] text-content-subtle mt-1">
            {description.trim().length} / 50+ characters recommended
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-content-muted mb-1">Template</label>
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value as TemplateType)}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-[#1a1d23] border border-edge rounded-[var(--radius-md)] text-content focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
          >
            {TEMPLATES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleGenerate}
          disabled={!canGenerate || generating}
          className="w-full py-2.5 text-sm font-medium rounded-[var(--radius-md)] bg-brand text-white hover:bg-brand-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {generating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              Generating...
            </span>
          ) : status === 'selecting' || status === 'compiling' || status === 'ready' ? (
            'Regenerate'
          ) : (
            'Create Resume'
          )}
        </button>
      </div>
    </div>
  )
}
