import { Briefcase } from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'

export default function RolesPage() {
  return (
    <div className="px-6 lg:px-10 py-16 max-w-lg">
      <div className="animate-fade-up">
        <div className="w-12 h-12 rounded-[var(--radius-lg)] bg-muted-bg border border-edge flex items-center justify-center mb-6">
          <Briefcase size={22} className="text-content-muted" weight="regular" />
        </div>
        <span className="inline-flex items-center bg-brand-light text-brand text-xs font-medium px-2.5 py-1 rounded-full border border-brand/20 mb-4">
          Coming soon
        </span>
        <h1 className="font-display text-2xl font-bold tracking-tight text-content">Saved Roles</h1>
        <p className="text-content-muted mt-2 text-sm leading-relaxed">
          Bookmark job roles and track your tailoring history per role.
        </p>
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-brand font-medium mt-6 hover:underline">
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}
