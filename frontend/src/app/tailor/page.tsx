'use client'

import { useEffect, use, useRef, useCallback } from 'react'
import { api } from '@/config/api-client'
import { useBuilderStore } from '@/store/useBuilderStore'
import { GenerateChatWorkspace } from '@/components/generate/GenerateChatWorkspace'
import { PdfPreviewPanel } from '@/components/generate/PdfPreviewPanel'
import { Splitter } from '@/components/ui/splitter'
import { useLocalStorage } from '@/lib/use-local-storage'
import { clamp } from '@/lib/utils'
import { normalizeProfile } from '@/lib/normalize-profile'
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

  // Clone/edit hydration or fresh workspace reset
  const reset = useBuilderStore((s) => s.reset)
  useEffect(() => {
    const id = cloneId || editId
    if (!id) {
      reset()
      return
    }
    if (profile || loaded.current) return
    loaded.current = true

    async function loadClone() {
      try {
        const res = await api.api.protected.history[':id'].$get({ param: { id: id as string } })
        if (!res.ok) return
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = (await res.json()) as any
        const td = data.tailoredData

        setJobTitle(td.jobTitle || '')
        setCompany(td.company || '')
        setJobDescription(data.jobDescription || '')

        const original = td.original
        setProfile(normalizeProfile(original))

        const selections: Record<string, string[]> = {}
        const selectedExperienceIds: string[] = []
        const selectedProjectIds: string[] = []
        
        for (const exp of (td.tailored?.experience || [])) {
          const eid = (exp.id as string) || crypto.randomUUID()
          selections[eid] = ((exp.vaultBullets || []) as Array<{ id: string }>).map((b) => b.id)
          selectedExperienceIds.push(eid)
        }
        for (const proj of (td.tailored?.projects || [])) {
          const pid = (proj.id as string) || crypto.randomUUID()
          selections[pid] = ((proj.vaultBullets || []) as Array<{ id: string }>).map((b) => b.id)
          selectedProjectIds.push(pid)
        }
        setSelections(selections)
        useBuilderStore.setState({ selectedExperienceIds, selectedProjectIds })
        setCurrentStage('reviewing')
      } catch {
        toast.error('Failed to load cloned resume. Starting with a blank workspace.')
      }
    }

    loadClone()
  }, [cloneId, editId, profile, setProfile, setJobTitle, setCompany, setJobDescription, setSelections, setCurrentStage])

  return (
    <div ref={containerRef} className="flex h-[calc(100dvh-3.5rem)] lg:h-dvh overflow-hidden p-6 gap-6">
      {/* Center panel — full width on mobile, split on desktop */}
      <div data-panel="center" className="glass card-lift rounded-[var(--radius-xl)] flex flex-col min-w-0 overflow-hidden max-lg:w-full max-lg:flex-1 relative">
        <GenerateChatWorkspace />
      </div>

      {/* Splitter — hidden on mobile */}
      <div className="hidden lg:block w-2 cursor-col-resize hover:bg-brand/20 transition-colors rounded-full" style={{ alignSelf: 'stretch' }}>
        <Splitter onResize={handleSplitter} />
      </div>

      {/* Preview panel — hidden on mobile */}
      <div data-panel="preview" className="glass card-lift rounded-[var(--radius-xl)] hidden lg:flex flex-col min-w-0 overflow-hidden">
        <PdfPreviewPanel />
      </div>
    </div>
  )
}
