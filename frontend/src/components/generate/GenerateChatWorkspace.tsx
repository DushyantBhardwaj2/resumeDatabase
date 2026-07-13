'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Sparkle, Chat, User, GraduationCap, Briefcase, Folder, Wrench } from '@phosphor-icons/react'
import { useBuilderStore } from '@/store/useBuilderStore'
import { useTailorChat } from './useTailorChat'
import { toast } from 'sonner'
import { api } from '@/config/api-client'
import { JobDetailsForm } from './JobDetailsForm'
import { ChatComposer } from './ChatComposer'
import { ContactSelectionWidget } from './ContactSelectionWidget'
import { EducationSelectionWidget } from './EducationSelectionWidget'
import { ExperienceSelectionWidget } from './ExperienceSelectionWidget'
import { ProjectSelectionWidget } from './ProjectSelectionWidget'
import { SkillsSelectionWidget } from './SkillsSelectionWidget'

export function GenerateChatWorkspace() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState<'chat' | 'contact' | 'education' | 'experience' | 'projects' | 'skills'>('chat')
  
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
  const setJobTitle = useBuilderStore((s) => s.setJobTitle)
  const setCompany = useBuilderStore((s) => s.setCompany)

  const [historyItems, setHistoryItems] = useState<any[]>([])

  useEffect(() => {
    ;(async () => {
      try {
        const res = await api.api.protected.history.$get()
        if (res.ok) {
          const data = await res.json()
          setHistoryItems(data)
        }
      } catch { /* ignore */ }
    })()
  }, [])

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

      {/* Tabs Bar */}
      {profile && (
        <div className="px-5 py-2 border-b border-edge/50 bg-surface/10 flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
          {[
            { id: 'chat', label: 'Chat Flow', icon: <Chat weight={activeTab === 'chat' ? 'fill' : 'regular'} size={14} /> },
            { id: 'contact', label: 'Contact', icon: <User weight={activeTab === 'contact' ? 'fill' : 'regular'} size={14} /> },
            { id: 'education', label: 'Education', icon: <GraduationCap weight={activeTab === 'education' ? 'fill' : 'regular'} size={14} /> },
            { id: 'experience', label: 'Experience', icon: <Briefcase weight={activeTab === 'experience' ? 'fill' : 'regular'} size={14} /> },
            { id: 'projects', label: 'Projects', icon: <Folder weight={activeTab === 'projects' ? 'fill' : 'regular'} size={14} /> },
            { id: 'skills', label: 'Skills', icon: <Wrench weight={activeTab === 'skills' ? 'fill' : 'regular'} size={14} /> },
          ].map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-brand/10 border-brand/30 text-brand shadow-sm shadow-brand/5'
                    : 'bg-transparent border-transparent text-content-muted hover:text-content hover:bg-surface-subtle/50'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            )
          })}
        </div>
      )}

      {/* Tab Contents */}
      {activeTab === 'chat' ? (
        <>
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
onNext={useCallback(() => addChatEntry({ role: 'assistant', type: 'education-selection' }), [])}
                  />
                )
              }

              if (entry.type === 'education-selection') {
                return (
                  <EducationSelectionWidget
                    key={entry.id}
                    content={entry.content}
                    onNext={useCallback(() => addChatEntry({ role: 'assistant', type: 'experience-selection' }), [])}
                  />
                )
              }

              if (entry.type === 'experience-selection') {
                return (
                  <ExperienceSelectionWidget 
                    key={entry.id} 
                    content={entry.content} 
onNext={useCallback(() => addChatEntry({ role: 'assistant', type: 'project-selection' }), [])}
                  />
                )
              }

              if (entry.type === 'project-selection') {
                return (
                  <ProjectSelectionWidget
                    key={entry.id}
                    content={entry.content}
                    onNext={useCallback(() => addChatEntry({ role: 'assistant', type: 'skills-selection' }), [])}
                  />
                )
              }

              if (entry.type === 'skills-selection') {
                return (
                  <SkillsSelectionWidget 
                    key={entry.id} 
                    content={entry.content} 
                    onNext={useCallback(() => {
                      setCurrentStage('ready')
                      addChatEntry({ role: 'assistant', type: 'greeting' })
                    }, [])}
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
            <div className="flex flex-col border-t border-edge bg-surface/30">
              {historyItems.length > 0 && (
                <div className="px-4 py-2 border-b border-edge/50 flex items-center justify-between gap-2 text-xs">
                  <span className="text-content-muted font-medium">Load recent JD:</span>
                  <select
                    onChange={async (e) => {
                      const val = e.target.value
                      if (!val) return
                      const selectedItem = historyItems.find(item => item.id === val)
                      if (selectedItem) {
                        try {
                          const detailRes = await api.api.protected.history[':id'].$get({
                            param: { id: selectedItem.id }
                          })
                          if (detailRes.ok) {
                            const detailData = await detailRes.json() as { jobDescription?: string; jobTitle?: string; companyName?: string }
                            const jd = detailData.jobDescription || ''
                            setJobTitle(detailData.jobTitle || '')
                            setCompany(detailData.companyName || '')
                            useBuilderStore.setState({ jobDescription: jd })
                            window.dispatchEvent(new CustomEvent('autofill-composer', { detail: jd }))
                            toast.success('Loaded from history')
                          }
                        } catch {
                          toast.error('Failed to load item')
                        }
                      }
                      e.target.value = '' // Reset selection
                    }}
                    className="bg-background border border-edge rounded px-2 py-1 text-[11px] outline-none max-w-[200px] truncate"
                  >
                    <option value="">Select past role...</option>
                    {historyItems.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.jobTitle} at {item.companyName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <ChatComposer onSubmit={handleSubmitJD} generating={generating} />
            </div>
          )}
        </>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 bg-surface/10 flex flex-col justify-start">
          <div className="max-w-2xl mx-auto w-full py-4">
            {activeTab === 'contact' && (
              <ContactSelectionWidget
                content="Confirm and customize the contact details to include on this resume:"
                onNext={useCallback(() => setActiveTab('education'), [])}
              />
            )}
            {activeTab === 'education' && (
              <EducationSelectionWidget
                content="Select which education entries to display:"
                onNext={useCallback(() => setActiveTab('experience'), [])}
              />
            )}
            {activeTab === 'experience' && (
              <ExperienceSelectionWidget
                content="Verify and select which work experience bullets fit this job description best:"
                onNext={useCallback(() => setActiveTab('projects'), [])}
              />
            )}
            {activeTab === 'projects' && (
              <ProjectSelectionWidget
                content="Select which project bullets are relevant for this role:"
                onNext={useCallback(() => setActiveTab('skills'), [])}
              />
            )}
            {activeTab === 'skills' && (
              <SkillsSelectionWidget
                content="Confirm your languages, frameworks, and tools. Unselected tags won't appear."
onNext={useCallback(() => {
                    setCurrentStage('ready')
                    setActiveTab('chat')
                    addChatEntry({ role: 'assistant', type: 'greeting' })
                  }, [])}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
