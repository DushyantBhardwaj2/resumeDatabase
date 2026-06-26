import { create } from 'zustand'

export type VaultBullet = {
  id: string
  text: string
  category?: 'FRONTEND' | 'BACKEND' | 'DEVOPS' | 'LEADERSHIP' | 'GENERAL'
  keywords: string[]
  isAIGenerated: boolean
}

export type ExperienceItem = {
  id: string
  company: string
  role: string
  startDate: string
  endDate: string
  current: boolean
  vaultBullets: VaultBullet[]
}

export type ProjectItem = {
  id: string
  title: string
  url: string
  techStack: string[]
  vaultBullets: VaultBullet[]
}

export type Profile = {
  contact: Record<string, string>
  education: Record<string, unknown>[]
  experience: ExperienceItem[]
  projects: ProjectItem[]
  skills: { languages: string[]; frameworks: string[]; tools: string[] }
}

export type BuilderSelections = Record<string, string[]>

export type DocumentType = 'resume' | 'cv' | 'both'
export type TemplateType = 'ats-clean' | 'modern' | 'compact' | 'nsut-canonical'
export type GenerationStatus = 'idle' | 'selecting' | 'compiling' | 'ready' | 'error'

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
    set({ isCompiling: true, status: 'compiling' })
    try {
      const res = await fetch('/api/protected/resume/compile-live', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, selectedBulletIds, templateId: template }),
      })
      if (!res.ok) throw new Error('Compilation failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const prev = get().pdfUrl
      if (prev) URL.revokeObjectURL(prev)
      set({ pdfUrl: url, status: 'ready' })
    } catch {
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
