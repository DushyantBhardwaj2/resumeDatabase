import { useState, useCallback } from 'react'
import { api } from '@/config/api-client'
import { useBuilderStore } from '@/store/useBuilderStore'
import { normalizeProfile } from '@/lib/normalize-profile'
import { toast } from 'sonner'

export type ChatEntry = {
  id: string
  role: 'assistant' | 'user'
  type: 'greeting' | 'job-details-form' | 'user-jd' | 'generating' | 'contact-selection' | 'experience-selection' | 'project-selection' | 'skills-selection' | 'error'
  content?: string
}

type VaultBulletData = { id: string; text: string; keywords?: string[] }

type TailorResponse = {
  jobTitle: string
  company: string
  original: {
    contact: Record<string, string>
    education: Record<string, unknown>[]
    experience: Array<{ id?: string; company: string; role: string; startDate?: string; endDate?: string; current?: boolean; vaultBullets: VaultBulletData[] }>
    projects: Array<{ id?: string; title: string; url?: string; techStack: string[]; vaultBullets: VaultBulletData[] }>
    skills: { languages: string[]; frameworks: string[]; tools: string[] }
  }
  tailored: {
    summary: string | null
    experience: Array<{ id?: string; company: string; role: string; vaultBullets: VaultBulletData[] }>
    projects: Array<{ id?: string; title: string; url?: string; techStack?: string[]; vaultBullets: VaultBulletData[] }>
    skills: { languages: string[]; frameworks: string[]; tools: string[] }
  }
}

