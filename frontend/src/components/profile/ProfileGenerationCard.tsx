'use client'

import { useState } from 'react'
import { Check, PencilLine, Sparkle, X } from '@phosphor-icons/react'
import type { VaultBullet, Experience, Project, Education, Certificate } from '@/lib/profile-types'
import { useProfileStore } from '@/store/useProfileStore'

export type GeneratedDataType =
  | { type: 'PROJECT'; title: string; url?: string; techStack?: string[]; bullets: VaultBullet[] }
  | { type: 'EXPERIENCE'; company: string; role: string; startDate?: string; endDate?: string; current?: boolean; bullets: VaultBullet[] }
  | { type: 'EDUCATION'; school: string; degree: string; gpa?: string; startYear?: string; endYear?: string }
  | { type: 'CERTIFICATE'; name: string; issuer: string; url?: string; date?: string }
  | { type: 'SKILLS'; languages: string[]; frameworks: string[]; tools: string[] }

interface ProfileGenerationCardProps {
  data: GeneratedDataType
  onAskEdit: () => void
}

export function ProfileGenerationCard({ data, onAskEdit }: ProfileGenerationCardProps) {
  const [selectedBullets, setSelectedBullets] = useState<Set<string>>(
    new Set(data.type === 'PROJECT' || data.type === 'EXPERIENCE' ? data.bullets.map((b) => b.id) : [])
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const toggleBullet = (id: string) => {
    setSelectedBullets((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleAccept = async () => {
    setSaving(true)
    const store = useProfileStore.getState()

    const genId = () => crypto.randomUUID()

    try {
      switch (data.type) {
        case 'PROJECT': {
          const project: Project = {
            id: genId(),
            title: data.title,
            url: data.url || '',
            techStack: data.techStack || [],
            vaultBullets: data.bullets.filter((b) => selectedBullets.has(b.id)),
          }
          store.addProject(project)
          break
        }
        case 'EXPERIENCE': {
          const exp: Experience = {
            id: genId(),
            company: data.company,
            role: data.role,
            startDate: data.startDate || '',
            endDate: data.endDate || '',
            current: data.current || false,
            vaultBullets: data.bullets.filter((b) => selectedBullets.has(b.id)),
          }
          store.addExperience(exp)
          break
        }
        case 'EDUCATION': {
          const edu: Education = {
            school: data.school,
            degree: data.degree,
            gpa: data.gpa || '',
            startYear: data.startYear || '',
            endYear: data.endYear || '',
          }
          store.addEducation(edu)
          break
        }
        case 'CERTIFICATE': {
          const cert: Certificate = {
            id: genId(),
            name: data.name,
            issuer: data.issuer,
            url: data.url || '',
            date: data.date,
          }
          store.addCertificate(cert)
          break
        }
        case 'SKILLS': {
          store.updateSkills({
            languages: data.languages,
            frameworks: data.frameworks,
            tools: data.tools,
          })
          break
        }
      }
      setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  if (saved) {
    return (
      <div className="mt-3 flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 rounded-[var(--radius-md)] px-3 py-2 border border-emerald-200 dark:border-emerald-800">
        <Check size={14} weight="bold" />
        Saved to vault
      </div>
    )
  }

  const showBullets = data.type === 'PROJECT' || data.type === 'EXPERIENCE'

  return (
    <div className="mt-3 rounded-[var(--radius-md)] border border-edge bg-surface overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 bg-card border-b border-edge">
        <Sparkle size={14} className="text-brand" weight="fill" />
        <span className="text-xs font-medium text-content">
          {data.type === 'PROJECT' && `Project: ${data.title}`}
          {data.type === 'EXPERIENCE' && `${data.role} @ ${data.company}`}
          {data.type === 'EDUCATION' && `${data.degree} @ ${data.school}`}
          {data.type === 'CERTIFICATE' && data.name}
          {data.type === 'SKILLS' && 'Technical Skills'}
        </span>
      </div>

      {/* Bullet points */}
      {showBullets && (
        <div className="px-3 py-2 space-y-1 max-h-48 overflow-y-auto">
          {data.bullets.map((b, idx) => (
            <label
              key={b.id}
              className={[
                'flex items-start gap-2 px-2 py-1.5 rounded-[var(--radius-sm)] cursor-pointer transition-colors text-[11px]',
                selectedBullets.has(b.id) ? 'bg-brand/5' : 'hover:bg-muted-bg',
              ].join(' ')}
            >
              <input
                type="checkbox"
                checked={selectedBullets.has(b.id)}
                onChange={() => toggleBullet(b.id)}
                className="mt-0.5 accent-brand w-3 h-3 shrink-0"
              />
              <span className={selectedBullets.has(b.id) ? 'text-content' : 'text-content-muted'}>
                {b.text}
              </span>
            </label>
          ))}
        </div>
      )}

      {/* Education / Certificate / Skills preview */}
      {data.type === 'EDUCATION' && (
        <div className="px-3 py-2 text-xs text-content-muted space-y-0.5">
          <p><span className="text-content">School:</span> {data.school}</p>
          <p><span className="text-content">Degree:</span> {data.degree}</p>
          {data.gpa && <p><span className="text-content">GPA:</span> {data.gpa}</p>}
          {data.startYear && <p><span className="text-content">Years:</span> {data.startYear}{data.endYear ? ` - ${data.endYear}` : ''}</p>}
        </div>
      )}

      {data.type === 'CERTIFICATE' && (
        <div className="px-3 py-2 text-xs text-content-muted space-y-0.5">
          <p><span className="text-content">Issuer:</span> {data.issuer}</p>
          {data.date && <p><span className="text-content">Date:</span> {data.date}</p>}
        </div>
      )}

      {data.type === 'SKILLS' && (
        <div className="px-3 py-2 space-y-1.5">
          {(['languages', 'frameworks', 'tools'] as const).map((cat) => {
            const items = data[cat]
            if (!items?.length) return null
            return (
              <div key={cat} className="flex flex-wrap gap-1">
                <span className="text-[10px] text-content-muted capitalize mr-1">{cat}:</span>
                {items.map((t: string) => (
                  <span key={t} className="inline-flex items-center gap-1 bg-brand/10 text-brand text-[10px] px-1.5 py-0.5 rounded-full">
                    {t}
                  </span>
                ))}
              </div>
            )
          })}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 px-3 py-2 border-t border-edge">
        {showBullets && selectedBullets.size > 0 && (
          <span className="text-[10px] text-content-muted mr-auto">
            {selectedBullets.size} / {data.bullets.length} selected
          </span>
        )}
        <button
          onClick={onAskEdit}
          className="flex items-center gap-1 h-7 px-3 border border-edge rounded-[var(--radius-md)] text-[10px] text-content-muted hover:text-content hover:bg-surface transition-colors"
        >
          <PencilLine size={12} />
          Ask for Edit
        </button>
        <button
          onClick={handleAccept}
          disabled={saving || (showBullets && selectedBullets.size === 0)}
          className="flex items-center gap-1 h-7 px-3 bg-brand text-brand-fg rounded-[var(--radius-md)] text-[10px] font-medium hover:opacity-90 transition-all disabled:opacity-40"
        >
          {saving ? (
            <div className="w-3 h-3 rounded-full border-2 border-brand-fg border-t-transparent animate-spin" />
          ) : (
            <Check size={12} weight="bold" />
          )}
          Accept and Save
        </button>
      </div>
    </div>
  )
}
