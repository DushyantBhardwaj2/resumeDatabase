'use client'

import { useEffect, useRef } from 'react'
import { Sparkle } from '@phosphor-icons/react'
import { useBuilderStore } from '@/store/useBuilderStore'
import { useTailorChat } from './useTailorChat'
import { JobDetailsForm } from './JobDetailsForm'
import { BulletChecklist } from './BulletChecklist'
import { ChatComposer } from './ChatComposer'

export function GenerateChatWorkspace() {
  const scrollRef = useRef<HTMLDivElement>(null)
  
  const { entries, generating, handleSubmitJD } = useTailorChat()

  const profile = useBuilderStore((s) => s.profile)
  const status = useBuilderStore((s) => s.status)
  const selectedBulletIds = useBuilderStore((s) => s.selectedBulletIds)
  const currentStage = useBuilderStore((s) => s.currentStage)
  const triggerCompile = useBuilderStore((s) => s.triggerCompile)

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
            return <JobDetailsForm key={entry.id} />
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

          if (entry.type === 'error') {
            return (
              <div key={entry.id} className="flex items-start gap-3 ml-11">
                <div className="h-6 w-6 rounded-full bg-error/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[10px] text-error font-bold">!</span>
                </div>
                <p className="text-xs text-error leading-relaxed">{entry.content}</p>
              </div>
            )
          }

          if (entry.type === 'checklist') {
            return (
              <div key={entry.id}>
                <BulletChecklist />
              </div>
            )
          }

          return null
        })}
      </div>

      <ChatComposer onSubmit={handleSubmitJD} generating={generating} />
    </div>
  )
}
