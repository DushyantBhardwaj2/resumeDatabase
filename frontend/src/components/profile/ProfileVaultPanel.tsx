'use client'

import { useState } from 'react'
import {
  User,
  FolderOpen,
  Briefcase,
  GraduationCap,
  Certificate,
  GearSix,
  Link as LinkIcon,
  EnvelopeSimple,
  Globe,
  GithubLogo,
  LinkedinLogo,
  Code,
  Star,
} from '@phosphor-icons/react'
import { useProfileStore } from '@/store/useProfileStore'
import { ProfileAccordionList, type AccordionItem } from './ProfileAccordionList'
import { EditEntryDialog } from './EditEntryDialog'
import type { SectionName, Experience, Project } from '@resumint/shared'

type VaultTab = 'info' | 'education' | 'experience' | 'projects' | 'certificates'

const TABS: { key: VaultTab; label: string; icon: React.ElementType }[] = [
  { key: 'info', label: 'Personal Info', icon: User },
  { key: 'education', label: 'Education', icon: GraduationCap },
  { key: 'experience', label: 'Experience', icon: Briefcase },
  { key: 'projects', label: 'Projects', icon: FolderOpen },
  { key: 'certificates', label: 'Certificates', icon: Certificate },
]

export function ProfileVaultPanel() {
  const profile = useProfileStore((s) => s.profile)
  const deleteExperience = useProfileStore((s) => s.deleteExperience)
  const deleteProject = useProfileStore((s) => s.deleteProject)
  const updateExperience = useProfileStore((s) => s.updateExperience)
  const updateProject = useProfileStore((s) => s.updateProject)

  const [activeTab, setActiveTab] = useState<VaultTab>('info')
  
  const [editType, setEditType] = useState<'EXPERIENCE' | 'PROJECT' | null>(null)
  const [editItem, setEditItem] = useState<Experience | Project | null>(null)

  const handleEditExperience = (id: string) => {
    const exp = profile.experience.find(e => e.id === id)
    if (exp) {
      setEditType('EXPERIENCE')
      setEditItem(exp)
    }
  }

  const handleEditProject = (id: string) => {
    const proj = profile.projects.find(p => p.id === id)
    if (proj) {
      setEditType('PROJECT')
      setEditItem(proj)
    }
  }

  const handleSaveEdit = (updatedItem: any) => {
    if (editType === 'EXPERIENCE') {
      updateExperience(updatedItem.id, updatedItem)
    } else if (editType === 'PROJECT') {
      updateProject(updatedItem.id, updatedItem)
    }
    setEditType(null)
    setEditItem(null)
  }

  const sectionCount = (section: SectionName): number => {
    if (section === 'contact') return profile.contact.name ? 1 : 0
    if (section === 'skills') {
      const s = profile.skills
      return s.languages.length + s.frameworks.length + s.tools.length
    }
    return (profile[section] as unknown[]).length
  }

  const experienceItems: AccordionItem[] = profile.experience.map((exp) => ({
    id: exp.id,
    title: exp.role || '(untitled)',
    subtitle: [exp.company, exp.startDate && `${exp.startDate}${exp.endDate ? ` - ${exp.endDate}` : ''}`]
      .filter(Boolean).join(' · '),
    bullets: exp.vaultBullets,
  }))

  const projectItems: AccordionItem[] = profile.projects.map((proj) => ({
    id: proj.id,
    title: proj.title || '(untitled)',
    subtitle: proj.techStack?.join(', '),
    url: proj.url || undefined,
    bullets: proj.vaultBullets,
  }))

  return (
    <div className="flex flex-col h-full bg-surface/20">
      {/* Profile Vault Header */}
      <div className="px-6 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-2xl text-fg flex items-center gap-3 m-0 tracking-tight">
            <div className="w-3 h-3 rounded-full bg-brand shadow-[0_0_12px_rgba(22,163,74,0.6)]"></div>
            Your Career Vault
          </h2>
          <span className="text-[11px] text-content-muted bg-surface px-3 py-1 rounded-[var(--radius-pill)] border border-edge">
            Live Preview
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-edge overflow-x-auto scrollbar-none">
          {TABS.map(({ key, label, icon: Icon }) => {
            const isActive = activeTab === key
            const count = key === 'info' ? 0 : sectionCount(key as SectionName)
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 pb-3 text-[13px] font-medium transition-colors relative whitespace-nowrap ${
                  isActive ? 'text-brand' : 'text-content-muted hover:text-fg'
                }`}
              >
                <Icon size={14} weight={isActive ? 'fill' : 'regular'} />
                {label}
                {count > 0 && (
                  <span className={`text-[10px] rounded-full px-1.5 py-0.5 leading-none ${
                    isActive ? 'bg-brand/20 text-brand' : 'bg-surface border border-edge text-content-subtle'
                  }`}>
                    {count}
                  </span>
                )}
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-brand rounded-t-full shadow-[0_0_8px_rgba(22,163,74,0.5)]"></div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {activeTab === 'info' && <PersonalInfoTab profile={profile} />}
        {activeTab === 'education' && <EducationTab profile={profile} />}
        {activeTab === 'experience' && (
          <ProfileAccordionList 
            items={experienceItems} 
            emptyLabel="No experience entries yet" 
            onEdit={handleEditExperience}
            onDelete={deleteExperience}
          />
        )}
        {activeTab === 'projects' && (
          <ProfileAccordionList 
            items={projectItems} 
            emptyLabel="No projects yet" 
            onEdit={handleEditProject}
            onDelete={deleteProject}
          />
        )}
        {activeTab === 'certificates' && <CertificatesTab profile={profile} />}
      </div>
      
      <EditEntryDialog
        isOpen={editType !== null}
        onClose={() => setEditType(null)}
        type={editType}
        item={editItem}
        onSave={handleSaveEdit}
      />
    </div>
  )
}

function PersonalInfoTab({ profile }: { profile: ReturnType<typeof useProfileStore.getState>['profile'] }) {
  const c = profile.contact
  const hasContact = c.name || c.email || c.phone || c.linkedin || c.github || c.leetcode || c.portfolio
  const hasSkills = profile.skills.languages.length > 0 || profile.skills.frameworks.length > 0 || profile.skills.tools.length > 0

  return (
    <div className="space-y-5">
      {hasContact ? (
        <div>
          <h3 className="text-xs font-medium text-content mb-2 flex items-center gap-1.5">
            <EnvelopeSimple size={13} weight="fill" className="text-brand" />
            Contact
          </h3>
          <div className="space-y-2">
            {c.name && <InfoRow icon={User} label={c.name} />}
            {c.email && <InfoRow icon={EnvelopeSimple} label={c.email} />}
            {c.phone && <InfoRow icon={Star} label={c.phone} />}
            {c.linkedin && (
              <a href={c.linkedin} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-content-muted hover:text-brand transition-colors">
                <LinkedinLogo size={13} /> {c.linkedin}
              </a>
            )}
            {c.github && (
              <a href={c.github} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-content-muted hover:text-brand transition-colors">
                <GithubLogo size={13} /> {c.github}
              </a>
            )}
            {c.leetcode && (
              <a href={c.leetcode} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-content-muted hover:text-brand transition-colors">
                <Code size={13} /> {c.leetcode}
              </a>
            )}
            {c.portfolio && (
              <a href={c.portfolio} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-content-muted hover:text-brand transition-colors">
                <Globe size={13} /> {c.portfolio}
              </a>
            )}
          </div>
        </div>
      ) : (
        <p className="text-xs text-content-muted italic">No contact info set yet.</p>
      )}

      {hasSkills ? (
        <div>
          <h3 className="text-xs font-medium text-content mb-2 flex items-center gap-1.5">
            <GearSix size={13} weight="fill" className="text-brand" />
            Technical Skills
          </h3>
          <div className="space-y-2">
            {profile.skills.languages.length > 0 && (
              <SkillGroup label="Languages" tags={profile.skills.languages} />
            )}
            {profile.skills.frameworks.length > 0 && (
              <SkillGroup label="Frameworks" tags={profile.skills.frameworks} />
            )}
            {profile.skills.tools.length > 0 && (
              <SkillGroup label="Tools" tags={profile.skills.tools} />
            )}
          </div>
        </div>
      ) : (
        <div>
          <h3 className="text-xs font-medium text-content mb-2 flex items-center gap-1.5">
            <GearSix size={13} weight="fill" className="text-brand" />
            Technical Skills
          </h3>
          <p className="text-xs text-content-muted italic">No skills set yet.</p>
        </div>
      )}
    </div>
  )
}

function InfoRow({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-content-muted">
      <Icon size={13} className="text-content-subtle" />
      <span>{label}</span>
    </div>
  )
}

function SkillGroup({ label, tags }: { label: string; tags: string[] }) {
  return (
    <div>
      <p className="text-[10px] text-content-muted mb-1 font-medium">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 bg-brand/8 border border-brand/15 rounded-full px-2 py-0.5 text-[10px] text-brand"
          >
            <Code size={10} />
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}

function EducationTab({ profile }: { profile: ReturnType<typeof useProfileStore.getState>['profile'] }) {
  if (profile.education.length === 0) {
    return <p className="text-xs text-content-muted italic py-4">No education entries yet.</p>
  }
  return (
    <div className="space-y-2.5">
      {profile.education.map((edu, idx) => (
        <div key={idx} className="rounded-[var(--radius-md)] border border-edge bg-card p-3">
          <p className="text-xs font-medium text-content">{edu.school}</p>
          <p className="text-[11px] text-content-muted mt-0.5">
            {[edu.degree, edu.gpa && `GPA: ${edu.gpa}`, edu.startYear && `${edu.startYear}${edu.endYear ? ` - ${edu.endYear}` : ''}`]
              .filter(Boolean).join(' · ')}
          </p>
        </div>
      ))}
    </div>
  )
}

function CertificatesTab({ profile }: { profile: ReturnType<typeof useProfileStore.getState>['profile'] }) {
  const updateCertificate = useProfileStore((s) => s.updateCertificate)

  if (profile.certificates.length === 0) {
    return <p className="text-xs text-content-muted italic py-4">No certificates yet.</p>
  }
  return (
    <div className="space-y-2.5">
      {profile.certificates.map((cert) => (
        <CertificateItem 
          key={cert.id} 
          cert={cert} 
          onSaveLink={(url) => updateCertificate(cert.id, { ...cert, url })} 
        />
      ))}
    </div>
  )
}

function CertificateItem({ cert, onSaveLink }: { cert: any; onSaveLink: (url: string) => void }) {
  const [isEditing, setIsEditing] = useState(false)
  const [urlInput, setUrlInput] = useState(cert.url || '')

  const handleSave = () => {
    onSaveLink(urlInput)
    setIsEditing(false)
  }

  return (
    <div className="rounded-[var(--radius-md)] border border-edge bg-card p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-content">{cert.name}</p>
          <p className="text-[11px] text-content-muted mt-0.5">
            {[cert.issuer, cert.date].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>

      <div>
        {isEditing ? (
          <div className="flex gap-2 items-center">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste verification link (e.g. https://...)"
              className="flex-1 bg-background border border-edge rounded px-2 py-0.5 text-xs text-content outline-none focus:border-brand/50"
              onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
              autoFocus
            />
            <button onClick={handleSave} className="text-[10px] bg-brand text-brand-fg px-2 py-0.5 rounded font-medium shrink-0">Save</button>
            <button onClick={() => setIsEditing(false)} className="text-[10px] text-content-muted px-1 shrink-0">Cancel</button>
          </div>
        ) : !cert.url ? (
          <div className="text-[10px] bg-brand/5 border border-brand/10 text-brand px-2 py-1 rounded flex items-center justify-between">
            <span className="font-medium">⚠️ No verification link added.</span>
            <button 
              onClick={() => setIsEditing(true)}
              className="text-[10px] font-semibold underline text-brand hover:text-brand-dark ml-2 shrink-0"
            >
              Add Link
            </button>
          </div>
        ) : (
          <div className="text-[10px] text-content-muted flex items-center justify-between bg-surface-subtle border border-edge/60 px-2.5 py-1 rounded">
            <div className="flex items-center gap-1 min-w-0">
              <span className="font-medium text-[8px] uppercase tracking-wider text-content-subtle shrink-0">Link:</span>
              <a href={cert.url} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline font-medium truncate">
                {cert.url}
              </a>
            </div>
            <button
              onClick={() => {
                setUrlInput(cert.url || '')
                setIsEditing(true)
              }}
              className="text-[10px] font-semibold underline text-brand hover:text-brand-dark shrink-0 ml-2"
            >
              Edit
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
