'use client'

import { useEffect, useRef } from 'react'
import { Sparkle } from '@phosphor-icons/react'
import { useBuilderStore } from '@/store/useBuilderStore'
import { useTailorChat } from './useTailorChat'
import { JobDetailsForm } from './JobDetailsForm'
import { ChatComposer } from './ChatComposer'
import { ContactSelectionWidget } from './ContactSelectionWidget'
import { EducationSelectionWidget } from './EducationSelectionWidget'
import { ExperienceSelectionWidget } from './ExperienceSelectionWidget'
import { ProjectSelectionWidget } from './ProjectSelectionWidget'
import { SkillsSelectionWidget } from './SkillsSelectionWidget'

export function GenerateChatWorkspace() {
  const scrollRef = useRef<HTMLDivElement>(null)
  
  const { entries, generating, handleSubmitJD, addChatEntry } = useTailorChat()

  const profile = useBuilderStore((s) => s.profile)
  const status = useBuilderStore((s) => s.status)
  const selectedBulletIds = useBuilderStore((s) => s.selectedBulletIds)
  const selectedExperienceIds = useBuilderStore((s) => s.selectedExperienceIds)
  const selectedProjectIds = useBuilderStore((s) => s.selectedProjectIds)
  const contactSelection = useBuilderStore((s) => s.contactSelection)
  const currentStage = useBuilderStore((s) => s.currentStage)
  const setCurrentStage = useBuilderStore((s) => s.setCurrentStage)
  const template = useBuilderStore((s) => s.template)
  const triggerCompile = useBuilderStore((s) => s.triggerCompile)

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [entries])

  // Debounced live recompile on bullet toggle
  const compileTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!profile || (currentStage !== 'reviewing' && currentStage !== 'ready')) return
    if (compileTimer.current) clearTimeout(compileTimer.current)
    compileTimer.current = setTimeout(() => { triggerCompile() }, 600)
    return () => {
      if (compileTimer.current) clearTimeout(compileTimer.current)
    }
  }, [selectedBulletIds, selectedExperienceIds, selectedProjectIds, contactSelection, profile, template, currentStage, triggerCompile])

  return (
    <div className="flex flex-col h-full relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand/20 via-brand to-brand/20"></div>

      {/* Chat Header */}
      <div className="px-5 py-4 border-b border-edge/50 flex items-center gap-3 bg-surface/30 backdrop-blur-md">
        <div className="w-8 h-8 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
          <span className="w-2 h-2 rounded-full bg-brand animate-pulse-glow" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-[15px] text-fg leading-none mb-1">Tailoring Agent</h3>
          <p className="text-[11px] text-content-muted leading-none">Ready to match your profile</p>
        </div>
      </div>

      {/* Scrollable message area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-5 scroll-smooth bg-surface/10">
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

          if (entry.type === 'contact-selection') {
            return (
              <ContactSelectionWidget 
                key={entry.id} 
                content={entry.content} 
                onNext={() => addChatEntry({ role: 'assistant', type: 'education-selection' })} 
              />
            )
          }

          if (entry.type === 'education-selection') {
            return (
              <EducationSelectionWidget 
                key={entry.id} 
                content={entry.content} 
                onNext={() => addChatEntry({ role: 'assistant', type: 'experience-selection' })} 
              />
            )
          }

          if (entry.type === 'experience-selection') {
            return (
              <ExperienceSelectionWidget 
                key={entry.id} 
                content={entry.content} 
                onNext={() => addChatEntry({ role: 'assistant', type: 'project-selection' })} 
              />
            )
          }

          if (entry.type === 'project-selection') {
            return (
              <ProjectSelectionWidget 
                key={entry.id} 
                content={entry.content} 
                onNext={() => addChatEntry({ role: 'assistant', type: 'skills-selection' })} 
              />
            )
          }

          if (entry.type === 'skills-selection') {
            return (
              <SkillsSelectionWidget 
                key={entry.id} 
                content={entry.content} 
                onNext={() => {
                  setCurrentStage('ready')
                  addChatEntry({ role: 'assistant', type: 'greeting' })
                }}
              />
            )
          }

          return null
        })}
      </div>

      {currentStage === 'ready' ? (
        <div className="p-5 border-t border-edge/50 bg-surface/30 backdrop-blur-md text-center">
          <p className="text-sm font-semibold text-fg">Resume tailoring is complete!</p>
          <p className="text-xs text-content-muted mt-1">You can now download the PDF or make further adjustments directly on the right panel.</p>
        </div>
      ) : (
        <ChatComposer onSubmit={handleSubmitJD} generating={generating} />
      )}
    </div>
  )
}
