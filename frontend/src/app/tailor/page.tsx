'use client'

import { useEffect, use, useRef, useCallback } from 'react'
import { useBuilderStore } from '@/store/useBuilderStore'
import { GenerateChatWorkspace } from '@/components/generate/GenerateChatWorkspace'
import { PdfPreviewPanel } from '@/components/generate/PdfPreviewPanel'
import { Splitter } from '@/components/ui/splitter'
import { useLocalStorage } from '@/lib/use-local-storage'
import { clamp } from '@/lib/utils'
import { toast } from 'sonner'

const MIN_CENTER_PX = 360
const MIN_PREVIEW_PX = 320
const STORAGE_KEY = 'tailor-panel-widths'

export default function GeneratePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = use(searchParams)
  const cloneId = typeof params.clone === 'string' ? params.clone : null
  const editId = typeof params.edit === 'string' ? params.edit : null

  const profile = useBuilderStore((s) => s.profile)
  const setProfile = useBuilderStore((s) => s.setProfile)
  const setJobTitle = useBuilderStore((s) => s.setJobTitle)
  const setCompany = useBuilderStore((s) => s.setCompany)
  const setJobDescription = useBuilderStore((s) => s.setJobDescription)
  const setSelections = useBuilderStore((s) => s.setSelections)
  const setCurrentStage = useBuilderStore((s) => s.setCurrentStage)
  const loaded = useRef(false)

  const [savedWidths, setSavedWidths] = useLocalStorage<number | null>(STORAGE_KEY, null)

  const containerRef = useRef<HTMLDivElement>(null)
  const centerPercent = useRef(savedWidths ?? 55)

  const applyWidths = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const containerW = container.getBoundingClientRect().width
    const centerEl = container.querySelector('[data-panel="center"]') as HTMLElement | null
    const previewEl = container.querySelector('[data-panel="preview"]') as HTMLElement | null
    if (!centerEl || !previewEl) return

    const centerPx = (centerPercent.current / 100) * containerW
    const clamped = clamp(centerPx, MIN_CENTER_PX, containerW - MIN_PREVIEW_PX)

    centerEl.style.width = `${clamped}px`
    centerEl.style.flex = 'none'
    previewEl.style.flex = '1 1 0'
    previewEl.style.minWidth = '0'
  }, [])

  useEffect(() => {
    requestAnimationFrame(() => applyWidths())
  }, [applyWidths])

  useEffect(() => {
    const onResize = () => applyWidths()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [applyWidths])

  const handleSplitter = useCallback((delta: number) => {
    const container = containerRef.current
    if (!container) return
    const containerW = container.getBoundingClientRect().width
    if (containerW === 0) return

    const centerEl = container.querySelector('[data-panel="center"]') as HTMLElement | null
    if (!centerEl) return
    const currentCenterPx = centerEl.getBoundingClientRect().width
    const newCenterPx = clamp(currentCenterPx + delta, MIN_CENTER_PX, containerW - MIN_PREVIEW_PX)
    const pct = (newCenterPx / containerW) * 100

    centerPercent.current = pct
    setSavedWidths(pct)

    centerEl.style.width = `${newCenterPx}px`
    centerEl.style.flex = 'none'
  }, [setSavedWidths])

  // Clone/edit hydration
  useEffect(() => {
    const id = cloneId || editId
    if (!id || profile || loaded.current) return
    loaded.current = true

    async function loadClone() {
      try {
        const res = await fetch(`/api/protected/history/${id}`, { credentials: 'include' })
        if (!res.ok) return
        const data = await res.json()
        const td = data.tailoredData

        setJobTitle(td.jobTitle || '')
        setCompany(td.company || '')
        setJobDescription(data.jobDescription || '')

        const original = td.original
        setProfile({
          contact: original.contact || {},
          education: original.education || [],
          experience: (original.experience || []).map((e: Record<string, unknown>) => ({
            id: (e.id as string) || crypto.randomUUID(),
            company: (e.company as string) || '',
            role: (e.role as string) || '',
            startDate: (e.startDate as string) || '',
            endDate: (e.endDate as string) || '',
            current: (e.current as boolean) || false,
            vaultBullets: ((e.vaultBullets || []) as Array<Record<string, unknown>>).map((b) => ({
              id: (b.id as string) || crypto.randomUUID(),
              text: (b.text as string) || '',
              keywords: (b.keywords as string[]) || [],
              category: b.category as string | undefined,
              isAIGenerated: (b.isAIGenerated as boolean) || false,
            })),
          })),
          projects: (original.projects || []).map((p: Record<string, unknown>) => ({
            id: (p.id as string) || crypto.randomUUID(),
            title: (p.title as string) || '',
            url: (p.url as string) || '',
            techStack: (p.techStack as string[]) || [],
            vaultBullets: ((p.vaultBullets || []) as Array<Record<string, unknown>>).map((b) => ({
              id: (b.id as string) || crypto.randomUUID(),
              text: (b.text as string) || '',
              keywords: (b.keywords as string[]) || [],
              category: b.category as string | undefined,
              isAIGenerated: (b.isAIGenerated as boolean) || false,
            })),
          })),
          skills: original.skills || { languages: [], frameworks: [], tools: [] },
        })

        const selections: Record<string, string[]> = {}
        for (const exp of (td.tailored?.experience || [])) {
          const eid = (exp.id as string) || crypto.randomUUID()
          selections[eid] = ((exp.vaultBullets || []) as Array<{ id: string }>).map((b) => b.id)
        }
        for (const proj of (td.tailored?.projects || [])) {
          const pid = (proj.id as string) || crypto.randomUUID()
          selections[pid] = ((proj.vaultBullets || []) as Array<{ id: string }>).map((b) => b.id)
        }
        setSelections(selections)
        setCurrentStage('reviewing')
      } catch {
        toast.error('Failed to load cloned resume. Starting with a blank workspace.')
      }
    }

    loadClone()
  }, [cloneId, editId, profile, setProfile, setJobTitle, setCompany, setJobDescription, setSelections, setCurrentStage])

  return (
    <div ref={containerRef} className="flex h-[calc(100dvh-3.5rem)] lg:h-dvh overflow-hidden">
      {/* Center panel — full width on mobile, split on desktop */}
      <div data-panel="center" className="flex flex-col min-w-0 border-r border-edge overflow-hidden max-lg:w-full max-lg:flex-1">
        <GenerateChatWorkspace />
      </div>

      {/* Splitter — hidden on mobile */}
      <div className="hidden lg:block">
        <Splitter onResize={handleSplitter} />
      </div>

      {/* Preview panel — hidden on mobile */}
      <div data-panel="preview" className="hidden lg:flex flex-col min-w-0 overflow-hidden p-4">
        <PdfPreviewPanel />
      </div>
    </div>
  )
}
