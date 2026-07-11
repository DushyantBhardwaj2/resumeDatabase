import { create } from 'zustand'
import { api } from '@/config/api-client'
import { toast } from 'sonner'

import type { Profile } from '@resumint/shared'
export type BuilderSelections = Record<string, string[]>

export type DocumentType = 'resume' | 'cv' | 'both'
export type TemplateType = 'ats-clean' | 'modern' | 'compact' | 'nsut-canonical'
export type GenerationStatus = 'idle' | 'selecting' | 'queued' | 'compiling' | 'ready' | 'error'

export type CurrentStage = 'idle' | 'collecting' | 'generating' | 'reviewing' | 'compiling' | 'ready' | 'error'

export interface ResumeContactSelection {
  name?: string
  email?: string
  phone?: string
  linkedin?: string
  github?: string
  portfolio?: string
  leetcode?: string
  enabledSocials?: string[]
}

interface BuilderStore {
  profile: Profile | null
  jobTitle: string
  company: string
  jobDescription: string
  selectedBulletIds: BuilderSelections
  selectedExperienceIds: string[]
  selectedProjectIds: string[]
  selectedEducationIds: string[]
  contactSelection: ResumeContactSelection
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
  toggleExperience: (id: string) => void
  toggleProject: (id: string) => void
  toggleEducation: (id: string) => void
  setContactSelection: (contact: ResumeContactSelection) => void
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
  selectedExperienceIds: [],
  selectedProjectIds: [],
  selectedEducationIds: [],
  contactSelection: {},
  isCompiling: false,
  pdfUrl: null,
  zoom: 100,
  template: 'nsut-canonical',
  documentType: 'resume',
  status: 'idle',
  currentStage: 'collecting',

  setProfile: (profile) => {
    const selectedExperienceIds = profile.experience?.map(e => e.id!) || []
    const selectedProjectIds = profile.projects?.map(p => p.id!) || []
    const selectedEducationIds = profile.education?.map((e) => e.school + '|' + e.degree) || []
    const selectedBulletIds: BuilderSelections = {}
    profile.experience?.forEach(e => {
      if (e.id) selectedBulletIds[e.id] = e.vaultBullets.map(b => b.id)
    })
    profile.projects?.forEach(p => {
      if (p.id) selectedBulletIds[p.id] = p.vaultBullets.map(b => b.id)
    })
    const contact = profile.contact || {}
    const contactSelection: ResumeContactSelection = {
      name: (typeof contact.name === 'string' ? contact.name : '') || undefined,
      email: (typeof contact.email === 'string' ? contact.email : '') || undefined,
      phone: (typeof contact.phone === 'string' ? contact.phone : '') || undefined,
      linkedin: (typeof contact.linkedin === 'string' ? contact.linkedin : '') || undefined,
      github: (typeof contact.github === 'string' ? contact.github : '') || undefined,
      portfolio: (typeof contact.portfolio === 'string' ? contact.portfolio : '') || undefined,
      leetcode: (typeof contact.leetcode === 'string' ? contact.leetcode : '') || undefined,
      enabledSocials: ['linkedin', 'github', 'leetcode', 'portfolio'],
    }
    set({ profile, selectedExperienceIds, selectedProjectIds, selectedEducationIds, selectedBulletIds, contactSelection })
  },
  setJobTitle: (title) => set({ jobTitle: title }),
  setCompany: (company) => set({ company }),
  setJobDescription: (jd) => set({ jobDescription: jd }),

  toggleBullet: (itemId, bulletId) =>
    set((state) => {
      const currentList = state.selectedBulletIds[itemId] || []
      const exists = currentList.includes(bulletId)
      if (exists) {
        return {
          selectedBulletIds: { ...state.selectedBulletIds, [itemId]: currentList.filter((id) => id !== bulletId) },
        }
      }
      const item = state.profile?.experience?.find(e => e.id === itemId) || state.profile?.projects?.find(p => p.id === itemId)
      const originalOrder = item?.vaultBullets || []
      const newList = [...currentList, bulletId]
      newList.sort((a, b) => {
        const ai = originalOrder.findIndex(vb => vb.id === a)
        const bi = originalOrder.findIndex(vb => vb.id === b)
        return ai - bi
      })
      return {
        selectedBulletIds: { ...state.selectedBulletIds, [itemId]: newList },
      }
    }),

