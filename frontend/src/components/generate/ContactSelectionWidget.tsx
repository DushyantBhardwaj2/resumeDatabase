'use client'

import { useBuilderStore } from '@/store/useBuilderStore'
import { useProfileStore } from '@/store/useProfileStore'
import { Sparkle, EnvelopeSimple, Phone, LinkedinLogo, GithubLogo, Globe, User, Code, CheckSquare, Square } from '@phosphor-icons/react'

export function ContactSelectionWidget({ content, onNext }: { content?: string, onNext?: () => void }) {
  const profile = useBuilderStore((s) => s.profile)
  const contactSelection = useBuilderStore((s) => s.contactSelection)
  const setContactSelection = useBuilderStore((s) => s.setContactSelection)

  if (!profile || !profile.contact) return null

  const handleNext = () => {
    // Persist name changes back to vault
    if (contactSelection.name && contactSelection.name !== profile.contact.name) {
      useProfileStore.getState().updateContact({ ...profile.contact, name: contactSelection.name })
    }
    if (onNext) onNext()
  }

  const getArray = (val: unknown) => Array.isArray(val) ? val as string[] : (val ? [val as string] : [])
  const emails = getArray(profile.contact.email).concat(profile.contact.emails || [])
  const phones = getArray(profile.contact.phone).concat(profile.contact.phones || [])
  const linkedins = getArray(profile.contact.linkedin).concat(profile.contact.linkedins || [])
  const githubs = getArray(profile.contact.github).concat(profile.contact.githubs || [])
  const portfolios = getArray(profile.contact.portfolio).concat(profile.contact.portfolios || [])

  const name = contactSelection.name || (typeof profile.contact.name === 'string' ? profile.contact.name : '')
  const selectedEmail = contactSelection.email ?? emails[0] ?? ''
  const selectedPhone = contactSelection.phone ?? phones[0] ?? ''
  const selectedLinkedin = contactSelection.linkedin ?? linkedins[0] ?? ''
  const selectedGithub = contactSelection.github ?? githubs[0] ?? ''
  const selectedPortfolio = contactSelection.portfolio ?? portfolios[0] ?? ''
  const selectedLeetcode = contactSelection.leetcode || (typeof profile.contact.leetcode === 'string' ? profile.contact.leetcode : '')

  const enabledSocials = contactSelection.enabledSocials || ['linkedin', 'github', 'leetcode', 'portfolio']
  
  const toggleSocial = (social: string) => {
    const next = enabledSocials.includes(social)
      ? enabledSocials.filter(s => s !== social)
      : [...enabledSocials, social]
    setContactSelection({ ...contactSelection, enabledSocials: next })
  }

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
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-content-muted flex items-center gap-2"><User weight="duotone" /> Full Name</label>
            <input 
              className="bg-background border border-edge rounded-md p-2 text-sm text-content outline-none focus:border-brand/50 transition-colors"
              value={name}
              onChange={(e) => setContactSelection({ ...contactSelection, name: e.target.value })}
              placeholder="Your full name"
            />
          </div>

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
          
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-content-muted flex items-center gap-2"><Code weight="duotone" /> LeetCode URL</label>
            <input 
              className="bg-background border border-edge rounded-md p-2 text-sm text-content outline-none focus:border-brand/50 transition-colors"
              value={selectedLeetcode}
              onChange={(e) => setContactSelection({ ...contactSelection, leetcode: e.target.value })}
              placeholder="https://leetcode.com/u/your-profile"
            />
          </div>

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

          <div className="border-t border-edge/50 pt-4">
            <label className="text-xs font-medium text-content-muted mb-3 block">Show on Resume</label>
            <div className="flex flex-wrap gap-3">
              {[
                { key: 'linkedin', label: 'LinkedIn', icon: <LinkedinLogo size={14} /> },
                { key: 'github', label: 'GitHub', icon: <GithubLogo size={14} /> },
                { key: 'leetcode', label: 'LeetCode', icon: <Code size={14} /> },
                { key: 'portfolio', label: 'Portfolio', icon: <Globe size={14} /> },
              ].map(social => (
                <button
                  key={social.key}
                  onClick={() => toggleSocial(social.key)}
                  className="flex items-center gap-1.5 text-xs text-content-muted hover:text-content transition-colors"
                >
                  {enabledSocials.includes(social.key) ? (
                    <CheckSquare size={14} className="text-brand" weight="fill" />
                  ) : (
                    <Square size={14} className="text-content-muted" />
                  )}
                  {social.icon}
                  {social.label}
                </button>
              ))}
            </div>
          </div>
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