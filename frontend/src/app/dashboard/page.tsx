import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { serverApi } from '@/config/api-client-server'
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
    phone?: string | null
    linkedin?: string | null
    github?: string | null
    portfolio?: string | null
  }
}

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/')

  let profile: ProfileData & { completeness?: number } | null = null
  try {
    const res = await serverApi.api.protected.profile.$get()
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
  const completeness = profile?.completeness ?? 0

  return (
    <DashboardChatClient
      userName={firstName}
      stats={{ education: education.length, experience: experience.length, projects: projects.length, skills: totalSkills }}
      completeness={completeness}
    />
  )
}
