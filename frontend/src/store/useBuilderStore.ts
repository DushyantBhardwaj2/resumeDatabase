import { create } from 'zustand'
import { api } from '@/config/api-client'

import type { Profile, Experience as ExperienceItem, Project as ProjectItem, VaultBullet } from '@resumint/shared'
export type BuilderSelections = Record<string, string[]>

export type DocumentType = 'resume' | 'cv' | 'both'
export type TemplateType = 'ats-clean' | 'modern' | 'compact' | 'nsut-canonical'
export type GenerationStatus = 'idle' | 'selecting' | 'queued' | 'compiling' | 'ready' | 'error'

export type CurrentStage = 'idle' | 'collecting' | 'generating' | 'reviewing' | 'compiling' | 'ready' | 'error'

interface BuilderStore {
  profile: Profile | null
  jobTitle: string
  company: string
  jobDescription: string
  selectedBulletIds: BuilderSelections
  isCompiling: boolean
  pdfUrl: string | null
  zoom: number
  template: TemplateType
  documentType: DocumentType
  status: GenerationStatus
  currentStage: CurrentStage

  setProfile: (profile: Profile) => void
  setJobTitle: (title: string) => void
  setCompany: (company: string) => void
  setJobDescription: (jd: string) => void
  toggleBullet: (itemId: string, bulletId: string) => void
  setSelections: (selections: BuilderSelections) => void
  setCompiling: (compiling: boolean) => void
  setPdfUrl: (url: string | null) => void
  setZoom: (zoom: number) => void
  setTemplate: (template: TemplateType) => void
  setDocumentType: (type: DocumentType) => void
  setStatus: (status: GenerationStatus) => void
  setCurrentStage: (stage: CurrentStage) => void
  triggerCompile: () => Promise<void>
  revokePdfUrl: () => void
  reset: () => void
}

// Module-level AbortController — cancels in-flight polling when a newer
// compile is triggered before the previous one finishes.
let compileAbortController: AbortController | null = null

export const useBuilderStore = create<BuilderStore>((set, get) => ({
  profile: null,
  jobTitle: '',
  company: '',
  jobDescription: '',
  selectedBulletIds: {},
  isCompiling: false,
  pdfUrl: null,
  zoom: 100,
  template: 'nsut-canonical',
  documentType: 'resume',
  status: 'idle',
  currentStage: 'collecting',

  setProfile: (profile) => set({ profile }),
  setJobTitle: (title) => set({ jobTitle: title }),
  setCompany: (company) => set({ company }),
  setJobDescription: (jd) => set({ jobDescription: jd }),

  toggleBullet: (itemId, bulletId) =>
    set((state) => {
      const currentList = state.selectedBulletIds[itemId] || []
      const exists = currentList.includes(bulletId)
      const newList = exists
        ? currentList.filter((id) => id !== bulletId)
        : [...currentList, bulletId]
      return {
        selectedBulletIds: { ...state.selectedBulletIds, [itemId]: newList },
      }
    }),

  setSelections: (selections) => set({ selectedBulletIds: selections }),

  setCompiling: (compiling) => set({ isCompiling: compiling }),

  setPdfUrl: (url) => {
    const prev = get().pdfUrl
    if (prev && prev !== url) URL.revokeObjectURL(prev)
    set({ pdfUrl: url })
  },

  setZoom: (zoom) => set({ zoom: Math.max(50, Math.min(200, zoom)) }),
  setTemplate: (template) => set({ template }),
  setDocumentType: (type) => set({ documentType: type }),
  setStatus: (status) => set({ status }),
  setCurrentStage: (stage) => set({ currentStage: stage }),

  revokePdfUrl: () => {
    const { pdfUrl } = get()
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl)
      set({ pdfUrl: null })
    }
  },

  triggerCompile: async () => {
    const { profile, selectedBulletIds, template } = get()
    if (!profile) return

    // Cancel any previous polling loop that's still running
    if (compileAbortController) compileAbortController.abort()
    compileAbortController = new AbortController()
    const { signal } = compileAbortController

    set({ isCompiling: true, status: 'queued' })

    try {
      // ── Step 1: Enqueue the job ────────────────────────────────────────────
      const enqueueRes = await api.api.protected.resume['compile-live'].$post({
        json: { profile, selectedBulletIds, templateId: template },
      }, { init: { signal } })
      
      if (!enqueueRes.ok) {
        const errBody = await enqueueRes.json().catch(() => ({ error: 'Compilation failed' }))
        throw new Error((errBody as Record<string, string>).error || 'Failed to queue compilation')
      }
      const { jobId } = await enqueueRes.json()

      // ── Step 2: Poll status (600 ms interval, max 36 s) ───────────────────
      const MAX_POLLS = 60
      for (let i = 0; i < MAX_POLLS; i++) {
        // Wait before polling (except on first iteration to allow fast jobs)
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(resolve, 600)
          signal.addEventListener('abort', () => { clearTimeout(timer); reject(new DOMException('Aborted', 'AbortError')) })
        })

        const statusRes = await api.api.protected.resume['compile-status'][':jobId'].$get({
          param: { jobId }
        }, { init: { signal } })
        
        if (!statusRes.ok) throw new Error('Status check failed')

        const { status: jobStatus, error } = await statusRes.json()

        if (jobStatus === 'active') {
          set({ status: 'compiling' })
        } else if (jobStatus === 'completed') {
          // ── Step 3: Fetch the PDF blob ────────────────────────────────────
          const resultRes = await api.api.protected.resume['compile-result'][':jobId'].$get({
            param: { jobId }
          }, { init: { signal } })
          if (!resultRes.ok) throw new Error('Failed to retrieve compiled PDF')

          const blob = await resultRes.blob()
          const url = URL.createObjectURL(blob)
          const prev = get().pdfUrl
          if (prev) URL.revokeObjectURL(prev)
          set({ pdfUrl: url, status: 'ready' })
          return
        } else if (jobStatus === 'failed') {
          throw new Error(error || 'PDF compilation failed')
        }
        // 'queued' → continue polling
      }

      throw new Error('Compilation timed out — please try again')
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        // Silently discard — a newer compile was triggered
        return
      }
      console.error('Compile failed:', e instanceof Error ? e.message : e)
      set({ status: 'error' })
    } finally {
      set({ isCompiling: false })
    }
  },

  reset: () => {
    const { pdfUrl } = get()
    if (pdfUrl) URL.revokeObjectURL(pdfUrl)
    set({
      jobTitle: '',
      company: '',
      jobDescription: '',
      selectedBulletIds: {},
      pdfUrl: null,
      zoom: 100,
      status: 'idle',
      currentStage: 'collecting',
      isCompiling: false,
    })
  },
}))
