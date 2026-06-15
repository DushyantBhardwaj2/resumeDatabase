"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"
import { computeCompleteness, completenessBg, completenessColor, completenessHint } from "@/lib/profile-utils"

type Contact = { phone: string | null; linkedin: string | null; github: string | null; portfolio: string | null }

type Education = { school: string; degree: string; gpa: string | null; startYear: number | null; endYear: number | null }

type Experience = { company: string; role: string; startDate: string | null; endDate: string | null; bullets: string[] }

type Project = { title: string; techStack: string[]; bullets: string[]; url: string | null }

type Skills = { languages: string[]; frameworks: string[]; tools: string[] }

type Profile = {
  contact: Contact
  education: Education[]
  experience: Experience[]
  projects: Project[]
  skills: Skills
  githubUsername: string | null
}

const emptyContact: Contact = { phone: "", linkedin: "", github: "", portfolio: "" }

const tabs = ["contact", "education", "experience", "projects", "skills", "integrations"] as const
type Tab = (typeof tabs)[number]

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>("contact")
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => {
        if (r.status === 404) {
          router.push("/onboarding")
          return null
        }
        return r.json()
      })
      .then((data) => {
        if (data) {
          setProfile({
            contact: data.contact ?? emptyContact,
            education: data.education ?? [],
            experience: data.experience ?? [],
            projects: data.projects ?? [],
            skills: data.skills ?? { languages: [], frameworks: [], tools: [] },
            githubUsername: data.githubUsername ?? null,
          })
        }
      })
      .catch(() => toast.error("Failed to load profile"))
      .finally(() => setLoading(false))
  }, [router])

  const updateNested = useCallback(<K extends keyof Profile>(section: K, value: Profile[K]) => {
    setProfile((prev) => (prev ? { ...prev, [section]: value } : prev))
    setDirty(true)
  }, [])

  const handleSave = useCallback(async () => {
    if (!profile) return
    setSaving(true)
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      })
      if (!res.ok) throw new Error("Failed to save")
      toast.success("Profile saved successfully")
      setDirty(false)
    } catch {
      toast.error("Failed to save profile")
    } finally {
      setSaving(false)
    }
  }, [profile])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="h-6 w-6 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    )
  }

  if (!profile) return null

  const completeness = computeCompleteness(profile)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>
        <button
          onClick={handleSave}
          disabled={saving || !dirty}
          className="inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {dirty && (
        <p className="text-xs text-amber-600">You have unsaved changes</p>
      )}

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-medium">Profile Completeness</span>
          <span className={completenessColor(completeness)}>{completeness}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className={`h-full rounded-full transition-all ${completenessBg(completeness)}`} style={{ width: `${completeness}%` }} />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{completenessHint(completeness)}</p>
      </div>

      <div className="flex gap-1 rounded-xl bg-muted p-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        {activeTab === "contact" && (
          <ContactEditor
            data={profile.contact}
            onChange={(v) => updateNested("contact", v)}
          />
        )}
        {activeTab === "education" && (
          <EducationEditor
            data={profile.education}
            onChange={(v) => updateNested("education", v)}
          />
        )}
        {activeTab === "experience" && (
          <ExperienceEditor
            data={profile.experience}
            onChange={(v) => updateNested("experience", v)}
          />
        )}
        {activeTab === "projects" && (
          <ProjectsEditor
            data={profile.projects}
            onChange={(v) => updateNested("projects", v)}
          />
        )}
        {activeTab === "skills" && (
          <SkillsEditor
            data={profile.skills}
            onChange={(v) => updateNested("skills", v)}
          />
        )}
        {activeTab === "integrations" && (
          <IntegrationsEditor
            githubUsername={profile.githubUsername}
            onGithubUsernameChange={(v) => updateNested("githubUsername", v)}
          />
        )}
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder }: {
  label: string
  value: string | null
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      <input
        type="text"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
      />
    </div>
  )
}

function ContactEditor({ data, onChange }: { data: Contact; onChange: (d: Contact) => void }) {
  const set = (key: keyof Contact) => (val: string) => onChange({ ...data, [key]: val || null })
  return (
    <SectionCard title="Contact Information">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Phone" value={data.phone} onChange={set("phone")} placeholder="+91-XXXXXXXXXX" />
        <Field label="LinkedIn URL" value={data.linkedin} onChange={set("linkedin")} placeholder="https://linkedin.com/in/..." />
        <Field label="GitHub URL" value={data.github} onChange={set("github")} placeholder="https://github.com/..." />
        <Field label="Portfolio URL" value={data.portfolio} onChange={set("portfolio")} placeholder="https://..." />
      </div>
    </SectionCard>
  )
}

