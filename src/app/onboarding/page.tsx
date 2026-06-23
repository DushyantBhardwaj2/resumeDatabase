"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { fetchApi } from "@/config/api-client"
import { toast } from "sonner"
import { SectionCard } from "@/components/ui/section-card"
import { Field } from "@/components/ui/field"
import { AIAssistedContent } from "@/components/ai-assisted-content"

const TOTAL_STEPS = 5

type WizardStep = 0 | 1 | 2 | 3 | 4

interface ParsedResume {
  contact: { phone: string | null; linkedin: string | null; github: string | null; portfolio: string | null }
  education: Array<{ school: string; degree: string; gpa: string | null; startYear: number | null; endYear: number | null }>
  experience: Array<{ company: string; role: string; startDate: string | null; endDate: string | null; bullets: string[] }>
  projects: Array<{ title: string; techStack: string[]; bullets: string[]; url: string | null }>
  skills: { languages: string[]; frameworks: string[]; tools: string[] }
}

const defaultParsed: ParsedResume = {
  contact: { phone: null, linkedin: null, github: null, portfolio: null },
  education: [],
  experience: [],
  projects: [],
  skills: { languages: [], frameworks: [], tools: [] },
}

const stepLabels = ["Upload", "Experience", "Projects", "Skills", "Review"]

