import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import fetchWithSession from '@/lib/fetch'
import { DashboardChatClient } from './dashboard-chat-client'

type SkillsData = {
  languages: string[]
  frameworks: string[]
  tools: string[]
}

type ProfileData = {
  education: unknown[]
  experience: unknown[]
  projects: unknown[]
  skills: SkillsData
  contact: {
    phone?: string
    linkedin?: string
    github?: string
    portfolio?: string
  }
}

function calculateCompleteness(profile: ProfileData | null): number {
  if (!profile) return 0
  let score = 0
  if (profile.education && profile.education.length > 0) score += 25
  if (profile.experience && profile.experience.length > 0) score += 25
  if (profile.projects && profile.projects.length > 0) score += 25
  if (profile.skills?.languages && profile.skills.languages.length > 0) score += 25
  return score
}

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/')

  let profile: ProfileData | null = null
  try {
    const res = await fetchWithSession('/api/protected/profile')
    if (res.ok) {
      profile = await res.json()
    }
  } catch {
    profile = null
  }

  const firstName = session.user.name?.split(' ')[0] ?? 'there'
  const education = profile?.education ?? []
  const experience = profile?.experience ?? []
  const projects = profile?.projects ?? []
  const languages = profile?.skills?.languages ?? []
  const frameworks = profile?.skills?.frameworks ?? []
  const tools = profile?.skills?.tools ?? []
  const totalSkills = languages.length + frameworks.length + tools.length
  const completeness = calculateCompleteness(profile)

  return (
    <DashboardChatClient
      userName={firstName}
      stats={{ education: education.length, experience: experience.length, projects: projects.length, skills: totalSkills }}
      completeness={completeness}
    />
  )
}
