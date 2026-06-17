"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { OverleafButton } from "@/components/ui/overleaf-button"

type ProfileData = {
  contact: Record<string, unknown>
  education: Array<Record<string, unknown>>
  experience: Array<Record<string, unknown>>
  projects: Array<Record<string, unknown>>
  skills: Record<string, string[]>
}

type TailoredOutput = {
  summary: string | null
  experience: Array<{ company: string; role: string; startDate: string | null; endDate: string | null; bullets: string[] }>
  projects: Array<{ title: string; techStack: string[]; bullets: string[]; url: string | null }>
  skills: { languages: string[]; frameworks: string[]; tools: string[] }
}

type TailorResult = {
  jobTitle: string
  company: string
  original: ProfileData
  tailored: TailoredOutput
  latex: string
}

export default function TailorPageWrapper() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl space-y-6 py-8 animate-fade-in"><p className="text-sm text-muted-foreground">Loading...</p></div>}>
      <TailorPage />
    </Suspense>
  )
}

function TailorPage() {
  const searchParams = useSearchParams()
  const [jobTitle, setJobTitle] = useState("")
  const [company, setCompany] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<TailorResult | null>(null)
  const [loadingStep, setLoadingStep] = useState(0)
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    const cloneId = searchParams.get("clone")
    const editId = searchParams.get("edit")
    const id = cloneId || editId
    if (!id) return
    fetch(`/api/history/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setJobTitle(data.jobTitle || "")
        setCompany(data.companyName || "")
        setJobDescription(data.jobDescription || "")
        if (editId) {
          setEditingId(id)
          const dataObj = data as { tailoredData: { tailored?: TailoredOutput; latex?: string }; jobTitle: string; companyName: string }
          const tailoredData = dataObj.tailoredData?.tailored
          if (tailoredData) {
            const profilePlaceholder: ProfileData = { contact: {}, education: [], experience: [], projects: [], skills: {} }
            setResult({ jobTitle: dataObj.jobTitle, company: dataObj.companyName, original: profilePlaceholder, tailored: tailoredData, latex: dataObj.tailoredData?.latex ?? "" })
          }
        }
      })
      .catch(() => toast.error("Failed to load resume data"))
  }, [searchParams])

  const canGenerate = jobTitle.trim() && company.trim() && jobDescription.trim().length >= 50

  const loadingSteps = [
    "Analyzing job description...",
    "Tailoring your experience...",
    "Optimizing descriptions...",
  ]

  async function handleGenerate() {
    if (!canGenerate) return
    setGenerating(true)
    setResult(null)
    setLoadingStep(0)

    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => Math.min(prev + 1, loadingSteps.length - 1))
    }, 2000)

    try {
      const res = await fetch("/api/resume/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle, company, jobDescription }),
      })

      clearInterval(stepInterval)

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to tailor resume")
      }

      const data: TailorResult = await res.json()
      setResult(data)
      toast.success("Resume tailored successfully!")
    } catch (e) {
      clearInterval(stepInterval)
      toast.error(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tailor Your Resume</h1>
        <p className="mt-1 text-muted-foreground">
          Paste a job description and we&apos;ll tailor your profile to match.
        </p>
      </div>

      {!result && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-muted-foreground">Job Title</label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Frontend Engineer"
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-muted-foreground">Company</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Google"
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-muted-foreground">Job Description</label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here... (minimum 50 characters)"
                rows={8}
                className="resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
              />
              <p className="text-xs text-muted-foreground">
                {jobDescription.length < 50
                  ? `Needs at least ${50 - jobDescription.length} more characters`
                  : "Ready to generate"}
              </p>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!canGenerate || generating}
              className="inline-flex h-11 w-full items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-50 sm:w-auto"
            >
              {generating ? "Generating..." : "Generate Tailored Resume"}
            </button>
          </div>
        </div>
      )}

      {generating && !result && (
        <div className="rounded-2xl border border-border bg-card p-12 shadow-sm">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="flex gap-1">
              <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: "0ms" }} />
              <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: "150ms" }} />
              <div className="h-2.5 w-2.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: "300ms" }} />
            </div>
            <p className="text-sm font-medium">{loadingSteps[loadingStep]}</p>
            <p className="text-xs text-muted-foreground">This may take a moment</p>
          </div>
        </div>
      )}

      {result && (
        <ResumePreview
          result={result}
          onReset={() => setResult(null)}
          editingId={editingId}
        />
      )}
    </div>
  )
}

function ResumePreview({
  result,
  onReset,
  editingId,
}: {
  result: TailorResult
  onReset: () => void
  editingId: string | null
}) {
  const [edited, setEdited] = useState<TailoredOutput>(result.tailored)
  const [editingBullets, setEditingBullets] = useState<{ section: string; index: number } | null>(null)
  const [editText, setEditText] = useState("")
  const [showStyling, setShowStyling] = useState(false)
  const [showLatex, setShowLatex] = useState(false)
  const [styleConfig, setStyleConfig] = useState({
    template: "classic" as "classic" | "tech" | "minimalist",
    primaryColor: "#1d4ed8",
    fontFamily: "'Times New Roman', Times, serif",
    spacing: "normal" as "compact" | "normal" | "relaxed",
  })

  const diffClass = (original: string[], tailored: string[]) => {
    if (JSON.stringify(original) === JSON.stringify(tailored)) return ""
    return "border-l-2 border-primary pl-3"
  }

  function openBulletEditor(section: "experience" | "projects", index: number) {
    setEditingBullets({ section, index })
    const bullets = section === "experience"
      ? edited.experience[index].bullets
      : edited.projects[index].bullets
    setEditText(bullets.join("\n"))
  }

  function saveBulletEdits() {
    if (!editingBullets) return
    const bullets = editText.split("\n").filter((b) => b.trim())
    if (editingBullets.section === "experience") {
      setEdited((prev) => ({
        ...prev,
        experience: prev.experience.map((exp, i) =>
          i === editingBullets.index ? { ...exp, bullets } : exp
        ),
      }))
    } else {
      setEdited((prev) => ({
        ...prev,
        projects: prev.projects.map((proj, i) =>
          i === editingBullets.index ? { ...proj, bullets } : proj
        ),
      }))
    }
    setEditingBullets(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="flex items-center gap-1 rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
            </svg>
            New Tailoring
          </button>
          <h2 className="text-lg font-semibold">
            {result.jobTitle} @ {result.company}
          </h2>
        </div>
        <div className="flex items-center gap-2">
            <button
              onClick={() => setShowStyling(!showStyling)}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium transition-colors hover:bg-muted"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
              </svg>
              Styling
            </button>
            <button
              onClick={() => setShowLatex(true)}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium transition-colors hover:bg-muted"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              LaTeX
            </button>
            <OverleafButton latexCode={result.latex} />
          </div>
      </div>

      {showStyling && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold">Resume Styling</h3>
          <div className="grid gap-6 sm:grid-cols-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Template</label>
              <div className="flex gap-1.5">
                {(["classic", "tech", "minimalist"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setStyleConfig((s) => ({ ...s, template: t }))}
                    className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                      styleConfig.template === t
                        ? "bg-primary text-white"
                        : "border border-border hover:bg-muted"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Accent Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={styleConfig.primaryColor}
                  onChange={(e) => setStyleConfig((s) => ({ ...s, primaryColor: e.target.value }))}
                  className="h-8 w-8 cursor-pointer rounded border border-border bg-transparent"
                />
                <span className="text-xs text-muted-foreground">{styleConfig.primaryColor}</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Font</label>
              <select
                value={styleConfig.fontFamily}
                onChange={(e) => setStyleConfig((s) => ({ ...s, fontFamily: e.target.value }))}
                className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs outline-none"
              >
                <option value="'Times New Roman', Times, serif">Times New Roman</option>
                <option value="'Inter', sans-serif">Inter</option>
                <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Spacing</label>
              <div className="flex gap-1.5">
                {(["compact", "normal", "relaxed"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStyleConfig((sc) => ({ ...sc, spacing: s }))}
                    className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                      styleConfig.spacing === s
                        ? "bg-primary text-white"
                        : "border border-border hover:bg-muted"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showLatex && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[85vh] w-full max-w-3xl rounded-2xl border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <h3 className="text-sm font-semibold">LaTeX Source</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(result.latex)
                    toast.success("LaTeX copied to clipboard")
                  }}
                  className="rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors hover:bg-muted"
                >
                  Copy
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([result.latex], { type: "text/plain" })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement("a")
                    a.href = url
                    a.download = `${result.jobTitle}_${result.company}_resume.tex`
                    a.click()
                    URL.revokeObjectURL(url)
                  }}
                  className="rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors hover:bg-muted"
                >
                  Download .tex
                </button>
                <button
                  onClick={() => setShowLatex(false)}
                  className="rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors hover:bg-muted"
                >
                  Close
                </button>
              </div>
            </div>
            <pre className="overflow-auto p-5 text-xs leading-relaxed" style={{ maxHeight: "calc(85vh - 60px)" }}>
              <code>{result.latex}</code>
            </pre>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Original Profile</h3>
          <div className="space-y-4 text-sm">
            {result.original.experience.map((exp: Record<string, unknown>, i: number) => (
              <div key={i}>
                <p className="font-medium">{exp.role as string} at {exp.company as string}</p>
                <ul className="mt-1 list-disc pl-4 text-muted-foreground">
                  {(exp.bullets as string[]).map((b: string, j: number) => (
                    <li key={j}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
            <div>
              <p className="font-medium">Skills</p>
              <p className="mt-1 text-muted-foreground">
                {Object.values(result.original.skills).flat().join(", ")}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-primary">Tailored Resume</h3>
          {editingBullets ? (
            <div className="space-y-3">
              <label className="text-sm font-medium text-muted-foreground">Edit bullet points (one per line)</label>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={6}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
              />
              <div className="flex gap-2">
                <button onClick={saveBulletEdits} className="rounded-full bg-primary px-4 py-2 text-xs font-medium text-white">
                  Save
                </button>
                <button onClick={() => setEditingBullets(null)} className="rounded-full border border-border px-4 py-2 text-xs font-medium">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-sm">
              {edited.summary && (
                <p className="italic text-muted-foreground">{edited.summary}</p>
              )}
              {edited.experience.map((exp, i) => {
                const orig = result.original.experience[i]
                const hasDiff = orig && JSON.stringify(orig.bullets) !== JSON.stringify(exp.bullets)
                return (
                  <div key={i} className={hasDiff ? diffClass(orig?.bullets as string[] || [], exp.bullets) : ""}>
                    <div className="flex items-start justify-between">
                      <p className="font-medium">{exp.role} at {exp.company}</p>
                      <button
                        onClick={() => openBulletEditor("experience", i)}
                        className="text-xs text-primary hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                    <ul className="mt-1 list-disc pl-4 text-muted-foreground">
                      {exp.bullets.map((b, j) => (
                        <li key={j}>{b}</li>
                      ))}
                    </ul>
                  </div>
                )
              })}
              {edited.projects.length > 0 && (
                <div>
                  <p className="mb-2 font-medium">Projects</p>
                  {edited.projects.map((proj, i) => {
                    const orig = result.original.projects[i]
                    const hasDiff = orig && JSON.stringify(orig.bullets) !== JSON.stringify(proj.bullets)
                    return (
                      <div key={i} className={`mb-3 ${hasDiff ? diffClass(orig?.bullets as string[] || [], proj.bullets) : ""}`}>
                        <div className="flex items-start justify-between">
                          <p className="font-medium">{proj.title}</p>
                          <button
                            onClick={() => openBulletEditor("projects", i)}
                            className="text-xs text-primary hover:underline"
                          >
                            Edit
                          </button>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">Style preferences can be saved per resume.</p>
            <div className="flex gap-2">
              {editingId && (
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/history/${editingId}/styling`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(styleConfig),
                      })
                      if (!res.ok) throw new Error()
                      toast.success("Style saved")
                    } catch {
                      toast.error("Failed to save style")
                    }
                  }}
                  className="rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-white"
                >
                  Save Style
                </button>
              )}
              <button
                onClick={() => setStyleConfig({
                  template: "classic",
                  primaryColor: "#1d4ed8",
                  fontFamily: "'Times New Roman', Times, serif",
                  spacing: "normal",
                })}
                className="rounded-full border border-border px-4 py-1.5 text-xs font-medium"
              >
                Reset
              </button>
            </div>
          </div>
                        <p className="text-muted-foreground">{proj.techStack.join(", ")}</p>
                        <ul className="mt-1 list-disc pl-4 text-muted-foreground">
                          {proj.bullets.map((b, j) => (
                            <li key={j}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    )
                  })}
                </div>
              )}
              <div>
                <p className="font-medium">Skills</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {Object.entries(edited.skills).map(([cat, skills]) =>
                    skills.map((skill, i) => (
                      <span key={`${cat}-${i}`} className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary">
                        {skill}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
