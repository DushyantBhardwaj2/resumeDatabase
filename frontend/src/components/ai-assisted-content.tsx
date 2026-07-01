"use client"

import { useState } from "react"
import { api } from "@/config/api-client"
import { Button } from "@/components/ui/button"

type SectionType = "experience" | "projects" | "skills" | "summary"

interface AIAssistedContentProps {
  section: SectionType
  onAccept: (items: string[] | Record<string, string[]> | string) => void
  existingItems?: string[] | Record<string, string[]> | string | null
  context?: Record<string, unknown>
  placeholder?: string
  label?: string
}

export function AIAssistedContent({
  section,
  onAccept,
  existingItems,
  context,
  placeholder,
  label,
}: AIAssistedContentProps) {
  const [rawInput, setRawInput] = useState("")
  const [generated, setGenerated] = useState<string[] | Record<string, string[]> | string | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<"input" | "review" | "done">("input")

  async function handleGenerate() {
    if (!rawInput.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.api.protected.ai['generate-bullets'].$post({
        json: { section, rawInput, context },
      })
      if (!res.ok) {
        const err = (await res.json()) as any
        throw new Error(err?.error || "Generation failed")
      }
      const data = (await res.json()) as any

      if (section === "summary") {
        setGenerated(data.summary)
        setMode("review")
        return
      }

      if (section === "skills") {
        const all = [
          ...data.languages.map((s: string) => `Language: ${s}`),
          ...data.frameworks.map((s: string) => `Framework: ${s}`),
          ...data.tools.map((s: string) => `Tool: ${s}`),
        ]
        setGenerated(all)
        setSelected(new Set(all.map((_, i) => i)))
        setMode("review")
        return
      }

      const bullets: string[] = data.vaultBullets
        ? data.vaultBullets.map((b: { text: string }) => b.text)
        : data.bullets || []
      setGenerated(bullets)
      setSelected(new Set(bullets.map((_, i) => i)))
      setMode("review")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  function toggleSelected(i: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })
  }

  function handleAccept() {
    if (section === "summary") {
      onAccept(generated as string)
      setMode("done")
      return
    }

    if (section === "skills") {
      const items = generated as string[]
      const selectedItems = items.filter((_, i) => selected.has(i))
      const skills: Record<string, string[]> = { languages: [], frameworks: [], tools: [] }
      for (const item of selectedItems) {
        const [cat, ...rest] = item.split(": ")
        const name = rest.join(": ")
        if (cat === "Language") skills.languages.push(name)
        else if (cat === "Framework") skills.frameworks.push(name)
        else if (cat === "Tool") skills.tools.push(name)
      }
      onAccept(skills)
      setMode("done")
      return
    }

    const items = generated as string[]
    const selectedItems = items.filter((_, i) => selected.has(i))
    onAccept(selectedItems)
    setMode("done")
  }

  function handleReject() {
    setGenerated(null)
    setSelected(new Set())
    setMode("input")
    setRawInput("")
  }

  const hasExisting = existingItems !== null && existingItems !== undefined &&
    (Array.isArray(existingItems) ? existingItems.length > 0 :
     typeof existingItems === "string" ? existingItems.length > 0 :
     Object.keys(existingItems as Record<string, string[]>).length > 0)

  if (mode === "done") {
    return (
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-foreground">
        <p className="mb-1 font-medium text-primary">Content accepted</p>
        <p className="text-muted-foreground">
          {section === "summary"
            ? "Summary updated."
            : section === "skills"
            ? "Skills categorized and applied."
            : `${selected.size} bullet${selected.size !== 1 ? "s" : ""} accepted.`}
        </p>
        <button
          onClick={handleReject}
          className="mt-2 text-xs text-muted-foreground underline hover:text-foreground"
        >
          Undo & regenerate
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {label && <p className="text-sm font-medium text-foreground">{label}</p>}

      {hasExisting && mode === "input" && (
        <div className="rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground">
          {Array.isArray(existingItems)
            ? (existingItems as string[]).map((item, i) => <p key={i} className="py-0.5">• {item}</p>)
            : typeof existingItems === "string"
            ? <p>{existingItems}</p>
            : Object.entries(existingItems as Record<string, string[]>).map(([cat, items]) =>
                items.length > 0 ? (
                  <p key={cat} className="py-0.5">
                    <span className="font-medium capitalize text-foreground">{cat}: </span>
                    {items.join(", ")}
                  </p>
                ) : null
              )}
        </div>
      )}

      {mode === "input" && (
        <div className="space-y-2">
          <textarea
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            placeholder={placeholder || "Paste raw notes or bullet points here..."}
            rows={4}
            className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
          />
          <Button
            onClick={handleGenerate}
            loading={loading}
            disabled={!rawInput.trim()}
            size="sm"
          >
            Generate with AI
          </Button>
        </div>
      )}

      {mode === "review" && generated && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Select the items you want to keep:
          </p>
          <div className="space-y-1.5">
            {(generated as string[]).map((item, i) => (
              <label
                key={i}
                className={`flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 text-sm transition-colors ${
                  selected.has(i)
                    ? "border-primary/30 bg-primary/5"
                    : "border-border bg-card hover:bg-muted"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected.has(i)}
                  onChange={() => toggleSelected(i)}
                  className="mt-0.5 h-4 w-4 rounded border-border accent-primary"
                />
                <span className="leading-relaxed">{item}</span>
              </label>
            ))}
          </div>
          <div className="flex gap-2">
            <Button onClick={handleAccept} size="sm" disabled={selected.size === 0}>
              Accept {selected.size > 0 ? `(${selected.size})` : ""}
            </Button>
            <Button onClick={handleReject} variant="ghost" size="sm">
              Reject & try again
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-error/10 p-3 text-sm text-error">{error}</div>
      )}
    </div>
  )
}
