'use client'

import { useState, useCallback } from 'react'
import { api } from '@/config/api-client'
import { PencilSimple, Check, ArrowClockwise } from '@phosphor-icons/react'
import { toast } from 'sonner'

type ExpItem = { role: string; company: string; originalBullets: string[]; tailoredBullets: string[] }
type ProjItem = { title: string; originalBullets: string[]; tailoredBullets: string[] }

interface TailorResultData {
  id: string
  jobTitle: string
  companyName: string
  experience: ExpItem[]
  projects: ProjItem[]
  skills: { original: string[]; tailored: string[] }
}

interface TailorResultWidgetProps {
  result: TailorResultData
  onReset: () => void
}

function EditableBullet({ text, onSave }: { text: string; onSave: (val: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(text)

  if (editing) {
    return (
      <div className="flex gap-1.5 items-start">
        <textarea
          className="flex-1 text-xs text-content bg-muted-bg border border-brand rounded-[var(--radius-md)] px-2 py-1.5 outline-none focus:ring-2 focus:ring-brand/20 resize-none"
          rows={2}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          autoFocus
        />
        <button
          onClick={() => { onSave(draft); setEditing(false) }}
          className="shrink-0 h-6 w-6 flex items-center justify-center rounded-[var(--radius-md)] bg-brand text-brand-fg hover:opacity-90 transition-opacity mt-0.5"
        >
          <Check size={10} weight="bold" />
        </button>
      </div>
    )
  }

  return (
    <div
      className="group flex items-start gap-1.5 cursor-pointer hover:bg-brand-light/40 rounded-[var(--radius-md)] px-1.5 py-1 -mx-1.5 transition-colors"
      onClick={() => { setDraft(text); setEditing(true) }}
    >
      <span className="text-brand shrink-0 mt-0.5 text-[10px]">•</span>
      <span className="text-xs text-content flex-1 leading-relaxed">{text}</span>
      <PencilSimple size={10} className="shrink-0 text-content-subtle opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
    </div>
  )
}

export function TailorResultWidget({ result, onReset }: TailorResultWidgetProps) {
  const [data, setData] = useState(result)
  const [dirty, setDirty] = useState(false)

  const updateExpBullet = (expIdx: number, bulletIdx: number, val: string) => {
    setData((prev) => {
      const next = { ...prev }
      next.experience = prev.experience.map((e, i) =>
        i === expIdx ? { ...e, tailoredBullets: e.tailoredBullets.map((b, j) => (j === bulletIdx ? val : b)) } : e
      )
      return next
    })
    setDirty(true)
  }

  const updateProjBullet = (projIdx: number, bulletIdx: number, val: string) => {
    setData((prev) => {
      const next = { ...prev }
      next.projects = prev.projects.map((p, i) =>
        i === projIdx ? { ...p, tailoredBullets: p.tailoredBullets.map((b, j) => (j === bulletIdx ? val : b)) } : p
      )
      return next
    })
    setDirty(true)
  }

  const handleSave = useCallback(async () => {
    try {
      const res = await api.api.protected.history[':id'].$patch({
        param: { id: data.id },
        json: data,
      })
      if (!res.ok) throw new Error()
      toast.success('Changes saved')
      setDirty(false)
    } catch { toast.error('Failed to save') }
  }, [data])

  return (
    <div className="mt-3 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display font-semibold text-sm text-content">{data.jobTitle}</p>
          <p className="text-xs text-content-muted">{data.companyName}</p>
        </div>
        <div className="flex items-center gap-1.5">
          {dirty && (
            <button
              onClick={handleSave}
              className="h-7 px-2.5 bg-brand text-brand-fg rounded-[var(--radius-md)] text-[11px] font-medium hover:opacity-90 transition-opacity"
            >
              Save
            </button>
          )}
          <button
            onClick={onReset}
            className="h-7 w-7 flex items-center justify-center rounded-[var(--radius-md)] text-content-muted hover:text-content hover:bg-muted-bg transition-colors"
            title="Tailor another"
          >
            <ArrowClockwise size={13} />
          </button>
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-2 gap-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-content-muted">Original</p>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-brand">Tailored</p>
      </div>

      {/* Experience */}
      {data.experience.map((exp, expIdx) => (
        <div key={expIdx} className="bg-card border border-edge rounded-[var(--radius-lg)] overflow-hidden">
          <div className="px-3 py-2 border-b border-edge bg-surface-subtle">
            <p className="text-xs font-semibold text-content">{exp.role}</p>
            <p className="text-[10px] text-content-muted">{exp.company}</p>
          </div>
          <div className="grid grid-cols-2 divide-x divide-edge">
            <div className="p-3 space-y-1">
              {exp.originalBullets.map((b, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <span className="text-content-subtle shrink-0 mt-0.5 text-[10px]">•</span>
                  <span className="text-xs text-content-muted leading-relaxed">{b}</span>
                </div>
              ))}
            </div>
            <div className="p-3 space-y-1">
              {exp.tailoredBullets.map((b, i) => (
                <EditableBullet key={i} text={b} onSave={(val) => updateExpBullet(expIdx, i, val)} />
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* Projects */}
      {data.projects.map((proj, projIdx) => (
        <div key={projIdx} className="bg-card border border-edge rounded-[var(--radius-lg)] overflow-hidden">
          <div className="px-3 py-2 border-b border-edge bg-surface-subtle">
            <p className="text-xs font-semibold text-content">{proj.title}</p>
          </div>
          <div className="grid grid-cols-2 divide-x divide-edge">
            <div className="p-3 space-y-1">
              {proj.originalBullets.map((b, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <span className="text-content-subtle shrink-0 mt-0.5 text-[10px]">•</span>
                  <span className="text-xs text-content-muted leading-relaxed">{b}</span>
                </div>
              ))}
            </div>
            <div className="p-3 space-y-1">
              {proj.tailoredBullets.map((b, i) => (
                <EditableBullet key={i} text={b} onSave={(val) => updateProjBullet(projIdx, i, val)} />
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* Skills */}
      {data.skills && (
        <div className="bg-card border border-edge rounded-[var(--radius-lg)] overflow-hidden">
          <div className="grid grid-cols-2 divide-x divide-edge">
            <div className="p-3 flex flex-wrap gap-1">
              {data.skills.original.map((s) => (
                <span key={s} className="bg-muted-bg border border-edge rounded-full px-2 py-0.5 text-[10px] text-content-muted">{s}</span>
              ))}
            </div>
            <div className="p-3 flex flex-wrap gap-1">
              {data.skills.tailored.map((s) => (
                <span key={s} className="bg-brand-light border border-brand/20 rounded-full px-2 py-0.5 text-[10px] text-brand font-medium">{s}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
