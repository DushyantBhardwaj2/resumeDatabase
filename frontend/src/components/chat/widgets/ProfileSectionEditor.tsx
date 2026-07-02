'use client'

import { useState, useCallback } from 'react'
import { api } from '@/config/api-client'
import {
  Plus, Trash, Sparkle, X,
} from '@phosphor-icons/react'
import type { Profile, SectionName, VaultBullet } from '@resumint/shared'

function genIdFn(): string {
  return crypto.randomUUID()
}

function emptyBullet(): VaultBullet {
  return { id: genIdFn(), text: '', keywords: [], isAIGenerated: false }
}

// ── Reusable tag input ────────────────────────────────────────────

function TagInput({
  tags, onChange, placeholder,
}: {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder: string
}) {
  const [input, setInput] = useState('')
  const add = () => {
    const val = input.trim()
    if (val && !tags.includes(val)) {
      onChange([...tags, val])
    }
    setInput('')
  }
  return (
    <div>
      <div className="flex flex-wrap gap-1.5 mb-1.5">
        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 bg-muted-bg border border-edge rounded-full px-2 py-0.5 text-xs text-content"
          >
            {t}
            <button
              onClick={() => onChange(tags.filter((x) => x !== t))}
              className="text-content-subtle hover:text-content transition-colors"
            >
              <X size={10} weight="bold" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-1">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder={placeholder}
          className="flex-1 h-7 bg-muted-bg border border-edge rounded-[var(--radius-sm)] px-2 text-sm text-content placeholder:text-content-subtle outline-none focus:border-brand transition-colors"
        />
        <button
          onClick={add}
          className="h-7 px-2 bg-muted-bg border border-edge rounded-[var(--radius-sm)] text-xs text-content hover:bg-surface transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  )
}

// ── Vault bullet editor ──────────────────────────────────────────

function VaultBulletEditor({
  bullets, onChange,
}: {
  bullets: VaultBullet[]
  onChange: (bullets: VaultBullet[]) => void
}) {
  const update = (idx: number, patch: Partial<VaultBullet>) => {
    onChange(bullets.map((b, i) => (i === idx ? { ...b, ...patch } : b)))
  }
  const add = () => onChange([...bullets, emptyBullet()])
  const remove = (idx: number) => onChange(bullets.filter((_, i) => i !== idx))

  const handleGenerateVault = useCallback(async (idx: number) => {
    const bullet = bullets[idx]
    if (!bullet.text.trim()) return
    try {
      const res = await api.api.protected.ai['expand-vault'].$post({
        json: { content: bullet.text, count: 8 }
      })
      if (!res.ok) return
      const data = await res.json()
      if (Array.isArray(data)) {
        const newBullets: VaultBullet[] = data.map((b: string | { text: string }) => ({
          id: genIdFn(),
          text: typeof b === 'string' ? b : b.text,
          keywords: [],
          isAIGenerated: true,
        }))
        onChange([...bullets.slice(0, idx + 1), ...newBullets, ...bullets.slice(idx + 1)])
      }
    } catch { /* ignore */ }
  }, [bullets, onChange])

  return (
    <div className="space-y-1.5">
      <p className="text-xs text-content-muted">Bullets</p>
      {bullets.map((b, idx) => (
        <div key={b.id} className="flex flex-col gap-1 p-2 bg-muted-bg/50 border border-edge rounded-[var(--radius-sm)]">
          <div className="flex items-start gap-1.5">
            <span className="text-content-subtle text-xs mt-1.5">•</span>
            <div className="flex-1 space-y-1">
              <textarea
                value={b.text}
                onChange={(e) => update(idx, { text: e.target.value })}
                rows={2}
                className="w-full bg-transparent border-0 text-sm text-content resize-none outline-none placeholder:text-content-subtle"
                placeholder="Write a bullet point..."
              />
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={b.category || 'GENERAL'}
                  onChange={(e) => update(idx, { category: e.target.value as VaultBullet['category'] })}
                  className="h-6 text-xs bg-muted-bg border border-edge rounded-[var(--radius-sm)] px-1.5 text-content-muted outline-none"
                >
                  <option value="GENERAL">General</option>
                  <option value="FRONTEND">Frontend</option>
                  <option value="BACKEND">Backend</option>
                  <option value="DEVOPS">DevOps</option>
                  <option value="LEADERSHIP">Leadership</option>
                </select>
                <button
                  onClick={() => handleGenerateVault(idx)}
                  className="inline-flex items-center gap-1 text-xs text-brand hover:text-brand-hover transition-colors"
                >
                  <Sparkle size={10} />
                  Expand
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {b.keywords.map((kw) => (
                  <span key={kw} className="inline-flex items-center gap-0.5 bg-brand/10 text-brand text-[10px] px-1.5 py-0.5 rounded-full">
                    {kw}
                    <button
                      onClick={() => update(idx, { keywords: b.keywords.filter((k) => k !== kw) })}
                      className="hover:text-brand-hover"
                    >
                      <X size={8} weight="bold" />
                    </button>
                  </span>
                ))}
              </div>
              <input
                value={b.keywords.join(', ')}
                onChange={(e) => update(idx, { keywords: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                placeholder="Keywords (comma-separated)"
                className="w-full h-6 bg-transparent border-0 text-xs text-content-subtle outline-none placeholder:text-content-subtle/50"
              />
            </div>
            <button
              onClick={() => remove(idx)}
              className="text-content-subtle hover:text-red-500 transition-colors shrink-0 mt-1"
            >
              <Trash size={11} />
            </button>
          </div>
        </div>
      ))}
      <button
        onClick={add}
        className="flex items-center gap-1 text-xs text-content-muted hover:text-brand transition-colors"
      >
        <Plus size={10} /> Add bullet
      </button>
    </div>
  )
}

// ── Contact Editor ───────────────────────────────────────────────

function ContactEditor({ data, onChange }: { data: Profile; onChange: (d: Profile) => void }) {
  const c = data.contact
  const set = (field: string, val: string) =>
    onChange({ ...data, contact: { ...c, [field]: val } })
  return (
    <div className="space-y-2.5">
      {[
        { label: 'Full Name', field: 'name', placeholder: 'Your name' },
        { label: 'Email', field: 'email', placeholder: 'you@example.com' },
        { label: 'Phone', field: 'phone', placeholder: '+91 98765 43210' },
        { label: 'LinkedIn', field: 'linkedin', placeholder: 'linkedin.com/in/you' },
        { label: 'GitHub', field: 'github', placeholder: 'github.com/you' },
        { label: 'LeetCode', field: 'leetcode', placeholder: 'leetcode.com/u/you' },
        { label: 'Portfolio', field: 'portfolio', placeholder: 'yoursite.dev' },
      ].map(({ label, field, placeholder }) => (
        <div key={field}>
          <label className="text-xs text-content-muted mb-1 block">{label}</label>
          <input
            value={(c as Record<string, string>)[field] || ''}
            onChange={(e) => set(field, e.target.value)}
            placeholder={placeholder}
            className="w-full h-8 bg-muted-bg border border-edge rounded-[var(--radius-md)] px-2.5 text-sm text-content placeholder:text-content-subtle outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-colors"
          />
        </div>
      ))}
    </div>
  )
}

// ── Education Editor ─────────────────────────────────────────────

function EducationEditor({ data, onChange }: { data: Profile; onChange: (d: Profile) => void }) {
  const items = data.education
  const setItems = (items: Profile['education']) => onChange({ ...data, education: items })
  const updateItem = (idx: number, patch: Partial<Profile['education'][0]>) =>
    setItems(items.map((e, i) => (i === idx ? { ...e, ...patch } : e)))
  const addItem = () =>
    setItems([...items, { school: '', degree: '', gpa: null, startYear: null, endYear: null }])
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx))

  if (items.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-content-muted">No education entries yet.</p>
        <button onClick={addItem}
          className="w-full h-8 border border-dashed border-edge rounded-[var(--radius-md)] text-sm text-content-muted hover:text-brand hover:border-brand/40 transition-colors flex items-center justify-center gap-1">
          <Plus size={12} /> Add Education
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((edu, idx) => (
        <div key={idx} className="border border-edge rounded-[var(--radius-md)] p-3 bg-surface space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label className="text-xs text-content-muted block">School / University</label>
              <input value={edu.school} onChange={(e) => updateItem(idx, { school: e.target.value })}
                className="w-full h-7 bg-muted-bg border border-edge rounded-[var(--radius-sm)] px-2 text-sm text-content outline-none focus:border-brand" />
            </div>
            <div>
              <label className="text-xs text-content-muted block">Degree</label>
              <input value={edu.degree} onChange={(e) => updateItem(idx, { degree: e.target.value })}
                className="w-full h-7 bg-muted-bg border border-edge rounded-[var(--radius-sm)] px-2 text-sm text-content outline-none focus:border-brand" />
            </div>
            <div>
              <label className="text-xs text-content-muted block">GPA</label>
              <input value={edu.gpa ?? ''} onChange={(e) => updateItem(idx, { gpa: e.target.value || null })}
                className="w-full h-7 bg-muted-bg border border-edge rounded-[var(--radius-sm)] px-2 text-sm text-content outline-none focus:border-brand" placeholder="8.5" />
            </div>
            <div>
              <label className="text-xs text-content-muted block">Start Year</label>
              <input value={edu.startYear ?? ''} onChange={(e) => updateItem(idx, { startYear: e.target.value ? Number(e.target.value) : null })}
                className="w-full h-7 bg-muted-bg border border-edge rounded-[var(--radius-sm)] px-2 text-sm text-content outline-none focus:border-brand" placeholder="2020" />
            </div>
            <div>
              <label className="text-xs text-content-muted block">End Year</label>
              <input value={edu.endYear ?? ''} onChange={(e) => updateItem(idx, { endYear: e.target.value ? Number(e.target.value) : null })}
                className="w-full h-7 bg-muted-bg border border-edge rounded-[var(--radius-sm)] px-2 text-sm text-content outline-none focus:border-brand" placeholder="2024" />
            </div>
          </div>
          <button onClick={() => removeItem(idx)}
            className="text-xs text-content-muted hover:text-red-500 transition-colors flex items-center gap-1">
            <Trash size={10} /> Remove
          </button>
        </div>
      ))}
      <button onClick={addItem}
        className="w-full h-8 border border-dashed border-edge rounded-[var(--radius-md)] text-sm text-content-muted hover:text-brand hover:border-brand/40 transition-colors flex items-center justify-center gap-1">
        <Plus size={12} /> Add Education
      </button>
    </div>
  )
}

// ── Experience Editor ────────────────────────────────────────────

function ExperienceEditor({ data, onChange }: { data: Profile; onChange: (d: Profile) => void }) {
  const items = data.experience
  const setItems = (items: Profile['experience']) => onChange({ ...data, experience: items })
  const updateItem = (idx: number, patch: Partial<Profile['experience'][0]>) =>
    setItems(items.map((e, i) => (i === idx ? { ...e, ...patch } : e)))
  const addItem = () =>
    setItems([...items, { id: genIdFn(), company: '', role: '', startDate: null, endDate: null, current: false, vaultBullets: [] }])
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx))

  if (items.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-content-muted">No experience entries yet.</p>
        <button onClick={addItem}
          className="w-full h-8 border border-dashed border-edge rounded-[var(--radius-md)] text-sm text-content-muted hover:text-brand hover:border-brand/40 transition-colors flex items-center justify-center gap-1">
          <Plus size={12} /> Add Experience
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((exp, idx) => (
        <div key={exp.id} className="border border-edge rounded-[var(--radius-md)] p-3 bg-surface space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-content-muted block">Company</label>
              <input value={exp.company} onChange={(e) => updateItem(idx, { company: e.target.value })}
                className="w-full h-7 bg-muted-bg border border-edge rounded-[var(--radius-sm)] px-2 text-sm text-content outline-none focus:border-brand" />
            </div>
            <div>
              <label className="text-xs text-content-muted block">Role</label>
              <input value={exp.role} onChange={(e) => updateItem(idx, { role: e.target.value })}
                className="w-full h-7 bg-muted-bg border border-edge rounded-[var(--radius-sm)] px-2 text-sm text-content outline-none focus:border-brand" />
            </div>
            <div>
              <label className="text-xs text-content-muted block">Start</label>
              <input value={exp.startDate ?? ''} onChange={(e) => updateItem(idx, { startDate: e.target.value || null })}
                className="w-full h-7 bg-muted-bg border border-edge rounded-[var(--radius-sm)] px-2 text-sm text-content outline-none focus:border-brand" placeholder="Jun 2024" />
            </div>
            <div>
              <label className="text-xs text-content-muted block">End</label>
              <div className="flex items-center gap-2">
                <input value={exp.endDate ?? ''} onChange={(e) => updateItem(idx, { endDate: e.target.value || null })} disabled={exp.current}
                  className="flex-1 h-7 bg-muted-bg border border-edge rounded-[var(--radius-sm)] px-2 text-sm text-content outline-none focus:border-brand disabled:opacity-40" placeholder="Aug 2024" />
                <label className="flex items-center gap-1 text-xs text-content-muted cursor-pointer shrink-0">
                  <input type="checkbox" checked={exp.current} onChange={(e) => updateItem(idx, { current: e.target.checked })}
                    className="accent-brand w-3 h-3" />
                  Current
                </label>
              </div>
            </div>
          </div>
          <VaultBulletEditor
            bullets={exp.vaultBullets}
            onChange={(bullets) => updateItem(idx, { vaultBullets: bullets })}
          />
          <button onClick={() => removeItem(idx)}
            className="text-xs text-content-muted hover:text-red-500 transition-colors flex items-center gap-1">
            <Trash size={10} /> Remove
          </button>
        </div>
      ))}
      <button onClick={addItem}
        className="w-full h-8 border border-dashed border-edge rounded-[var(--radius-md)] text-sm text-content-muted hover:text-brand hover:border-brand/40 transition-colors flex items-center justify-center gap-1">
        <Plus size={12} /> Add Experience
      </button>
    </div>
  )
}