function EducationEditor({ data, onChange }: { data: Education[]; onChange: (d: Education[]) => void }) {
  const add = () => onChange([...data, { school: "", degree: "", gpa: null, startYear: null, endYear: null }])
  const remove = (i: number) => onChange(data.filter((_, idx) => idx !== i))
  const update = (i: number, field: keyof Education, value: string | number | null) => {
    const next = data.map((item, idx) => (idx === i ? { ...item, [field]: value } : item))
    onChange(next)
  }

  return (
    <SectionCard title={`Education (${data.length})`}>
      <div className="space-y-4">
        {data.map((item, i) => (
          <div key={i} className="relative rounded-lg border border-border p-4">
            <button onClick={() => remove(i)} className="absolute right-3 top-3 text-muted-foreground hover:text-error">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="School" value={item.school} onChange={(v) => update(i, "school", v)} />
              <Field label="Degree" value={item.degree} onChange={(v) => update(i, "degree", v)} />
              <Field label="GPA" value={item.gpa} onChange={(v) => update(i, "gpa", v || null)} />
              <div className="flex gap-2">
                <Field label="Start Year" value={item.startYear?.toString() ?? null} onChange={(v) => update(i, "startYear", v ? Number(v) : null)} />
                <Field label="End Year" value={item.endYear?.toString() ?? null} onChange={(v) => update(i, "endYear", v ? Number(v) : null)} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <button onClick={add} className="mt-4 flex items-center gap-2 text-sm font-medium text-primary hover:underline">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Add Education
      </button>
    </SectionCard>
  )
}

function ExperienceEditor({ data, onChange }: { data: Experience[]; onChange: (d: Experience[]) => void }) {
  const add = () => onChange([...data, { company: "", role: "", startDate: null, endDate: null, bullets: [""] }])
  const remove = (i: number) => onChange(data.filter((_, idx) => idx !== i))
  const update = (i: number, field: keyof Experience, value: string | string[] | null) => {
    const next = data.map((item, idx) => (idx === i ? { ...item, [field]: value } : item))
    onChange(next)
  }

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    e.dataTransfer.setData("text/plain", String(idx))
    e.currentTarget.classList.add("opacity-50")
  }
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.add("border-primary")
  }
  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("border-primary")
  }
  const handleDrop = (e: React.DragEvent, toIdx: number) => {
    e.preventDefault()
    e.currentTarget.classList.remove("border-primary")
    const fromIdx = Number(e.dataTransfer.getData("text/plain"))
    if (fromIdx === toIdx) return
    const next = [...data]
    const [moved] = next.splice(fromIdx, 1)
    next.splice(toIdx, 0, moved)
    onChange(next)
  }
  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("opacity-50")
  }

  return (
    <SectionCard title={`Experience (${data.length})`}>
      <div className="space-y-4">
        {data.map((item, i) => (
          <div
            key={i}
            draggable
            onDragStart={(e) => handleDragStart(e, i)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, i)}
            onDragEnd={handleDragEnd}
            className="relative cursor-grab rounded-lg border border-border p-4 transition-colors active:cursor-grabbing"
          >
            <div className="absolute right-3 top-3 flex gap-1">
              <span className="cursor-grab text-muted-foreground">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm8 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4ZM8 14a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm8 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4ZM8 22a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm8 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" />
                </svg>
              </span>
              <button onClick={() => remove(i)} className="text-muted-foreground hover:text-error">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Company" value={item.company} onChange={(v) => update(i, "company", v)} />
              <Field label="Role" value={item.role} onChange={(v) => update(i, "role", v)} />
              <Field label="Start Date" value={item.startDate} onChange={(v) => update(i, "startDate", v || null)} />
              <Field label="End Date" value={item.endDate} onChange={(v) => update(i, "endDate", v || null)} />
            </div>
            <div className="mt-3">
              <label className="mb-1 block text-sm font-medium text-muted-foreground">Bullet Points</label>
              <BulletList
                items={item.bullets}
                onChange={(bullets) => update(i, "bullets", bullets)}
              />
            </div>
          </div>
        ))}
      </div>
      <button onClick={add} className="mt-4 flex items-center gap-2 text-sm font-medium text-primary hover:underline">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Add Experience
      </button>
    </SectionCard>
  )
}

