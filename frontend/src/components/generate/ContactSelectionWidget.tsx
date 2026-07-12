'use client'

import { useState } from 'react'
import { useBuilderStore } from '@/store/useBuilderStore'
import { useProfileStore } from '@/store/useProfileStore'
import { Sparkle, EnvelopeSimple, Phone, LinkedinLogo, GithubLogo, Globe, User, Code, CheckSquare, Square, Plus } from '@phosphor-icons/react'

function ContactFieldSelect({ label, icon, values, selected, onSelect, onSaveToVault }: {
  label: string
  icon: React.ReactNode
  values: string[]
  selected: string
  onSelect: (value: string) => void
  onSaveToVault: (newValue: string) => void
}) {
  const [isAdding, setIsAdding] = useState(false)
  const [newValue, setNewValue] = useState('')

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    if (val === 'ADD_NEW_OPTION') {
      setIsAdding(true)
    } else {
      onSelect(val)
    }
  }

  const handleSave = () => {
    const trimmed = newValue.trim()
    if (!trimmed) return
    onSaveToVault(trimmed)
    onSelect(trimmed)
    setIsAdding(false)
    setNewValue('')
  }

  if (isAdding) {
    return (
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-content-muted flex items-center gap-2">{icon} {label}</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder={`Enter new ${label.toLowerCase()}...`}
            className="flex-1 bg-background border border-edge rounded-md p-2 text-sm text-content outline-none focus:border-brand/50 transition-colors"
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
          />
          <button onClick={handleSave} className="px-3 py-2 bg-brand text-brand-fg text-xs rounded-md font-medium whitespace-nowrap">Save to Vault</button>
          <button onClick={() => setIsAdding(false)} className="px-2 py-2 text-xs text-content-muted">Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium text-content-muted flex items-center gap-2">{icon} {label}</label>
      <div className="flex gap-2">
        <select
          className="flex-1 bg-background border border-edge rounded-md p-2 text-sm text-content outline-none focus:border-brand/50 transition-colors"
          value={selected}
          onChange={handleSelect}
        >
          {values.length === 0 && <option value="" disabled>No entries saved</option>}
          {values.map((v, idx) => <option key={idx} value={v}>{v}</option>)}
          <option value="ADD_NEW_OPTION" className="text-brand font-medium">+ Add new...</option>
        </select>
      </div>
    </div>
  )
}

const combineVaultList = (singular: unknown, array: string[] | undefined): string[] => {
  const fromSingular = typeof singular === 'string' && singular ? [singular] : []
  const fromArray = array || []
  const seen = new Set<string>()
  return [...fromSingular, ...fromArray].filter(v => { if (seen.has(v)) return false; seen.add(v); return true })
}

export function ContactSelectionWidget({ content, onNext }: { content?: string, onNext?: () => void }) {
  const profile = useBuilderStore((s) => s.profile)
  const updateProfile = useBuilderStore((s) => s.updateProfile)
  const contactSelection = useBuilderStore((s) => s.contactSelection)
  const setContactSelection = useBuilderStore((s) => s.setContactSelection)

  if (!profile || !profile.contact) return null

  const vault = profile.contact
  const names = combineVaultList(vault.name, vault.names)
  const emails = combineVaultList(vault.email, vault.emails)
  const phones = combineVaultList(vault.phone, vault.phones)
  const linkedins = combineVaultList(vault.linkedin, vault.linkedins)
  const githubs = combineVaultList(vault.github, vault.githubs)
  const leetcodes = combineVaultList(vault.leetcode, vault.leetcodes)
  const portfolios = combineVaultList(vault.portfolio, vault.portfolios)

  const selectedName = contactSelection.name || (typeof vault.name === 'string' ? vault.name : '')
  const selectedEmail = contactSelection.email ?? emails[0] ?? ''
  const selectedPhone = contactSelection.phone ?? phones[0] ?? ''
  const selectedLinkedin = contactSelection.linkedin ?? linkedins[0] ?? ''
  const selectedGithub = contactSelection.github ?? githubs[0] ?? ''
  const selectedLeetcode = contactSelection.leetcode ?? leetcodes[0] ?? ''
  const selectedPortfolio = contactSelection.portfolio ?? portfolios[0] ?? ''

  const enabledSocials = contactSelection.enabledSocials || ['linkedin', 'github', 'leetcode', 'portfolio']

  const toggleSocial = (social: string) => {
    const next = enabledSocials.includes(social)
      ? enabledSocials.filter(s => s !== social)
      : [...enabledSocials, social]
    setContactSelection({ ...contactSelection, enabledSocials: next })
  }

  const saveToVaultList = (field: string, listField: string, newValue: string) => {
    const currentList = combineVaultList((vault as Record<string, unknown>)[field], (vault as Record<string, unknown>)[listField] as string[] | undefined)
    if (currentList.includes(newValue)) return
    const updatedContact = { ...vault, [listField]: [...currentList, newValue] }
    updateProfile({ ...profile, contact: updatedContact })
    useProfileStore.getState().updateContact(updatedContact)
  }

  const handleNext = () => {
    const updatedContact = {
      ...vault,
      name: selectedName,
      email: selectedEmail,
      phone: selectedPhone,
      linkedin: selectedLinkedin,
      github: selectedGithub,
      leetcode: selectedLeetcode,
      portfolio: selectedPortfolio,
    }
    
    // Check if any default field changed
    const hasChanges = 
      selectedName !== vault.name ||
      selectedEmail !== vault.email ||
      selectedPhone !== vault.phone ||
      selectedLinkedin !== vault.linkedin ||
      selectedGithub !== vault.github ||
      selectedLeetcode !== vault.leetcode ||
      selectedPortfolio !== vault.portfolio;

    if (hasChanges) {
      updateProfile({ ...profile, contact: updatedContact })
      useProfileStore.getState().updateContact(updatedContact)
    }
    if (onNext) onNext()
  }

  const fieldConfigs = [
    { key: 'name', label: 'Full Name', icon: <User weight="duotone" size={14} />, list: names, selected: selectedName },
    { key: 'email', label: 'Email', icon: <EnvelopeSimple weight="duotone" size={14} />, list: emails, selected: selectedEmail },
    { key: 'phone', label: 'Phone', icon: <Phone weight="duotone" size={14} />, list: phones, selected: selectedPhone },
    { key: 'linkedin', label: 'LinkedIn', icon: <LinkedinLogo weight="duotone" size={14} />, list: linkedins, selected: selectedLinkedin },
    { key: 'github', label: 'GitHub', icon: <GithubLogo weight="duotone" size={14} />, list: githubs, selected: selectedGithub },
    { key: 'leetcode', label: 'LeetCode', icon: <Code weight="duotone" size={14} />, list: leetcodes, selected: selectedLeetcode },
    { key: 'portfolio', label: 'Portfolio', icon: <Globe weight="duotone" size={14} />, list: portfolios, selected: selectedPortfolio },
  ]

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
          {fieldConfigs.map((cfg) => (
            <ContactFieldSelect
              key={cfg.key}
              label={cfg.label}
              icon={cfg.icon}
              values={cfg.list}
              selected={cfg.selected}
              onSelect={(val) => setContactSelection({ ...contactSelection, [cfg.key]: val })}
              onSaveToVault={(val) => saveToVaultList(cfg.key, cfg.key + 's', val)}
            />
          ))}

          {/* Social visibility toggles — only for link-type fields */}
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