// ── Projects Editor ──────────────────────────────────────────────

function ProjectsEditor({ data, onChange }: { data: Profile; onChange: (d: Profile) => void }) {
  const items = data.projects
  const setItems = (items: Profile['projects']) => onChange({ ...data, projects: items })
  const updateItem = (idx: number, patch: Partial<Profile['projects'][0]>) =>
    setItems(items.map((p, i) => (i === idx ? { ...p, ...patch } : p)))
  const addItem = () =>
    setItems([...items, { id: genIdFn(), title: '', url: null, techStack: [], vaultBullets: [] }])
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx))

  if (items.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-content-muted">No projects yet.</p>
        <button onClick={addItem}
          className="w-full h-8 border border-dashed border-edge rounded-[var(--radius-md)] text-sm text-content-muted hover:text-brand hover:border-brand/40 transition-colors flex items-center justify-center gap-1">
          <Plus size={12} /> Add Project
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((proj, idx) => (
        <div key={proj.id} className="border border-edge rounded-[var(--radius-md)] p-3 bg-surface space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label className="text-xs text-content-muted block">Title</label>
              <input value={proj.title} onChange={(e) => updateItem(idx, { title: e.target.value })}
                className="w-full h-7 bg-muted-bg border border-edge rounded-[var(--radius-sm)] px-2 text-sm text-content outline-none focus:border-brand" />
            </div>
            <div>
              <label className="text-xs text-content-muted block">URL</label>
              <input value={proj.url ?? ''} onChange={(e) => updateItem(idx, { url: e.target.value || null })}
                className="w-full h-7 bg-muted-bg border border-edge rounded-[var(--radius-sm)] px-2 text-sm text-content outline-none focus:border-brand" placeholder="github.com/you/proj" />
            </div>
          </div>
          <div>
            <label className="text-xs text-content-muted block">Tech Stack</label>
            <TagInput
              tags={proj.techStack}
              onChange={(tags) => updateItem(idx, { techStack: tags })}
              placeholder="Add technology..."
            />
          </div>
          <VaultBulletEditor
            bullets={proj.vaultBullets}
            onChange={(bullets) => updateItem(idx, { vaultBullets: bullets })}
          />
          <button onClick={() => removeItem(idx)}
            className="text-xs text-content-muted hover:text-red-500 transition-colors flex items-center gap-1">
            <Trash size={10} /> Remove
          </button>
        </div>
      ))}
      <button onClick={addItem}
        className="w-full h-8 border border-dashed border-edge rounded-[var(--radius-md)] text-sm text-content-muted hover:text-brand hover:border-brand/40 transition-colors flex items-center justify-center gap-1">
        <Plus size={12} /> Add Project
      </button>
    </div>
  )
}