export function useTailorChat() {
  const [entries, setEntries] = useState<ChatEntry[]>([
    { id: 'greeting', role: 'assistant', type: 'greeting' },
    { id: 'job-form', role: 'assistant', type: 'job-details-form' },
  ])
  const [generating, setGenerating] = useState(false)

  const jobTitle = useBuilderStore((s) => s.jobTitle)
  const company = useBuilderStore((s) => s.company)
  const templateValue = useBuilderStore((s) => s.template)
  
  const setJobDescription = useBuilderStore((s) => s.setJobDescription)
  const setProfile = useBuilderStore((s) => s.setProfile)
  const setSelections = useBuilderStore((s) => s.setSelections)
  const setPdfUrl = useBuilderStore((s) => s.setPdfUrl)
  const setStatus = useBuilderStore((s) => s.setStatus)
  const setCurrentStage = useBuilderStore((s) => s.setCurrentStage)

  const handleSubmitJD = useCallback(async (jdText: string) => {
    const trimmed = jdText.trim()
    if (!trimmed || generating) return false

    const title = jobTitle.trim()
    const comp = company.trim()

    if (!title || !comp) {
      toast.error('Please fill in Job Title and Company in the form above.')
      return false
    }

    if (trimmed.length < 30) {
      toast.error('Please provide a job description or role details (at least 30 characters) to tailor your resume.')
      return false
    }

    setGenerating(true)
    setCurrentStage('generating')

    setEntries((prev) => [
      ...prev,
      { id: 'user-jd-' + Date.now(), role: 'user', type: 'user-jd', content: trimmed.length > 120 ? trimmed.slice(0, 120) + '...' : trimmed },
      { id: 'generating-' + Date.now(), role: 'assistant', type: 'generating' },
    ])

    setJobDescription(trimmed)

    try {
      const res = await api.api.protected.resume.tailor.$post({
        json: {
          jobTitle: title,
          company: comp,
          jobDescription: trimmed,
          templateId: templateValue,
        }
      })
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as Record<string, string>
        throw new Error(err.error || 'Generation failed')
      }
      const data: TailorResponse = (await res.json()) as unknown as TailorResponse

      // Map tailored items for quick lookup
      const tailoredExpMap = new Map(data.tailored.experience.map((e) => [e.company + '|' + e.role, e]))
      const tailoredProjMap = new Map(data.tailored.projects.map((p) => [p.title, p]))

      const selectedBulletIds: Record<string, string[]> = {}
      const selectedExperienceIds: string[] = []
      const selectedProjectIds: string[] = []

      // Keep ALL original experiences, but inject tailored bullets at the top if AI selected them
      const mergedExperience = data.original.experience.map((orig) => {
        const id = orig.id || crypto.randomUUID()
        const tailored = tailoredExpMap.get(orig.company + '|' + orig.role)
        
        let finalBullets = orig.vaultBullets.map(b => ({ ...b, isAIGenerated: false }))
        
        if (tailored) {
          selectedExperienceIds.push(id)
          const newTailoredBullets = tailored.vaultBullets.map(b => {
            const bId = b.id || crypto.randomUUID()
            return { id: bId, text: b.text, keywords: b.keywords || [], isAIGenerated: true }
          })
          selectedBulletIds[id] = newTailoredBullets.map(b => b.id)
          finalBullets = [...newTailoredBullets, ...finalBullets]
        } else {
          selectedExperienceIds.push(id)
          selectedBulletIds[id] = orig.vaultBullets.map(b => b.id)
        }
        
        return {
          id,
          company: orig.company,
          role: orig.role,
          startDate: orig.startDate || '',
          endDate: orig.endDate || '',
          current: orig.current || false,
          vaultBullets: finalBullets,
        }
      })

      // Keep ALL original projects
      const mergedProjects = data.original.projects.map((orig) => {
        const id = orig.id || crypto.randomUUID()
        const tailored = tailoredProjMap.get(orig.title)
        
        let finalBullets = orig.vaultBullets.map(b => ({ ...b, isAIGenerated: false }))
        
        if (tailored) {
          selectedProjectIds.push(id)
          const newTailoredBullets = tailored.vaultBullets.map(b => {
            const bId = b.id || crypto.randomUUID()
            return { id: bId, text: b.text, keywords: b.keywords || [], isAIGenerated: true }
          })
          selectedBulletIds[id] = newTailoredBullets.map(b => b.id)
          finalBullets = [...newTailoredBullets, ...finalBullets]
        } else {
          selectedProjectIds.push(id)
          selectedBulletIds[id] = orig.vaultBullets.map(b => b.id)
        }
        
        return {
          id,
          title: orig.title,
          url: orig.url || '',
          techStack: orig.techStack || [],
          vaultBullets: finalBullets,
        }
      })

      const mergedProfile = {
        contact: data.original.contact,
        education: data.original.education,
        experience: mergedExperience,
        projects: mergedProjects,
        skills: data.tailored.skills, // we can use tailored skills or original + tailored
      }

      setProfile(normalizeProfile(mergedProfile))
      setCurrentStage('reviewing')
      
      // Consolidate state updates
      useBuilderStore.setState({
        selectedExperienceIds,
        selectedProjectIds,
        selectedBulletIds
      })

      setPdfUrl(null)

      // Start the multi-step chat flow with contact selection
      setEntries((prev) => [
        ...prev.filter((e) => e.type !== 'generating'),
        { id: 'contact-selection-' + Date.now(), role: 'assistant', type: 'contact-selection', content: "I've analyzed your profile against the job description! First, let's confirm your contact details for this resume." },
      ])

      setStatus('compiling') // Will be compiled by GenerateChatWorkspace's debounced useEffect

      toast.success('Initial draft generated! Let\'s tailor it.')
      return true
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Generation failed'
      const isTimeout = message.toLowerCase().includes('timeout') || message.toLowerCase().includes('abort')
      const isNetwork = message.toLowerCase().includes('fetch') || message.toLowerCase().includes('network') || message.toLowerCase().includes('econnreset')
      if (isTimeout) {
        toast.error('The AI took too long. Try a shorter job description or try again.')
      } else if (isNetwork) {
        toast.error('Network error. Check your connection and try again.')
      } else {
        toast.error(message)
      }
      setCurrentStage('collecting')
      setGenerating(false)
      setEntries((prev) => [
        ...prev.filter((e) => e.type !== 'generating'),
        { id: 'error-' + Date.now(), role: 'assistant', type: 'error', content: isTimeout ? 'The AI took too long. Try a shorter job description.' : 'Generation failed. Please try again.' },
      ])
      return false
    } finally {
      setGenerating(false)
    }
  }, [jobTitle, company, generating, templateValue, setJobDescription, setProfile, setSelections, setPdfUrl, setStatus, setCurrentStage])

  const addChatEntry = useCallback((entry: Omit<ChatEntry, 'id'>) => {
    setEntries((prev) => [...prev, { ...entry, id: entry.type + '-' + Date.now() }])
  }, [])

  return {
    entries,
    generating,
    handleSubmitJD,
    addChatEntry,
  }
}