function StepIndicator({ current, total, labels }: { current: number; total: number; labels: string[] }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
              i < current
                ? "bg-primary text-white"
                : i === current
                ? "border-2 border-primary text-primary"
                : "border border-border text-muted-foreground"
            }`}
          >
            {i < current ? "✓" : i + 1}
          </div>
          <span
            className={`hidden text-sm sm:inline ${
              i === current ? "font-medium text-foreground" : "text-muted-foreground"
            }`}
          >
            {labels[i]}
          </span>
          {i < total - 1 && (
            <div className={`mx-1 h-px w-6 ${i < current ? "bg-primary" : "bg-border"}`} />
          )}
        </div>
      ))}
    </div>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<WizardStep>(0)
  const [loading, setLoading] = useState(false)
  const [rawText, setRawText] = useState("")
  const [data, setData] = useState<ParsedResume>(defaultParsed)
  const [error, setError] = useState("")
  const [dragOver, setDragOver] = useState(false)

  const handleFile = useCallback(async (file: File) => {
    if (file.type !== "application/pdf") { setError("Only PDF files are accepted."); return }
    if (file.size > 5 * 1024 * 1024) { setError("File size exceeds 5MB limit."); return }

    setError("")
    setLoading(true)

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetchApi("/api/resume/parse", { method: "POST", body: formData })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || "Failed to parse resume")
      setRawText(result.rawText)
      setData(result.parsed)
      setStep(1)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }, [])

  async function handleSave() {
    setLoading(true)
    try {
      const res = await fetchApi("/api/profile/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText, parsed: data }),
      })
      if (!res.ok) throw new Error("Failed to save profile")
      toast.success("Profile saved successfully!")
      router.push("/dashboard")
    } catch {
      toast.error("Failed to save profile. Please try again.")
      setError("Failed to save profile. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  function next() { setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1) as WizardStep) }
  function back() { setStep((s) => Math.max(s - 1, 0) as WizardStep) }

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 transition-colors ${
              dragOver ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              id="pdf-upload"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
            <label htmlFor="pdf-upload" className="flex cursor-pointer flex-col items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <svg className="h-7 w-7 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              </div>
              <div className="text-center">
                <p className="font-medium">Drop your resume here, or click to browse</p>
                <p className="mt-1 text-sm text-muted-foreground">PDF only, max 5MB</p>
              </div>
            </label>
          </div>
        )

      case 1:
        return (
          <SectionCard title="Experience" spacing="sm">
            {data.experience.length === 0 && (
              <p className="text-sm text-muted-foreground">No experience found in your resume. Add some below.</p>
            )}
            {data.experience.map((item, i) => (
              <div key={i} className="rounded-lg border border-border p-3 text-sm">
                <p className="font-medium">{item.role} at {item.company}</p>
                <ul className="mt-1 list-disc pl-4 text-muted-foreground">
                  {item.bullets.map((b, j) => <li key={j}>{b}</li>)}
                </ul>
              </div>
            ))}
            <AIAssistedContent
              section="experience"
              onAccept={(items) => {
                const bullets = items as string[]
                setData((p) => ({
                  ...p,
                  experience: p.experience.length > 0
                    ? p.experience.map((e, i) => i === p.experience.length - 1 ? { ...e, bullets: [...e.bullets, ...bullets] } : e)
                    : [...p.experience, { company: "", role: "", startDate: null, endDate: null, bullets }],
                }))
              }}
              existingItems={data.experience.length > 0 ? data.experience[data.experience.length - 1].bullets : []}
              context={{ section: "experience" }}
              label="Add more experience bullets"
              placeholder="Describe your work experience (e.g., 'Built a microservice that reduced latency by 40%')..."
            />
          </SectionCard>
        )

      case 2:
        return (
          <SectionCard title="Projects" spacing="sm">
            {data.projects.length === 0 && (
              <p className="text-sm text-muted-foreground">No projects found in your resume. Add some below.</p>
            )}
            {data.projects.map((item, i) => (
              <div key={i} className="rounded-lg border border-border p-3 text-sm">
                <p className="font-medium">{item.title}</p>
                <p className="text-muted-foreground">{item.techStack.join(", ")}</p>
              </div>
            ))}
            <AIAssistedContent
              section="projects"
              onAccept={(items) => {
                const bullets = items as string[]
                setData((p) => ({
                  ...p,
                  projects: p.projects.length > 0
                    ? p.projects.map((pr, i) => i === p.projects.length - 1 ? { ...pr, bullets: [...pr.bullets, ...bullets] } : pr)
                    : [...p.projects, { title: "", techStack: [], bullets, url: null }],
                }))
              }}
              context={{ section: "projects" }}
              label="Add more project bullets"
              placeholder="Describe a project (e.g., 'Built a real-time chat app with WebSockets and Redis')..."
            />
          </SectionCard>
        )

      case 3:
        return (
          <SectionCard title="Skills" spacing="sm">
            {Object.entries(data.skills).some(([, s]) => s.length > 0) ? (
              Object.entries(data.skills).map(([category, skills]) =>
                skills.length > 0 ? (
                  <div key={category} className="mb-2 text-sm">
                    <span className="font-medium capitalize text-foreground">{category}: </span>
                    <span className="text-muted-foreground">{skills.join(", ")}</span>
                  </div>
                ) : null
              )
            ) : (
              <p className="mb-3 text-sm text-muted-foreground">No skills found in your resume. Add some below.</p>
            )}
            <AIAssistedContent
              section="skills"
              onAccept={(items) => {
                const skills = items as Record<string, string[]>
                setData((p) => ({
                  ...p,
                  skills: {
                    languages: [...new Set([...p.skills.languages, ...(skills.languages || [])])],
                    frameworks: [...new Set([...p.skills.frameworks, ...(skills.frameworks || [])])],
                    tools: [...new Set([...p.skills.tools, ...(skills.tools || [])])],
                  },
                }))
              }}
              context={{ section: "skills" }}
              label="Add more skills"
              placeholder="List your skills (e.g., 'Python, React, Docker, TypeScript, PostgreSQL, AWS')..."
            />
          </SectionCard>
        )

      case 4:
        return (
          <div className="space-y-4">
            <SectionCard title="Contact" spacing="sm">
              <Field label="Phone" value={data.contact.phone ?? ""} onChange={(val) => setData((p) => ({ ...p, contact: { ...p.contact, phone: val || null } }))} layout="horizontal" />
              <Field label="LinkedIn" value={data.contact.linkedin ?? ""} onChange={(val) => setData((p) => ({ ...p, contact: { ...p.contact, linkedin: val || null } }))} layout="horizontal" />
              <Field label="GitHub" value={data.contact.github ?? ""} onChange={(val) => setData((p) => ({ ...p, contact: { ...p.contact, github: val || null } }))} layout="horizontal" />
              <Field label="Portfolio" value={data.contact.portfolio ?? ""} onChange={(val) => setData((p) => ({ ...p, contact: { ...p.contact, portfolio: val || null } }))} layout="horizontal" />
            </SectionCard>

            <SectionCard title={`Education (${data.education.length})`} spacing="sm">
              {data.education.map((item, i) => (
                <div key={i} className="rounded-lg border border-border p-3 text-sm">
                  <p className="font-medium">{item.school}</p>
                  <p className="text-muted-foreground">{item.degree}{item.gpa ? ` — GPA: ${item.gpa}` : ""}</p>
                </div>
              ))}
            </SectionCard>

            <SectionCard title={`Experience (${data.experience.length})`} spacing="sm">
              {data.experience.map((item, i) => (
                <div key={i} className="rounded-lg border border-border p-3 text-sm">
                  <p className="font-medium">{item.role} at {item.company}</p>
                  <ul className="mt-1 list-disc pl-4 text-muted-foreground">
                    {item.bullets.map((b, j) => <li key={j}>{b}</li>)}
                  </ul>
                </div>
              ))}
            </SectionCard>

            <SectionCard title={`Projects (${data.projects.length})`} spacing="sm">
              {data.projects.map((item, i) => (
                <div key={i} className="rounded-lg border border-border p-3 text-sm">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-muted-foreground">{item.techStack.join(", ")}</p>
                </div>
              ))}
            </SectionCard>

            <SectionCard title="Skills" spacing="sm">
              {Object.entries(data.skills).map(([category, skills]) =>
                skills.length > 0 ? (
                  <div key={category} className="text-sm">
                    <span className="font-medium capitalize">{category}: </span>
                    <span className="text-muted-foreground">{skills.join(", ")}</span>
                  </div>
                ) : null
              )}
            </SectionCard>
          </div>
        )
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center px-4 py-8">
      <div className="w-full max-w-2xl space-y-6">
        {step > 0 && (
          <StepIndicator current={step} total={TOTAL_STEPS} labels={stepLabels} />
        )}

        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            {step === 0 ? "Set Up Your Profile" : stepLabels[step]}
          </h1>
          {step === 0 && (
            <p className="mt-2 text-muted-foreground">
              Upload your existing resume to get started. We&apos;ll extract and structure your information.
            </p>
          )}
        </div>

        {loading && step === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border p-12">
            <svg className="mb-4 h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="font-medium">Reading your resume...</p>
            <p className="mt-1 text-sm text-muted-foreground">Our AI is extracting and structuring your information</p>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-error/10 p-4 text-sm text-error">{error}</div>
        )}

        {renderStep()}

        <div className="flex items-center justify-between gap-3">
          <div>
            {step > 0 && (
              <button
                onClick={back}
                className="rounded-full border border-border px-6 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
              >
                Back
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {step > 0 && step < TOTAL_STEPS - 1 && (
              <>
                <button
                  onClick={next}
                  className="text-sm text-muted-foreground underline hover:text-foreground"
                >
                  Skip this step
                </button>
                <button
                  onClick={next}
                  className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
                >
                  Next
                </button>
              </>
            )}
            {step === TOTAL_STEPS - 1 && (
              <button
                onClick={handleSave}
                disabled={loading}
                className="rounded-full bg-primary px-8 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Profile"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