// ── Skills Editor ────────────────────────────────────────────────

function SkillsEditor({ data, onChange }: { data: Profile; onChange: (d: Profile) => void }) {
  const s = data.skills
  const setSkills = (patch: Partial<typeof s>) => onChange({ ...data, skills: { ...s, ...patch } })
  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-medium text-content-muted mb-1">Languages</p>
        <TagInput
          tags={s.languages}
          onChange={(tags) => setSkills({ languages: tags })}
          placeholder="Add language..."
        />
      </div>
      <div>
        <p className="text-xs font-medium text-content-muted mb-1">Frameworks</p>
        <TagInput
          tags={s.frameworks}
          onChange={(tags) => setSkills({ frameworks: tags })}
          placeholder="Add framework..."
        />
      </div>
      <div>
        <p className="text-xs font-medium text-content-muted mb-1">Tools</p>
        <TagInput
          tags={s.tools}
          onChange={(tags) => setSkills({ tools: tags })}
          placeholder="Add tool..."
        />
      </div>
    </div>
  )
}

// ── Certificates Editor ──────────────────────────────────────────

function CertificatesEditor({ data, onChange }: { data: Profile; onChange: (d: Profile) => void }) {
  const items = data.certificates
  const setItems = (items: Profile['certificates']) => onChange({ ...data, certificates: items })
  const updateItem = (idx: number, patch: Partial<Profile['certificates'][0]>) =>
    setItems(items.map((c, i) => (i === idx ? { ...c, ...patch } : c)))
  const addItem = () =>
    setItems([...items, { id: genIdFn(), name: '', issuer: '', url: '', date: '' }])
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx))

  if (items.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-content-muted">No certificates yet.</p>
        <button onClick={addItem}
          className="w-full h-8 border border-dashed border-edge rounded-[var(--radius-md)] text-sm text-content-muted hover:text-brand hover:border-brand/40 transition-colors flex items-center justify-center gap-1">
          <Plus size={12} /> Add Certificate
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((cert, idx) => (
        <div key={cert.id} className="border border-edge rounded-[var(--radius-md)] p-3 bg-surface space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label className="text-xs text-content-muted block">Name</label>
              <input value={cert.name} onChange={(e) => updateItem(idx, { name: e.target.value })}
                className="w-full h-7 bg-muted-bg border border-edge rounded-[var(--radius-sm)] px-2 text-sm text-content outline-none focus:border-brand" placeholder="AWS Solutions Architect" />
            </div>
            <div>
              <label className="text-xs text-content-muted block">Issuer</label>
              <input value={cert.issuer} onChange={(e) => updateItem(idx, { issuer: e.target.value })}
                className="w-full h-7 bg-muted-bg border border-edge rounded-[var(--radius-sm)] px-2 text-sm text-content outline-none focus:border-brand" placeholder="Amazon Web Services" />
            </div>
            <div>
              <label className="text-xs text-content-muted block">Date</label>
              <input value={cert.date || ''} onChange={(e) => updateItem(idx, { date: e.target.value })}
                className="w-full h-7 bg-muted-bg border border-edge rounded-[var(--radius-sm)] px-2 text-sm text-content outline-none focus:border-brand" placeholder="Jun 2025" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-content-muted block">URL</label>
              <input value={cert.url} onChange={(e) => updateItem(idx, { url: e.target.value })}
                className="w-full h-7 bg-muted-bg border border-edge rounded-[var(--radius-sm)] px-2 text-sm text-content outline-none focus:border-brand" placeholder="credential URL" />
            </div>
          </div>
          <button onClick={() => removeItem(idx)}
            className="text-xs text-content-muted hover:text-red-500 transition-colors flex items-center gap-1">
            <Trash size={10} /> Remove
          </button>
        </div>
      ))}
      <button onClick={addItem}
        className="w-full h-8 border border-dashed border-edge rounded-[var(--radius-md)] text-sm text-content-muted hover:text-brand hover:border-brand/40 transition-colors flex items-center justify-center gap-1">
        <Plus size={12} /> Add Certificate
      </button>
    </div>
  )
}

// ── Main export ──────────────────────────────────────────────────

interface ProfileSectionEditorProps {
  section: SectionName
  data: Profile
  onChange: (updated: Profile) => void
}

export function ProfileSectionEditor({ section, data, onChange }: ProfileSectionEditorProps) {
  switch (section) {
    case 'contact':
      return <ContactEditor data={data} onChange={onChange} />
    case 'education':
      return <EducationEditor data={data} onChange={onChange} />
    case 'experience':
      return <ExperienceEditor data={data} onChange={onChange} />
    case 'projects':
      return <ProjectsEditor data={data} onChange={onChange} />
    case 'skills':
      return <SkillsEditor data={data} onChange={onChange} />
    case 'certificates':
      return <CertificatesEditor data={data} onChange={onChange} />
    default:
      return null
  }
}
