'use client'

import { useState } from 'react'
import { ArrowRight } from '@phosphor-icons/react'

interface TailorInputWidgetProps {
  onGenerate: (title: string, company: string, description: string) => void
  disabled?: boolean
}

export function TailorInputWidget({ onGenerate, disabled }: TailorInputWidgetProps) {
  const [title, setTitle] = useState('')
  const [company, setCompany] = useState('')
  const [description, setDescription] = useState('')
  const empty = !title.trim() || !company.trim() || !description.trim()

  return (
    <div className="mt-3 bg-surface border border-edge rounded-[var(--radius-lg)] p-4 space-y-3">
      <p className="text-xs font-semibold text-content-muted uppercase tracking-wide">
        Job Details
      </p>
      <div className="space-y-2.5">
        <div>
          <label className="text-[11px] text-content-muted mb-1 block">Job Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Software Engineer"
            className="w-full h-8 bg-muted-bg border border-edge rounded-[var(--radius-md)] px-2.5 text-sm text-content placeholder:text-content-subtle outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-colors"
          />
        </div>
        <div>
          <label className="text-[11px] text-content-muted mb-1 block">Company</label>
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Google"
            className="w-full h-8 bg-muted-bg border border-edge rounded-[var(--radius-md)] px-2.5 text-sm text-content placeholder:text-content-subtle outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-colors"
          />
        </div>
        <div>
          <label className="text-[11px] text-content-muted mb-1 block">Job Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Paste the job description here..."
            rows={5}
            className="w-full resize-none bg-muted-bg border border-edge rounded-[var(--radius-md)] px-2.5 py-2 text-sm text-content placeholder:text-content-subtle outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-colors"
          />
        </div>
      </div>
      <button
        type="button"
        disabled={empty || disabled}
        onClick={() => onGenerate(title.trim(), company.trim(), description.trim())}
        className="w-full h-9 flex items-center justify-center gap-1.5 bg-brand text-brand-fg rounded-[var(--radius-md)] text-sm font-medium hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
      >
        Generate Tailored Resume
        <ArrowRight size={14} />
      </button>
    </div>
  )
}
