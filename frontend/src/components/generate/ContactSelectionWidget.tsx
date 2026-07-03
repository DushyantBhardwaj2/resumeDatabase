'use client'

import { useBuilderStore } from '@/store/useBuilderStore'
import { Sparkle, EnvelopeSimple, Phone, LinkedinLogo, GithubLogo, Globe } from '@phosphor-icons/react'
import { useTailorChat } from './useTailorChat'

export function ContactSelectionWidget({ content }: { content?: string }) {
  const profile = useBuilderStore((s) => s.profile)
  const contactSelection = useBuilderStore((s) => s.contactSelection)
  const setContactSelection = useBuilderStore((s) => s.setContactSelection)
  const { addChatEntry } = useTailorChat()

  if (!profile || !profile.contact) return null

  const handleNext = () => {
    addChatEntry({ role: 'assistant', type: 'experience-selection', content: "Great! Now let's review your Work Experience." })
  }

  const emails = profile.contact.email ? [profile.contact.email] : []
  const phones = profile.contact.phone ? [profile.contact.phone] : []
  const linkedins = profile.contact.linkedin ? [profile.contact.linkedin] : []
  const githubs = profile.contact.github ? [profile.contact.github] : []
  const portfolios = profile.contact.portfolio ? [profile.contact.portfolio] : []

  const selectedEmail = contactSelection.email ?? emails[0] ?? ''
  const selectedPhone = contactSelection.phone ?? phones[0] ?? ''
  const selectedLinkedin = contactSelection.linkedin ?? linkedins[0] ?? ''
  const selectedGithub = contactSelection.github ?? githubs[0] ?? ''
  const selectedPortfolio = contactSelection.portfolio ?? portfolios[0] ?? ''

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
          <Sparkle size={16} className="text-brand" />
        </div>
        <div className="pt-1.5">
          <p className="text-sm text-content leading-relaxed">{content}</p>
        </div>
      </div>
      
      <div className="ml-11 bg-surface/50 border border-edge rounded-xl p-5 shadow-sm backdrop-blur-md">
        <h4 className="text-sm font-semibold text-fg mb-4">Contact Information</h4>
        
        <div className="space-y-4">
          {emails.length > 0 && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-content-muted flex items-center gap-2"><EnvelopeSimple weight="duotone" /> Email</label>
              <select 
                className="bg-background border border-edge rounded-md p-2 text-sm text-content outline-none focus:border-brand/50 transition-colors"
                value={selectedEmail}
                onChange={(e) => setContactSelection({ ...contactSelection, email: e.target.value })}
              >
                {emails.map((e, idx) => <option key={idx} value={e}>{e}</option>)}
              </select>
            </div>
          )}

          {phones.length > 0 && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-content-muted flex items-center gap-2"><Phone weight="duotone" /> Phone</label>
              <select 
                className="bg-background border border-edge rounded-md p-2 text-sm text-content outline-none focus:border-brand/50 transition-colors"
                value={selectedPhone}
                onChange={(e) => setContactSelection({ ...contactSelection, phone: e.target.value })}
              >
                {phones.map((p, idx) => <option key={idx} value={p}>{p}</option>)}
              </select>
            </div>
          )}

          {linkedins.length > 0 && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-content-muted flex items-center gap-2"><LinkedinLogo weight="duotone" /> LinkedIn</label>
              <select 
                className="bg-background border border-edge rounded-md p-2 text-sm text-content outline-none focus:border-brand/50 transition-colors"
                value={selectedLinkedin}
                onChange={(e) => setContactSelection({ ...contactSelection, linkedin: e.target.value })}
              >
                {linkedins.map((l, idx) => <option key={idx} value={l}>{l}</option>)}
              </select>
            </div>
          )}

          {githubs.length > 0 && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-content-muted flex items-center gap-2"><GithubLogo weight="duotone" /> GitHub</label>
              <select 
                className="bg-background border border-edge rounded-md p-2 text-sm text-content outline-none focus:border-brand/50 transition-colors"
                value={selectedGithub}
                onChange={(e) => setContactSelection({ ...contactSelection, github: e.target.value })}
              >
                {githubs.map((g, idx) => <option key={idx} value={g}>{g}</option>)}
              </select>
            </div>
          )}
          
          {portfolios.length > 0 && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-content-muted flex items-center gap-2"><Globe weight="duotone" /> Portfolio</label>
              <select 
                className="bg-background border border-edge rounded-md p-2 text-sm text-content outline-none focus:border-brand/50 transition-colors"
                value={selectedPortfolio}
                onChange={(e) => setContactSelection({ ...contactSelection, portfolio: e.target.value })}
              >
                {portfolios.map((p, idx) => <option key={idx} value={p}>{p}</option>)}
              </select>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button 
            onClick={handleNext}
            className="px-4 py-2 bg-brand/10 text-brand hover:bg-brand/20 transition-colors rounded-md text-sm font-medium"
          >
            Confirm & Next
          </button>
        </div>
      </div>
    </div>
  )
}
