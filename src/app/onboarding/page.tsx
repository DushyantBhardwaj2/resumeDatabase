"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

type Step = "upload" | "parsing" | "review"

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

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("upload")
  const [rawText, setRawText] = useState("")
  const [parsed, setParsed] = useState<ParsedResume>(defaultParsed)
  const [error, setError] = useState("")
  const [dragOver, setDragOver] = useState(false)

  const handleFile = useCallback(async (file: File) => {
    if (file.type !== "application/pdf") {
      setError("Only PDF files are accepted.")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit.")
      return
    }

    setError("")
    setStep("parsing")

    const formData = new FormData()
    formData.append("file", file)

    try {
      const res = await fetch("/api/resume/parse", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to parse resume")
      }
      setRawText(data.rawText)
      setParsed(data.parsed)
      setStep("review")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
      setStep("upload")
    }
  }, [])

  async function handleSave() {
    try {
      const res = await fetch("/api/profile/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText, parsed }),
      })
      if (!res.ok) throw new Error("Failed to save profile")
      toast.success("Profile saved successfully!")
      router.push("/dashboard")
    } catch {
      toast.error("Failed to save profile. Please try again.")
      setError("Failed to save profile. Please try again.")
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Set Up Your Profile</h1>
          <p className="mt-2 text-muted-foreground">
            Upload your existing resume to get started. We&apos;ll extract and structure your information.
          </p>
        </div>

        {step === "upload" && (
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
            {error && <p className="mt-4 text-sm text-error">{error}</p>}
          </div>
        )}

        {step === "parsing" && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border p-12">
            <svg className="mb-4 h-8 w-8 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="font-medium">Reading your resume...</p>
            <p className="mt-1 text-sm text-muted-foreground">Our AI is extracting and structuring your information</p>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-6">
            {error && (
              <div className="rounded-xl bg-error/10 p-4 text-sm text-error">{error}</div>
            )}

            <Section title="Contact">
              <Field label="Phone" value={parsed.contact.phone} onChange={(v) => setParsed((p) => ({ ...p, contact: { ...p.contact, phone: v } }))} />
              <Field label="LinkedIn" value={parsed.contact.linkedin} onChange={(v) => setParsed((p) => ({ ...p, contact: { ...p.contact, linkedin: v } }))} />
              <Field label="GitHub" value={parsed.contact.github} onChange={(v) => setParsed((p) => ({ ...p, contact: { ...p.contact, github: v } }))} />
              <Field label="Portfolio" value={parsed.contact.portfolio} onChange={(v) => setParsed((p) => ({ ...p, contact: { ...p.contact, portfolio: v } }))} />
            </Section>

            <Section title={`Education (${parsed.education.length})`}>
              {parsed.education.map((item, i) => (
                <div key={i} className="rounded-lg border border-border p-3 text-sm">
                  <p className="font-medium">{item.school}</p>
                  <p className="text-muted-foreground">{item.degree}{item.gpa ? ` — GPA: ${item.gpa}` : ""}</p>
                </div>
              ))}
            </Section>

            <Section title={`Experience (${parsed.experience.length})`}>
              {parsed.experience.map((item, i) => (
                <div key={i} className="rounded-lg border border-border p-3 text-sm">
                  <p className="font-medium">{item.role} at {item.company}</p>
                  <ul className="mt-1 list-disc pl-4 text-muted-foreground">
                    {item.bullets.map((b, j) => <li key={j}>{b}</li>)}
                  </ul>
                </div>
              ))}
            </Section>

            <Section title={`Projects (${parsed.projects.length})`}>
              {parsed.projects.map((item, i) => (
                <div key={i} className="rounded-lg border border-border p-3 text-sm">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-muted-foreground">{item.techStack.join(", ")}</p>
                </div>
              ))}
            </Section>

            <Section title="Skills">
              {Object.entries(parsed.skills).map(([category, skills]) =>
                skills.length > 0 ? (
                  <div key={category} className="text-sm">
                    <span className="font-medium capitalize">{category}: </span>
                    <span className="text-muted-foreground">{skills.join(", ")}</span>
                  </div>
                ) : null
              )}
            </Section>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("upload")}
                className="flex-1 rounded-full border border-border px-6 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
              >
                Re-upload
              </button>
              <button
                onClick={handleSave}
                className="flex-1 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
              >
                Save Profile
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </div>
  )
}

function Field({ label, value, onChange }: { label: string; value: string | null; onChange: (v: string | null) => void }) {
  return (
    <div className="flex items-center gap-3">
      <label className="w-24 text-sm font-medium text-muted-foreground">{label}</label>
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
      />
    </div>
  )
}
