import { redirect } from 'next/navigation'
import { serverApi, getServerSession } from '@/config/api-client-server'
import { DashboardWelcomeWidget } from '@/components/chat/widgets/DashboardWelcomeWidget'
import { DashboardStatsWidget } from '@/components/chat/widgets/DashboardStatsWidget'
import { DashboardCompletenessWidget } from '@/components/chat/widgets/DashboardCompletenessWidget'
import { DashboardQuickActionsWidget } from '@/components/chat/widgets/DashboardQuickActionsWidget'

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
  const session = await getServerSession()
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
    <div className="p-8 max-w-[1200px] mx-auto w-full h-full flex flex-col gap-6">
      
      {/* Welcome Area */}
      <div className="animate-fade-up">
        <DashboardWelcomeWidget name={firstName} />
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Vault Stats */}
        <div className="animate-fade-up-d1">
          <DashboardStatsWidget 
            education={education.length} 
            experience={experience.length} 
            projects={projects.length} 
            skills={totalSkills} 
          />
        </div>

        {/* Profile Completeness */}
        <div className="animate-fade-up-d2">
          <DashboardCompletenessWidget percent={completeness} />
        </div>

        {/* ATS Score */}
        <div className="animate-fade-up-d3">
          <AtsWidget />
        </div>

      </div>

      {/* Quick Actions */}
      <div className="animate-fade-up-d4 mt-2">
        <DashboardQuickActionsWidget />
      </div>

    </div>
  )
}

function AtsWidget() {
  return (
    <div className="glass card-lift h-full p-6 rounded-[var(--radius-xl)] flex flex-col relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-brand/10 transition-colors duration-500"></div>
      
      <div className="flex items-center gap-3 mb-4 relative z-10">
        <div className="w-10 h-10 rounded-[var(--radius-md)] bg-brand-light flex items-center justify-center text-brand">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 2L2 6l8 4 8-4-8-4z"/>
            <path d="M2 14l8 4 8-4"/>
            <path d="M2 10l8 4 8-4"/>
          </svg>
        </div>
        <div>
          <h3 className="font-display font-semibold text-fg tracking-tight text-[15px]">Avg. ATS Score</h3>
          <p className="text-[11px] text-content-muted font-medium">Across all tailored resumes</p>
        </div>
      </div>
      
      <div className="mt-auto relative z-10 flex items-end gap-3">
        <div className="font-display font-bold text-4xl tracking-tight text-fg leading-none">82<span className="text-xl text-content-muted">%</span></div>
        <div className="flex items-center gap-1 text-[11px] font-medium text-success bg-success-soft px-2 py-0.5 rounded-full mb-1">
          <svg width="10" height="10" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 7l-5 5-2-2"/>
          </svg>
          Top Tier
        </div>
      </div>

      <div className="mt-4 w-full h-1.5 bg-muted rounded-full overflow-hidden relative z-10">
        <div className="h-full bg-brand rounded-full relative" style={{ animation: 'ats-grow 1s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
          <div className="absolute top-0 right-0 bottom-0 w-10 bg-gradient-to-r from-transparent to-white/30 animate-shimmer"></div>
        </div>
      </div>
    </div>
  )
}
