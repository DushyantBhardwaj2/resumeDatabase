'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { api } from '@/config/api-client'
import { useChatStore } from '@/store/useChatStore'
import { normalizeProfile } from '@/lib/normalize-profile'
import { ProfileSectionEditor } from './ProfileSectionEditor'
import type { SectionName, Profile } from '@resumint/shared'
import {
  Lock,
  ShieldCheck,
  Cpu,
  PencilSimple,
  FloppyDisk,
  X,
  EnvelopeSimple,
  GraduationCap,
  Briefcase,
  FolderOpen,
  GearSix,
  Certificate,
  ArrowRight,
} from '@phosphor-icons/react'

export function OnboardingPreviewPanel() {
  const router = useRouter()
  const extractedData = useChatStore((s) => s.extractedData)
  const isTyping = useChatStore((s) => s.isTyping)
  const [editingSection, setEditingSection] = useState<SectionName | null>(null)
  const [saving, setSaving] = useState(false)

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const res = await api.api.protected.profile.$post({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        json: { parsed: extractedData as any },
      })
      if (!res.ok) throw new Error('Failed to save profile')
      useChatStore.setState({ currentPhase: 'COMPLETE' })
      toast.success('Profile saved to your Career Vault!')
      router.push('/dashboard')
    } catch {
      toast.error('Failed to save profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }
  
  // Normalize the parsed profile
  const profile = useMemo(() => normalizeProfile(extractedData), [extractedData])

  // Local editing state for inline editor
  const [editingData, setEditingData] = useState<Profile | null>(null)

  const handleStartEdit = useCallback((section: SectionName) => {
    setEditingData(JSON.parse(JSON.stringify(profile)))
    setEditingSection(section)
  }, [profile])

  const handleSave = useCallback(() => {
    if (editingData) {
      useChatStore.setState({ extractedData: editingData as any })
    }
    setEditingSection(null)
    setEditingData(null)
  }, [editingData])

  const handleCancel = useCallback(() => {
    setEditingSection(null)
    setEditingData(null)
  }, [])

  const hasData = useMemo(() => {
    return (
      !!(profile.contact.name || profile.contact.email) ||
      profile.experience.length > 0 ||
      profile.projects.length > 0 ||
      profile.skills.languages.length > 0 ||
      profile.education.length > 0
    )
  }, [profile])

  if (!hasData) {
    return (
      <div className="space-y-6 max-w-xl mx-auto h-full flex flex-col justify-center animate-fade-in">
        <div className="glass p-6 rounded-[var(--radius-xl)] border border-edge relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 blur-2xl rounded-full pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-brand/10 text-brand rounded-[var(--radius-lg)]">
              <ShieldCheck size={24} weight="duotone" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-content">Privacy & Data Safeguards</h2>
              <p className="text-xs text-content-muted">Your data is fully protected and secure</p>
            </div>
          </div>

          <ul className="space-y-3.5 text-sm text-content-subtle">
            <li className="flex gap-2.5">
              <Lock size={18} className="text-brand shrink-0 mt-0.5" />
              <span>
                <strong className="text-content">Secure Cloud Database:</strong> Your resume data is stored in a private Supabase PostgreSQL database protected by authentication middleware.
              </span>
            </li>
            <li className="flex gap-2.5">
              <Cpu size={18} className="text-brand shrink-0 mt-0.5" />
              <span>
                <strong className="text-content">Transient AI Parsing:</strong> Resumes are scanned dynamically to build your profile database. No long-term file caching of raw PDFs occurs unless requested.
              </span>
            </li>
            <li className="flex gap-2.5">
              <ShieldCheck size={18} className="text-brand shrink-0 mt-0.5" />
              <span>
                <strong className="text-content">No Sales or Sharing:</strong> Your profile data is private, secure, and used solely for generating customized resumes and PDF matching.
              </span>
            </li>
          </ul>
        </div>

        <div className="glass p-6 rounded-[var(--radius-xl)] border border-edge">
          <h3 className="font-display text-sm font-semibold text-content mb-3.5">How Resumint Works</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-[var(--radius-lg)] bg-surface-subtle border border-edge">
              <div className="font-display text-base font-bold text-brand mb-1">1</div>
              <div className="font-medium text-xs text-content mb-0.5">Upload Profile</div>
              <div className="text-[10px] text-content-muted">PDF resume parser fills your Career Vault.</div>
            </div>
            <div className="p-3 rounded-[var(--radius-lg)] bg-surface-subtle border border-edge">
              <div className="font-display text-base font-bold text-brand mb-1">2</div>
              <div className="font-medium text-xs text-content mb-0.5">Expand Bullets</div>
              <div className="text-[10px] text-content-muted">AI generates 10+ options per job bullet.</div>
            </div>
            <div className="p-3 rounded-[var(--radius-lg)] bg-surface-subtle border border-edge">
              <div className="font-display text-base font-bold text-brand mb-1">3</div>
              <div className="font-medium text-xs text-content mb-0.5">Tailor Live</div>
              <div className="text-[10px] text-content-muted">Pick the best matching bullets dynamically.</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12 animate-fade-up">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-content">Career Vault Preview</h2>
          <p className="text-xs text-content-muted">This data has been extracted. You can review and edit below.</p>
        </div>
        <div className="flex items-center gap-2">
          {isTyping && (
            <span className="text-xs bg-brand-light/30 border border-brand/20 text-brand px-2.5 py-0.5 rounded-full flex items-center gap-1.5 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-brand" />
              AI Parsing...
            </span>
          )}
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="px-4 py-2 bg-brand text-brand-fg text-xs font-semibold rounded-[var(--radius-lg)] shadow hover:opacity-90 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full border-2 border-brand-fg border-t-transparent animate-spin" />
                Saving...
              </span>
            ) : (
              <>
                Save & Continue <ArrowRight size={14} weight="bold" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Contact Section */}
      <CardSection
        title="Contact Info"
        icon={EnvelopeSimple}
        isActive={editingSection === 'contact'}
        onEdit={() => handleStartEdit('contact')}
      >
        {editingSection === 'contact' && editingData ? (
          <ProfileSectionEditor
            section="contact"
            data={editingData}
            onChange={(d) => setEditingData(d)}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {profile.contact.name && (
              <div>
                <span className="text-content-muted block text-xs">Full Name</span>
                <span className="font-medium text-content">{profile.contact.name}</span>
              </div>
            )}
            {profile.contact.email && (
              <div>
                <span className="text-content-muted block text-xs">Email Address</span>
                <span className="font-medium text-content">{profile.contact.email}</span>
              </div>
            )}
            {profile.contact.phone && (
              <div>
                <span className="text-content-muted block text-xs">Phone Number</span>
                <span className="font-medium text-content">{profile.contact.phone}</span>
              </div>
            )}
            {profile.contact.linkedin && (
              <div>
                <span className="text-content-muted block text-xs">LinkedIn</span>
                <span className="font-medium text-content break-all">{profile.contact.linkedin}</span>
              </div>
            )}
            {profile.contact.github && (
              <div>
                <span className="text-content-muted block text-xs">GitHub</span>
                <span className="font-medium text-content break-all">{profile.contact.github}</span>
              </div>
            )}
            {profile.contact.portfolio && (
              <div>
                <span className="text-content-muted block text-xs">Portfolio</span>
                <span className="font-medium text-content break-all">{profile.contact.portfolio}</span>
              </div>
            )}
          </div>
        )}
      </CardSection>

      {/* Experience Section */}
      <CardSection
        title="Work Experience"
        icon={Briefcase}
        isActive={editingSection === 'experience'}
        onEdit={() => handleStartEdit('experience')}
      >
        {editingSection === 'experience' && editingData ? (
          <ProfileSectionEditor
            section="experience"
            data={editingData}
            onChange={(d) => setEditingData(d)}
          />
        ) : profile.experience.length === 0 ? (
          <p className="text-sm text-content-muted italic">No work experience entries added.</p>
        ) : (
          <div className="space-y-4">
            {profile.experience.map((exp) => (
              <div key={exp.id} className="border-l-2 border-edge pl-3.5 py-0.5 space-y-1.5">
                <div className="flex justify-between items-start flex-wrap gap-1">
                  <div>
                    <h4 className="font-semibold text-sm text-content">{exp.role}</h4>
                    <p className="text-xs text-content-muted">{exp.company}</p>
                  </div>
                  <span className="text-[10px] text-content-muted bg-surface-subtle px-2 py-0.5 rounded-full border border-edge">
                    {exp.startDate || 'N/A'} - {exp.current ? 'Present' : exp.endDate || 'N/A'}
                  </span>
                </div>
                {exp.vaultBullets && exp.vaultBullets.length > 0 && (
                  <ul className="list-disc pl-4 text-xs text-content-subtle space-y-1">
                    {exp.vaultBullets.map((b) => (
                      <li key={b.id}>{b.text}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </CardSection>

      {/* Projects Section */}
      <CardSection
        title="Projects"
        icon={FolderOpen}
        isActive={editingSection === 'projects'}
        onEdit={() => handleStartEdit('projects')}
      >
        {editingSection === 'projects' && editingData ? (
          <ProfileSectionEditor
            section="projects"
            data={editingData}
            onChange={(d) => setEditingData(d)}
          />
        ) : profile.projects.length === 0 ? (
          <p className="text-sm text-content-muted italic">No project entries added.</p>
        ) : (
          <div className="space-y-4">
            {profile.projects.map((proj) => (
              <div key={proj.id} className="space-y-1.5">
                <div className="flex justify-between items-start flex-wrap gap-1">
                  <div>
                    <h4 className="font-semibold text-sm text-content">{proj.title}</h4>
                    {proj.url && (
                      <a href={proj.url} target="_blank" rel="noreferrer" className="text-xs text-brand hover:underline break-all block">
                        {proj.url}
                      </a>
                    )}
                  </div>
                </div>
                {proj.techStack && proj.techStack.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {proj.techStack.map((tech) => (
                      <span key={tech} className="text-[10px] bg-muted-bg text-content border border-edge px-1.5 py-0.5 rounded">
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
                {proj.vaultBullets && proj.vaultBullets.length > 0 && (
                  <ul className="list-disc pl-4 text-xs text-content-subtle space-y-1">
                    {proj.vaultBullets.map((b) => (
                      <li key={b.id}>{b.text}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </CardSection>

      {/* Skills Section */}
      <CardSection
        title="Skills"
        icon={GearSix}
        isActive={editingSection === 'skills'}
        onEdit={() => handleStartEdit('skills')}
      >
        {editingSection === 'skills' && editingData ? (
          <ProfileSectionEditor
            section="skills"
            data={editingData}
            onChange={(d) => setEditingData(d)}
          />
        ) : (
          <div className="space-y-3.5 text-xs">
            {profile.skills.languages.length > 0 && (
              <div>
                <span className="text-content-muted block mb-1 text-[11px] font-medium uppercase tracking-wider">Languages</span>
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.languages.map((l) => (
                    <span key={l} className="bg-brand/10 border border-brand/20 text-brand px-2 py-0.5 rounded-full font-medium">{l}</span>
                  ))}
                </div>
              </div>
            )}
            {profile.skills.frameworks.length > 0 && (
              <div>
                <span className="text-content-muted block mb-1 text-[11px] font-medium uppercase tracking-wider">Frameworks / Libraries</span>
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.frameworks.map((f) => (
                    <span key={f} className="bg-muted-bg text-content border border-edge px-2 py-0.5 rounded-full">{f}</span>
                  ))}
                </div>
              </div>
            )}
            {profile.skills.tools.length > 0 && (
              <div>
                <span className="text-content-muted block mb-1 text-[11px] font-medium uppercase tracking-wider">Tools & Platforms</span>
                <div className="flex flex-wrap gap-1.5">
                  {profile.skills.tools.map((t) => (
                    <span key={t} className="bg-muted-bg text-content-subtle border border-edge px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardSection>

      {/* Education Section */}
      <CardSection
        title="Education"
        icon={GraduationCap}
        isActive={editingSection === 'education'}
        onEdit={() => handleStartEdit('education')}
      >
        {editingSection === 'education' && editingData ? (
          <ProfileSectionEditor
            section="education"
            data={editingData}
            onChange={(d) => setEditingData(d)}
          />
        ) : profile.education.length === 0 ? (
          <p className="text-sm text-content-muted italic">No education entries added.</p>
        ) : (
          <div className="space-y-3.5">
            {profile.education.map((edu) => (
              <div key={edu.id} className="flex justify-between items-start gap-4 flex-wrap text-sm">
                <div>
                  <h4 className="font-semibold text-content">{edu.school}</h4>
                  <p className="text-xs text-content-muted">
                    {edu.degree} {edu.gpa ? `· GPA: ${edu.gpa}` : ''}
                  </p>
                </div>
                <span className="text-[10px] text-content-muted bg-surface-subtle px-2 py-0.5 rounded-full border border-edge">
                  {edu.startYear || 'N/A'} - {edu.endYear || 'N/A'}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardSection>

      {/* Certificates Section */}
      <CardSection
        title="Certificates"
        icon={Certificate}
        isActive={editingSection === 'certificates'}
        onEdit={() => handleStartEdit('certificates')}
      >
        {editingSection === 'certificates' && editingData ? (
          <ProfileSectionEditor
            section="certificates"
            data={editingData}
            onChange={(d) => setEditingData(d)}
          />
        ) : profile.certificates.length === 0 ? (
          <p className="text-sm text-content-muted italic">No certificates added.</p>
        ) : (
          <div className="space-y-2 text-xs">
            {profile.certificates.map((cert) => (
              <div key={cert.id} className="flex justify-between items-center border border-edge bg-surface-subtle p-2.5 rounded-[var(--radius-lg)]">
                <div>
                  <h4 className="font-semibold text-content text-sm">{cert.name}</h4>
                  <p className="text-[10px] text-content-muted">{cert.issuer} {cert.date ? `· ${cert.date}` : ''}</p>
                </div>
                {cert.url && (
                  <a href={cert.url} target="_blank" rel="noreferrer" className="text-brand hover:underline font-medium text-xs">
                    View
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </CardSection>

      {/* Action overlay footer inside active editing cards */}
      {editingSection && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 p-3 bg-card border border-edge rounded-[var(--radius-xl)] shadow-2xl glass animate-fade-in">
          <span className="text-xs text-content-muted mr-1">Editing {editingSection}</span>
          <button
            onClick={handleSave}
            className="h-8 px-4 bg-brand text-brand-fg text-xs font-semibold rounded-[var(--radius-lg)] shadow hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer"
          >
            <FloppyDisk size={14} /> Save
          </button>
          <button
            onClick={handleCancel}
            className="h-8 px-4 border border-edge text-xs text-content hover:bg-surface-subtle rounded-[var(--radius-lg)] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <X size={14} /> Cancel
          </button>
        </div>
      )}
    </div>
  )
}

function CardSection({
  title,
  icon: Icon,
  isActive,
  onEdit,
  children,
}: {
  title: string
  icon: React.ElementType
  isActive: boolean
  onEdit: () => void
  children: React.ReactNode
}) {
  return (
    <div className={`glass p-5 rounded-[var(--radius-xl)] border transition-all duration-200 ${isActive ? 'border-brand ring-1 ring-brand bg-card shadow-lg' : 'border-edge hover:border-brand/40'}`}>
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-brand/10 text-brand rounded-[var(--radius-md)]">
            <Icon size={18} weight="bold" />
          </div>
          <h3 className="font-display text-sm font-semibold text-content">{title}</h3>
        </div>
        {!isActive && (
          <button
            onClick={onEdit}
            className="p-1.5 border border-edge rounded-[var(--radius-md)] text-content-muted hover:text-brand hover:border-brand/40 hover:bg-surface-subtle transition-all cursor-pointer"
            title={`Edit ${title}`}
          >
            <PencilSimple size={14} />
          </button>
        )}
      </div>
      {children}
    </div>
  )
}
