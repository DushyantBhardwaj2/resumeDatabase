import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { UserCircle, ArrowUpRight } from '@phosphor-icons/react/dist/ssr'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import fetchWithSession from '@/lib/fetch'

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

function getCompletenessHint(pct: number): string {
  if (pct <= 25) return 'Add your education to get started.'
  if (pct <= 50) return 'Add work experience to strengthen your profile.'
  if (pct <= 75) return 'Add projects to showcase your work.'
  if (pct <= 99) return 'Add your skills to complete your profile.'
  return 'Your profile is complete. Ready to tailor!'
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
  const hint = getCompletenessHint(completeness)

  return (
    <div className="px-6 lg:px-10 py-8 max-w-5xl">
      {/* Page header */}
      <div className="mb-8 animate-fade-up">
        <h1 className="text-2xl font-display font-bold text-content">
          Good to see you, {firstName}
        </h1>
        <p className="text-content-muted text-sm mt-1">Your resume toolkit is ready.</p>
      </div>

      {/* Profile completeness card */}
      <div className="bg-card border border-edge rounded-[var(--radius-xl)] p-6 mb-6 animate-fade-up delay-100">
        <div className="flex items-center justify-between">
          <span className="font-display font-semibold text-content">Profile Completeness</span>
          <span className="text-brand font-mono text-sm">{completeness}%</span>
        </div>
        <div className="mt-3">
          <Progress value={completeness} />
        </div>
        <p className="text-xs text-content-subtle mt-2">{hint}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-fade-up delay-150">
        <div className="bg-card border border-edge rounded-[var(--radius-lg)] p-4">
          <p className="font-display text-2xl font-bold text-content font-mono">
            {education.length}
          </p>
          <p className="text-sm text-content-muted mt-0.5">Education</p>
        </div>
        <div className="bg-card border border-edge rounded-[var(--radius-lg)] p-4">
          <p className="font-display text-2xl font-bold text-content font-mono">
            {experience.length}
          </p>
          <p className="text-sm text-content-muted mt-0.5">Experience</p>
        </div>
        <div className="bg-card border border-edge rounded-[var(--radius-lg)] p-4">
          <p className="font-display text-2xl font-bold text-content font-mono">
            {projects.length}
          </p>
          <p className="text-sm text-content-muted mt-0.5">Projects</p>
        </div>
        <div className="bg-card border border-edge rounded-[var(--radius-lg)] p-4">
          <p className="font-display text-2xl font-bold text-content font-mono">
            {totalSkills}
          </p>
          <p className="text-sm text-content-muted mt-0.5">Skills</p>
        </div>
      </div>

      {/* Quick action cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-up delay-200">
        {/* Edit Profile */}
        <div className="bg-card border border-edge rounded-[var(--radius-xl)] p-6">
          <div className="w-10 h-10 rounded-[var(--radius-md)] bg-brand-light flex items-center justify-center mb-4">
            <UserCircle size={28} className="text-brand" />
          </div>
          <h2 className="font-display font-semibold text-content">Edit Profile</h2>
          <p className="text-content-muted text-sm mt-1">
            Keep your profile up to date for the best tailoring results.
          </p>
          <Link
            href="/dashboard/profile"
            className="border border-edge rounded-[var(--radius-md)] px-4 py-2 text-sm text-content hover:bg-surface inline-block mt-4 transition-colors"
          >
            Open Profile
          </Link>
        </div>

        {/* Tailor Resume */}
        <div className="bg-card border border-edge rounded-[var(--radius-xl)] p-6">
          <div className="w-10 h-10 rounded-[var(--radius-md)] bg-brand-light flex items-center justify-center mb-4">
            <ArrowUpRight size={28} className="text-brand" />
          </div>
          <h2 className="font-display font-semibold text-content">Tailor Resume</h2>
          <p className="text-content-muted text-sm mt-1">
            AI tailors your resume for any job in seconds.
          </p>
          <Link
            href="/tailor"
            className="bg-brand text-brand-fg rounded px-4 py-2 text-sm font-medium inline-block mt-4 hover:opacity-90 transition-opacity"
          >
            Start Tailoring
          </Link>
        </div>
      </div>
    </div>
  )
}
