'use client'

import { create } from 'zustand'
import { toast } from 'sonner'
import type { Profile, Experience, Project, Education, Certificate, Skills, Contact } from '@resumint/shared'
import { normalizeProfile, getEmptyProfile } from '@/lib/normalize-profile'
import { api } from '@/config/api-client'

export const DRAFT_KEY = 'profile-draft'

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

interface ProfileStore {
  profile: Profile
  originalProfile: Profile | null
  loading: boolean
  saving: SaveState

  loadProfile: () => Promise<void>
  saveProfile: () => Promise<void>
  updateProfile: (profile: Profile) => void
  isDirty: () => boolean

  addProject: (item: Project) => void
  addExperience: (item: Experience) => void
  addEducation: (item: Education) => void
  addCertificate: (item: Certificate) => void
  updateExperience: (id: string, item: Experience) => void
  deleteExperience: (id: string) => void
  updateProject: (id: string, item: Project) => void
  deleteProject: (id: string) => void
  updateContact: (contact: Contact) => void
  updateSkills: (skills: Skills) => void
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  profile: getEmptyProfile(),
  originalProfile: null,
  loading: true,
  saving: 'idle',

  loadProfile: async () => {
    set({ loading: true })
    try {
      const res = await api.api.protected.profile.$get()
      if (!res.ok) throw new Error()
      const data = await res.json()
      const normalized = normalizeProfile(data)
      set({ profile: normalized, originalProfile: structuredClone(normalized) })
    } catch {
      toast.error('Failed to load profile')
    } finally {
      set({ loading: false })
    }
  },

  saveProfile: async () => {
    const { profile, originalProfile } = get()
    if (!originalProfile) return
    if (JSON.stringify(profile) === JSON.stringify(originalProfile)) return
    set({ saving: 'saving' })
    try {
      const res = await api.api.protected.profile.$patch({
        json: profile,
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      const normalized = normalizeProfile(data)
      set({ profile: normalized, originalProfile: structuredClone(normalized), saving: 'saved' })
      localStorage.removeItem(DRAFT_KEY)
      setTimeout(() => set({ saving: 'idle' }), 2000)
      toast.success('Profile saved')
    } catch {
      set({ saving: 'error' })
      toast.error('Failed to save profile')
    }
  },

  updateProfile: (updated) => {
    set({ profile: updated })
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(updated))
    } catch { /* ignore */ }
  },

  isDirty: () => {
    const { profile, originalProfile } = get()
    if (!originalProfile) return false
    return JSON.stringify(profile) !== JSON.stringify(originalProfile)
  },

  addProject: (item) => {
    const { profile } = get()
    const updated = { ...profile, projects: [...profile.projects, item] }
    set({ profile: updated })
    get().saveProfile()
  },

  addExperience: (item) => {
    const { profile } = get()
    const updated = { ...profile, experience: [...profile.experience, item] }
    set({ profile: updated })
    get().saveProfile()
  },

  addEducation: (item) => {
    const { profile } = get()
    const updated = { ...profile, education: [...profile.education, item] }
    set({ profile: updated })
    get().saveProfile()
  },

  addCertificate: (item) => {
    const { profile } = get()
    const updated = { ...profile, certificates: [...profile.certificates, item] }
    set({ profile: updated })
    get().saveProfile()
  },

  updateExperience: (id, item) => {
    const { profile } = get()
    const updated = {
      ...profile,
      experience: profile.experience.map(e => e.id === id ? item : e)
    }
    set({ profile: updated })
    get().saveProfile()
  },

  deleteExperience: (id) => {
    const { profile } = get()
    const updated = {
      ...profile,
      experience: profile.experience.filter(e => e.id !== id)
    }
    set({ profile: updated })
    get().saveProfile()
  },

  updateProject: (id, item) => {
    const { profile } = get()
    const updated = {
      ...profile,
      projects: profile.projects.map(p => p.id === id ? item : p)
    }
    set({ profile: updated })
    get().saveProfile()
  },

  deleteProject: (id) => {
    const { profile } = get()
    const updated = {
      ...profile,
      projects: profile.projects.filter(p => p.id !== id)
    }
    set({ profile: updated })
    get().saveProfile()
  },

  updateContact: (contact) => {
    const { profile } = get()
    const updated = { ...profile, contact }
    set({ profile: updated })
    get().saveProfile()
  },

  updateSkills: (skills) => {
    const { profile } = get()
    const updated = { ...profile, skills }
    set({ profile: updated })
    get().saveProfile()
  },
}))
