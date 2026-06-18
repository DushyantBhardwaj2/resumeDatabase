import { getServerSession } from "@/config/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { container } from "@/di/container"
import { computeCompleteness, completenessColor, completenessBg, completenessHint } from "@/infrastructure/profile-utils"

export default async function DashboardPage() {
  const session = await getServerSession()
  if (!session) {
    redirect("/")
  }

  const profile = await container.profileUseCases.getProfile(session.user.id)

  if (!profile) {
    redirect("/onboarding")
  }

  const parsedProfile = profile as unknown as {
    contact: Record<string, unknown> | null
    education: Array<Record<string, unknown>> | null
    experience: Array<Record<string, unknown>> | null
    projects: Array<Record<string, unknown>> | null
    skills: Record<string, string[]> | null
  }

  const eduCount = parsedProfile.education?.length ?? 0
  const expCount = parsedProfile.experience?.length ?? 0
  const projCount = parsedProfile.projects?.length ?? 0
  const skillCount = parsedProfile.skills
    ? Object.values(parsedProfile.skills).reduce((sum, arr) => sum + arr.length, 0)
    : 0

  const completeness = computeCompleteness(parsedProfile)

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome back, {session.user.name?.split(" ")[0] ?? "there"}
            </h1>
            <p className="mt-1 text-muted-foreground">
              Here&apos;s your profile at a glance.
            </p>
          </div>
          <Link
            href="/dashboard/profile"
            className="inline-flex h-10 items-center rounded-full bg-primary px-5 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
          >
            Edit Profile
          </Link>
        </div>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium">Profile Completeness</span>
            <span className={completenessColor(completeness)}>
              {completeness}%
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full transition-all ${completenessBg(completeness)}`}
              style={{ width: `${completeness}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{completenessHint(completeness)}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Education"
          count={eduCount}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" />
            </svg>
          }
        />
        <SummaryCard
          label="Experience"
          count={expCount}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0" />
            </svg>
          }
        />
        <SummaryCard
          label="Projects"
          count={projCount}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 0 0 4.5 4.5H18a3.75 3.75 0 0 0 1.332-7.257 3 3 0 0 0-3.758-3.848 5.25 5.25 0 0 0-10.233 2.33A4.502 4.502 0 0 0 2.25 15Z" />
            </svg>
          }
        />
        <SummaryCard
          label="Skills"
          count={skillCount}
          icon={
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281Z" />
            </svg>
          }
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ActionCard
          title="Edit Profile"
          description="Update your education, experience, projects, and skills"
          href="/dashboard/profile"
        />
        <ActionCard
          title="Tailor Resume"
          description="Generate an ATS-optimized resume for any job"
          href="/tailor"
          disabled
        />
      </div>
    </div>
  )
}

function SummaryCard({
  label,
  count,
  icon,
}: {
  label: string
  count: number
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <p className="text-2xl font-bold">{count}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}

function ActionCard({
  title,
  description,
  href,
  disabled,
}: {
  title: string
  description: string
  href: string
  disabled?: boolean
}) {
  return (
    <a
      href={disabled ? undefined : href}
      className={`block rounded-2xl border border-border bg-card p-6 shadow-sm transition-all ${
        disabled
          ? "cursor-not-allowed opacity-50"
          : "hover:shadow-md hover:border-primary/30"
      }`}
    >
      <h3 className="font-semibold text-card-foreground">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </a>
  )
}