function ProjectsEditor({ data, onChange }: { data: Project[]; onChange: (d: Project[]) => void }) {
  const add = () => onChange([...data, { title: "", techStack: [], bullets: [""], url: null }])
  const remove = (i: number) => onChange(data.filter((_, idx) => idx !== i))
  const update = (i: number, field: keyof Project, value: string | string[] | null) => {
    const next = data.map((item, idx) => (idx === i ? { ...item, [field]: value } : item))
    onChange(next)
  }

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    e.dataTransfer.setData("text/plain", String(idx))
    e.currentTarget.classList.add("opacity-50")
  }
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.currentTarget.classList.add("border-primary")
  }
  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("border-primary")
  }
  const handleDrop = (e: React.DragEvent, toIdx: number) => {
    e.preventDefault()
    e.currentTarget.classList.remove("border-primary")
    const fromIdx = Number(e.dataTransfer.getData("text/plain"))
    if (fromIdx === toIdx) return
    const next = [...data]
    const [moved] = next.splice(fromIdx, 1)
    next.splice(toIdx, 0, moved)
    onChange(next)
  }
  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove("opacity-50")
  }

  return (
    <SectionCard title={`Projects (${data.length})`}>
      <div className="space-y-4">
        {data.map((item, i) => (
          <div
            key={i}
            draggable
            onDragStart={(e) => handleDragStart(e, i)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, i)}
            onDragEnd={handleDragEnd}
            className="relative cursor-grab rounded-lg border border-border p-4 transition-colors active:cursor-grabbing"
          >
            <div className="absolute right-3 top-3 flex gap-1">
              <span className="cursor-grab text-muted-foreground">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm8 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4ZM8 14a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm8 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4ZM8 22a2 2 0 1 1 0-4 2 2 0 0 1 0 4Zm8 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" />
                </svg>
              </span>
              <button onClick={() => remove(i)} className="text-muted-foreground hover:text-error">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Title" value={item.title} onChange={(v) => update(i, "title", v)} />
              <Field label="URL" value={item.url} onChange={(v) => update(i, "url", v || null)} />
            </div>
            <div className="mt-3">
              <label className="mb-1 block text-sm font-medium text-muted-foreground">Tech Stack (comma-separated)</label>
              <input
                type="text"
                value={item.techStack.join(", ")}
                onChange={(e) => update(i, "techStack", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
                placeholder="React, Node.js, PostgreSQL"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
              />
            </div>
            <div className="mt-3">
              <label className="mb-1 block text-sm font-medium text-muted-foreground">Bullet Points</label>
              <BulletList
                items={item.bullets}
                onChange={(bullets) => update(i, "bullets", bullets)}
              />
            </div>
          </div>
        ))}
      </div>
      <button onClick={add} className="mt-4 flex items-center gap-2 text-sm font-medium text-primary hover:underline">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Add Project
      </button>
    </SectionCard>
  )
}

