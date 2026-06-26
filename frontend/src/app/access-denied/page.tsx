import { ShieldWarning } from '@phosphor-icons/react/dist/ssr'
import Link from 'next/link'

export default function AccessDeniedPage() {
  return (
    <div className="min-h-[100dvh] bg-surface flex items-center justify-center px-6">
      <div className="max-w-md text-center animate-fade-up">
        <div className="w-14 h-14 rounded-[var(--radius-xl)] bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 flex items-center justify-center mx-auto mb-6">
          <ShieldWarning size={26} className="text-red-500" weight="regular" />
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-content">Access Restricted</h1>
        <p className="text-content-muted text-sm mt-3 leading-relaxed">
          Resumint is currently available exclusively for NSUT students and alumni.
          Please sign in with your <span className="font-medium text-content">@nsut.ac.in</span> email address.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-brand text-brand-fg rounded-[var(--radius-md)] px-5 py-2.5 text-sm font-medium mt-8 hover:opacity-90 transition-opacity"
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
}