  toggleExperience: (id) =>
    set((state) => {
      const exists = state.selectedExperienceIds.includes(id)
      if (exists) {
        return { selectedExperienceIds: state.selectedExperienceIds.filter((x) => x !== id) }
      }
      const originalOrder = state.profile?.experience || []
      const newList = [...state.selectedExperienceIds, id]
      newList.sort((a, b) => {
        const ai = originalOrder.findIndex(e => e.id === a)
        const bi = originalOrder.findIndex(e => e.id === b)
        return ai - bi
      })
      return { selectedExperienceIds: newList }
    }),

  toggleEducation: (id) =>
    set((state) => {
      const exists = state.selectedEducationIds.includes(id)
      if (exists) {
        return { selectedEducationIds: state.selectedEducationIds.filter((x) => x !== id) }
      }
      const originalOrder = state.profile?.education || []
      const newList = [...state.selectedEducationIds, id]
      newList.sort((a, b) => {
        const ai = originalOrder.findIndex(e => (e.school + '|' + e.degree) === a)
        const bi = originalOrder.findIndex(e => (e.school + '|' + e.degree) === b)
        return ai - bi
      })
      return { selectedEducationIds: newList }
    }),

  toggleProject: (id) =>
    set((state) => {
      const exists = state.selectedProjectIds.includes(id)
      if (exists) {
        return { selectedProjectIds: state.selectedProjectIds.filter((x) => x !== id) }
      }
      const originalOrder = state.profile?.projects || []
      const newList = [...state.selectedProjectIds, id]
      newList.sort((a, b) => {
        const ai = originalOrder.findIndex(p => p.id === a)
        const bi = originalOrder.findIndex(p => p.id === b)
        return ai - bi
      })
      return { selectedProjectIds: newList }
    }),

  setContactSelection: (contact) => set({ contactSelection: contact }),

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
    const { profile, selectedBulletIds, selectedExperienceIds, selectedProjectIds, selectedEducationIds, contactSelection, template } = get()
    if (!profile) return

    // Cancel any previous polling loop that's still running
    if (compileAbortController) compileAbortController.abort()
    compileAbortController = new AbortController()
    const { signal } = compileAbortController

    set({ isCompiling: true, status: 'queued' })

    try {
      // ── Step 1: Enqueue the job ────────────────────────────────────────────
      // Filter out undefined/empty values from contactSelection so they don't
      // overwrite profile.contact defaults during backend merge
      const cleanContactSelection = Object.fromEntries(
        Object.entries(contactSelection).filter(([, v]) => v !== undefined && v !== '')
      )
      const enqueueRes = await api.api.protected.resume['compile-live'].$post({
        json: { 
          profile, 
          selectedBulletIds, 
          selectedExperienceIds,
          selectedProjectIds,
          selectedEducationIds,
          contactSelection: cleanContactSelection,
          templateId: template 
        },
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
      toast.error(e instanceof Error ? e.message : 'PDF compilation failed')
      set({ status: 'error' })
    } finally {
      if (compileAbortController?.signal === signal) {
        set({ isCompiling: false })
      }
    }
  },

  reset: () => {
    const { pdfUrl } = get()
    if (pdfUrl) URL.revokeObjectURL(pdfUrl)
    set({
      profile: null,
      jobTitle: '',
      company: '',
      jobDescription: '',
      selectedBulletIds: {},
      selectedExperienceIds: [],
      selectedProjectIds: [],
      selectedEducationIds: [],
      contactSelection: {},
      pdfUrl: null,
      zoom: 100,
      status: 'idle',
      currentStage: 'collecting',
      isCompiling: false,
    })
  },
}))