function SkillsEditor({ data, onChange }: { data: Skills; onChange: (d: Skills) => void }) {
  const addSkill = (category: keyof Skills) => {
    const val = prompt(`Add ${category} skill:`)
    if (val?.trim()) {
      onChange({ ...data, [category]: [...data[category], val.trim()] })
    }
  }
  const removeSkill = (category: keyof Skills, idx: number) => {
    onChange({ ...data, [category]: data[category].filter((_, i) => i !== idx) })
  }

  return (
    <SectionCard title="Skills">
      <div className="space-y-6">
        {(Object.keys(data) as (keyof Skills)[]).map((category) => (
          <div key={category}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-medium capitalize text-muted-foreground">{category}</h3>
              <button
                onClick={() => addSkill(category)}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {data[category].length === 0 && (
                <span className="text-sm text-muted-foreground">No skills added yet</span>
              )}
              {data[category].map((skill, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
                >
                  {skill}
                  <button onClick={() => removeSkill(category, i)} className="hover:text-error">
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

function BulletList({ items, onChange }: { items: string[]; onChange: (items: string[]) => void }) {
  const add = () => onChange([...items, ""])
  const update = (i: number, val: string) => {
    const next = items.map((item, idx) => (idx === i ? val : item))
    onChange(next)
  }
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i))

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <span className="mt-2.5 text-muted-foreground">•</span>
          <input
            type="text"
            value={item}
            onChange={(e) => update(i, e.target.value)}
            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
            placeholder="Describe your accomplishment..."
          />
          <button onClick={() => remove(i)} className="mt-2 text-muted-foreground hover:text-error">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
      <button onClick={add} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        Add bullet
      </button>
    </div>
  )
}

type GitHubRepo = {
  name: string
  description: string | null
  url: string
  language: string | null
  stars: number
}

function IntegrationsEditor({
  githubUsername,
  onGithubUsernameChange,
}: {
  githubUsername: string | null
  onGithubUsernameChange: (v: string | null) => void
}) {
  const [username, setUsername] = useState(githubUsername ?? "")
  const [repos, setRepos] = useState<GitHubRepo[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [importing, setImporting] = useState(false)

  const handleConnect = useCallback(async () => {
    if (!username.trim()) return
    setLoading(true)
    setRepos([])
    onGithubUsernameChange(username.trim())
    try {
      const res = await fetch(`/api/integrations/github/repos?username=${encodeURIComponent(username.trim())}`)
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || "Failed to fetch repos")
        return
      }
      const data = await res.json()
      setRepos(data.repos)
    } catch {
      toast.error("Failed to connect to GitHub")
    } finally {
      setLoading(false)
    }
  }, [username, onGithubUsernameChange])

  const handleReSync = useCallback(async () => {
    if (!username.trim()) return
    setFetching(true)
    try {
      const res = await fetch(`/api/integrations/github/repos?username=${encodeURIComponent(username.trim())}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setRepos(data.repos)
      toast.success("Repos refreshed")
    } catch {
      toast.error("Failed to refresh repos")
    } finally {
      setFetching(false)
    }
  }, [username])

  const toggleRepo = (url: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(url)) next.delete(url)
      else next.add(url)
      return next
    })
  }

  const handleImport = useCallback(async () => {
    if (selected.size === 0) {
      toast.error("Select at least one repo to import")
      return
    }
    setImporting(true)
    try {
      const selectedRepos = repos.filter((r) => selected.has(r.url))
      const res = await fetch("/api/profile/projects/github-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repos: selectedRepos.map((r) => ({ name: r.name, url: r.url, language: r.language })),
        }),
      })
      if (!res.ok) throw new Error()
      toast.success(`Imported ${selected.size} repo(s) successfully`)
      setSelected(new Set())
    } catch {
      toast.error("Failed to import repos")
    } finally {
      setImporting(false)
    }
  }, [selected, repos])

  return (
    <SectionCard title="Integrations">
      <div className="space-y-6">
        <div className="rounded-lg border border-border p-4">
          <h3 className="mb-3 text-sm font-semibold">GitHub</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your GitHub username"
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
            />
            <button
              onClick={handleConnect}
              disabled={loading || !username.trim()}
              className="inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
            >
              {loading ? "Fetching..." : "Connect"}
            </button>
          </div>
          {githubUsername && (
            <p className="mt-2 text-xs text-muted-foreground">
              Connected as <span className="font-medium text-foreground">{githubUsername}</span>
            </p>
          )}
        </div>

        {repos.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">
                Repositories ({repos.length})
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={handleReSync}
                  disabled={fetching}
                  className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  <svg className={`h-3.5 w-3.5 ${fetching ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                  </svg>
                  {fetching ? "Refreshing..." : "Re-sync"}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {repos.map((repo) => (
                <div
                  key={repo.url}
                  onClick={() => toggleRepo(repo.url)}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors ${
                    selected.has(repo.url)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(repo.url)}
                    onChange={() => toggleRepo(repo.url)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{repo.name}</p>
                    {repo.description && (
                      <p className="truncate text-muted-foreground">{repo.description}</p>
                    )}
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      {repo.language && (
                        <span className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full bg-primary/60" />
                          {repo.language}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                        {repo.stars}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleImport}
              disabled={importing || selected.size === 0}
              className="inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
            >
              {importing
                ? "Importing..."
                : `Import Selected (${selected.size})`}
            </button>
          </div>
        )}
      </div>
    </SectionCard>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </div>
  )
}
