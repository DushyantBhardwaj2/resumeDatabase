import Link from 'next/link'
import { ArrowRight, Target, Sparkle, ShieldCheck } from '@phosphor-icons/react/dist/ssr'
import { ThemeToggle } from '@/components/theme-toggle'

export default function LandingPage() {
  return (
    <div className="min-h-[100dvh] bg-surface">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur border-b border-edge/50">
        <div className="max-w-6xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
          <span className="font-display font-bold text-content text-lg tracking-tight">
            resumint
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500 ml-0.5 mb-2 align-middle" />
          </span>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/api/auth/signin"
              className="bg-brand text-brand-fg px-4 py-2 rounded-[var(--radius-md)] text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="min-h-[calc(100dvh-4rem)] flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto px-6 lg:px-12 py-20 w-full">
          {/* Left */}
          <div className="animate-fade-up">
            <span className="inline-flex items-center gap-1.5 bg-brand-light text-brand text-xs font-medium px-3 py-1 rounded-full border border-brand/20 mb-6">
              For NSUT students &amp; alumni
            </span>

            <h1 className="text-5xl lg:text-6xl font-display font-bold tracking-tight text-content leading-[1.1]">
              Resumes tailored.
              <br />
              <span className="text-brand">Opportunities</span> unlocked.
            </h1>

            <p className="mt-6 text-lg text-content-muted max-w-lg leading-relaxed">
              Role-specific resumes built by AI that understand your profile. Get past ATS, get noticed.
            </p>

            <div className="mt-10">
              <Link
                href="/api/auth/signin"
                className="bg-brand text-brand-fg rounded-[var(--radius-md)] px-6 py-3 font-medium text-sm inline-flex items-center gap-2 hover:opacity-90 transition-opacity"
              >
                Sign in with Google
                <ArrowRight size={16} />
              </Link>
              <p className="text-xs text-content-subtle mt-3">
                Restricted to @nsut.ac.in email addresses
              </p>
            </div>
          </div>

          {/* Right: App Preview Mockup */}
          <div className="animate-fade-up delay-200 hidden lg:block">
            <div className="rounded-[var(--radius-2xl)] border border-edge shadow-[var(--shadow-xl)] overflow-hidden bg-card w-full aspect-[4/3]">
              {/* Top bar */}
              <div className="h-10 bg-muted-bg border-b border-edge flex items-center px-4 gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
              </div>

              {/* Body */}
              <div className="flex h-[calc(100%-2.5rem)]">
                {/* Sidebar strip */}
                <div className="w-40 bg-surface border-r border-edge p-3 flex flex-col gap-1">
                  <p className="text-xs font-display font-bold text-content mb-2">resumint</p>
                  <div className="bg-brand-light text-brand rounded-[var(--radius-sm)] px-2 py-1.5 text-[10px]">
                    Dashboard
                  </div>
                  <div className="text-content-muted rounded-[var(--radius-sm)] px-2 py-1.5 text-[10px]">
                    My Resumes
                  </div>
                  <div className="text-content-muted rounded-[var(--radius-sm)] px-2 py-1.5 text-[10px]">
                    Tailor Resume
                  </div>
                  <div className="text-content-muted rounded-[var(--radius-sm)] px-2 py-1.5 text-[10px]">
                    ATS Score
                  </div>
                </div>

                {/* Content area */}
                <div className="flex-1 p-4 bg-surface">
                  <p className="text-xs font-medium text-content mb-3">Good to see you, Student</p>

                  {/* Fake stat cards */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-card border border-edge rounded-[var(--radius-md)] p-3">
                      <p className="text-[10px] text-content-muted">Resumes</p>
                      <p className="text-sm font-display font-bold text-content mt-0.5">4</p>
                    </div>
                    <div className="bg-card border border-edge rounded-[var(--radius-md)] p-3">
                      <p className="text-[10px] text-content-muted">ATS Score</p>
                      <p className="text-sm font-display font-bold text-content mt-0.5">87%</p>
                    </div>
                  </div>

                  {/* Fake progress bar */}
                  <div className="bg-card border border-edge rounded-[var(--radius-md)] p-3">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-[10px] text-content-muted">Profile Completeness</p>
                      <p className="text-[10px] text-brand font-medium">75%</p>
                    </div>
                    <div className="h-1.5 bg-muted-bg rounded-full overflow-hidden">
                      <div className="h-full w-3/4 bg-brand rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl font-display font-bold tracking-tight text-content text-center mb-4">
          Everything you need
        </h2>
        <p className="text-content-muted text-center mb-16">
          From profile to placement — all in one focused tool.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="bg-card border border-edge rounded-[var(--radius-xl)] p-6 animate-fade-up">
            <div className="bg-brand-light p-3 rounded-[var(--radius-md)] text-brand w-fit mb-4">
              <Target size={20} />
            </div>
            <h3 className="font-display font-semibold text-lg text-content">Role Focused</h3>
            <p className="text-content-muted text-sm mt-2 leading-relaxed">
              Tailored for every job you apply to. No more generic one-size-fits-all.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-card border border-edge rounded-[var(--radius-xl)] p-6 animate-fade-up" style={{ animationDelay: '100ms' }}>
            <div className="bg-brand-light p-3 rounded-[var(--radius-md)] text-brand w-fit mb-4">
              <Sparkle size={20} />
            </div>
            <h3 className="font-display font-semibold text-lg text-content">Fast &amp; Effortless</h3>
            <p className="text-content-muted text-sm mt-2 leading-relaxed">
              AI understands your profile and generates in seconds.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-card border border-edge rounded-[var(--radius-xl)] p-6 animate-fade-up" style={{ animationDelay: '200ms' }}>
            <div className="bg-brand-light p-3 rounded-[var(--radius-md)] text-brand w-fit mb-4">
              <ShieldCheck size={20} />
            </div>
            <h3 className="font-display font-semibold text-lg text-content">ATS Optimized</h3>
            <p className="text-content-muted text-sm mt-2 leading-relaxed">
              Higher ATS scores. Better chances at getting that call.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-edge px-6">
        <div className="flex justify-between items-center max-w-6xl mx-auto text-sm text-content-subtle">
          <span>© 2025 Resumint</span>
          <span>Built for NSUT</span>
        </div>
      </footer>
    </div>
  )
}
