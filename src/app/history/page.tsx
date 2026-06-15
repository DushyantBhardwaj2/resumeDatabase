"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

type ResumeSummary = {
  id: string
  companyName: string
  jobTitle: string
  createdAt: string
}

type FullResume = ResumeSummary & {
  jobDescription: string
  tailoredData: {
    tailored?: {
      experience?: Array<{ role: string; company: string; bullets: string[] }>
      projects?: Array<{ title: string; techStack?: string[]; bullets: string[] }>
      skills?: Record<string, string[]>
    }
  }
  styleConfig: Record<string, string> | null
}

export default function HistoryPage() {
  const router = useRouter()
  const [resumes, setResumes] = useState<ResumeSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [previewData, setPreviewData] = useState<FullResume | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const fetchResumes = useCallback(async (query?: string) => {
    setLoading(true)
    try {
      const url = query ? `/api/history?search=${encodeURIComponent(query)}` : "/api/history"
      const res = await fetch(url)
      if (res.status === 401) { router.push("/"); return }
      const data = await res.json()
      setResumes(data.resumes ?? [])
    } catch {
      toast.error("Failed to load history")
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetch("/api/history")
      .then((r) => { if (r.status === 401) router.push("/"); return r.json() })
      .then((data) => setResumes(data.resumes ?? []))
      .catch(() => toast.error("Failed to load history"))
      .finally(() => setLoading(false))
  }, [router])

  function handleSearch(val: string) {
    setSearch(val)
    fetchResumes(val)
  }

  async function openPreview(id: string) {
    try {
      const res = await fetch(`/api/history/${id}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setPreviewData(data)
      setPreviewId(id)
    } catch {
      toast.error("Failed to load resume")
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/history/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Resume deleted")
      setResumes((prev) => prev.filter((r) => r.id !== id))
      if (previewId === id) { setPreviewId(null); setPreviewData(null) }
    } catch {
      toast.error("Failed to delete resume")
    }
    setDeleteConfirm(null)
  }

  function handleClone(r: ResumeSummary) {
    router.push(`/tailor?clone=${encodeURIComponent(r.id)}`)
  }

  function handleEdit(r: ResumeSummary) {
    router.push(`/tailor?edit=${encodeURIComponent(r.id)}`)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Resumes</h1>
          <p className="mt-1 text-muted-foreground">
            View and manage your previously tailored resumes.
          </p>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by company or title..."
          className="max-w-xs rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <svg className="h-6 w-6 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}

      {!loading && resumes.length === 0 && (
        <div className="glass rounded-2xl p-12 text-center shadow-sm">
          <p className="text-muted-foreground">No tailored resumes yet.</p>
          <button
            onClick={() => router.push("/tailor")}
            className="mt-4 inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-medium text-white"
          >
            Tailor Your First Resume
          </button>
        </div>
      )}

      {!loading && resumes.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {resumes.map((r, idx) => (
            <div
              key={r.id}
              className={`glass rounded-2xl p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/30 animate-slide-up stagger-${Math.min(idx + 1, 4)}`}
            >
              <div className="mb-3">
                <h3 className="font-semibold text-card-foreground">{r.jobTitle}</h3>
                <p className="text-sm text-muted-foreground">{r.companyName}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(r.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric", month: "short", year: "numeric",
                })}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={() => openPreview(r.id)}
                  className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                >
                  Preview
                </button>
                <button
                  onClick={() => handleClone(r)}
                  className="rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
                >
                  Clone
                </button>
                <button
                  onClick={() => handleEdit(r)}
                  className="rounded-full border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteConfirm(r.id)}
                  className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-error transition-colors hover:bg-error/10"
                >
                  Delete
                </button>
              </div>

              {deleteConfirm === r.id && (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-background/95 backdrop-blur-sm">
                  <div className="text-center">
                    <p className="mb-3 text-sm font-medium">Delete this resume?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="rounded-full bg-error px-4 py-1.5 text-xs font-medium text-white"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="rounded-full border border-border px-4 py-1.5 text-xs font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {previewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl glass p-6 shadow-xl animate-scale-in">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold">{previewData.jobTitle}</h2>
                <p className="text-sm text-muted-foreground">{previewData.companyName}</p>
              </div>
              <button
                onClick={() => { setPreviewId(null); setPreviewData(null) }}
                className="rounded-full border border-border p-2 transition-colors hover:bg-muted"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <h3 className="mb-1 font-semibold">Tailored Experience</h3>
                {((previewData.tailoredData.tailored?.experience) ?? []).map(
                  (exp, i: number) => (
                    <div key={i} className="mb-3">
                      <p className="font-medium">{exp.role} at {exp.company}</p>
                      <ul className="mt-1 list-disc pl-4 text-muted-foreground">
                        {exp.bullets.map((b: string, j: number) => (
                          <li key={j}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  )
                )}
              </div>
              {previewData.tailoredData.tailored?.projects && previewData.tailoredData.tailored.projects.length > 0 && (
                <div>
                  <h3 className="mb-1 font-semibold">Projects</h3>
                  {previewData.tailoredData.tailored.projects.map(
                    (proj, i: number) => (
                      <div key={i} className="mb-3">
                        <p className="font-medium">{proj.title}</p>
                        <ul className="mt-1 list-disc pl-4 text-muted-foreground">
                          {proj.bullets.map((b: string, j: number) => (
                            <li key={j}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    )
                  )}
                </div>
              )}
              <div>
                <h3 className="mb-1 font-semibold">Skills</h3>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(
                    previewData.tailoredData.tailored?.skills ?? {}
                  ).map(([cat, skills]) =>
                    (skills as string[]).map((skill: string, i: number) => (
                      <span key={`${cat}-${i}`} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary">
                        {skill}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
