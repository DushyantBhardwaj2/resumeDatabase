import { SignInButton } from '@/components/sign-in-button'
import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="relative min-h-[100dvh] flex flex-col items-center justify-center overflow-hidden bg-bg">
      {/* Background Orb */}
      <div 
        className="fixed rounded-full pointer-events-none z-0 blur-[80px] animate-float"
        style={{
          top: '-20%',
          right: '-10%',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(22,163,74,0.06) 0%, transparent 70%)'
        }}
      />

      <main id="main-content" className="relative z-10 flex flex-col items-center justify-center p-8 w-full max-w-[600px] text-center">
        
        {/* Logo */}
        <div className="mb-3 animate-fade-up">
          <span className="inline-flex items-center gap-3 font-display font-semibold text-4xl tracking-tight text-fg">
            <span className="w-10 h-10 rounded-[var(--radius-sm)] bg-gradient-to-br from-[#16a34a] to-[#22c55e] inline-flex items-center justify-center text-lg text-white shadow-[0_0_20px_rgba(22,163,74,0.3)]">
              M
            </span>
            ResumeMint
          </span>
        </div>

        {/* Heading */}
        <h1 className="font-display font-semibold text-5xl leading-[1.1] tracking-tight mb-3 animate-fade-up-d1 text-fg">
          Resumes that <br/>get interviews
        </h1>

        {/* Subtitle */}
        <p className="text-content-muted text-base leading-relaxed max-w-[480px] mx-auto mb-8 animate-fade-up-d2">
          Chat-driven builder with live ATS scoring, smart tailoring per job description, and a glass workspace designed for focus.
        </p>

        {/* Call to Action */}
        <div className="mb-6 animate-fade-up-d2 flex flex-col items-center gap-3">
          <SignInButton />
          <Link
            href="/auth/login"
            className="text-xs text-content-muted hover:text-content underline underline-offset-2 transition-colors"
          >
            Sign in with email instead
          </Link>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-[520px] mx-auto perspective-[800px] animate-fade-up-d3">
          
          <Link href="/dashboard" className="glass card-lift p-6 rounded-[var(--radius-xl)] text-left flex flex-col gap-2.5 relative overflow-hidden group">
            <span className="w-10 h-10 rounded-[var(--radius-md)] bg-brand-light flex items-center justify-center shrink-0 text-brand">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="6" height="6" rx="1"/>
                <rect x="11" y="3" width="6" height="6" rx="1"/>
                <rect x="3" y="11" width="6" height="6" rx="1"/>
                <rect x="11" y="11" width="6" height="6" rx="1"/>
              </svg>
            </span>
            <div className="font-display font-semibold text-fg text-[15px] tracking-tight">Dashboard</div>
            <div className="text-content-muted text-xs leading-relaxed">Your workspace &amp; active projects</div>
          </Link>

          <Link href="/dashboard" className="glass card-lift p-6 rounded-[var(--radius-xl)] text-left flex flex-col gap-2.5 relative overflow-hidden group delay-75">
            <span className="w-10 h-10 rounded-[var(--radius-md)] bg-brand-light flex items-center justify-center shrink-0 text-brand">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6a2 2 0 012-2h3l1.5 2H17a1 1 0 011 1v7a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
              </svg>
            </span>
            <div className="font-display font-semibold text-fg text-[15px] tracking-tight">Career Vault</div>
            <div className="text-content-muted text-xs leading-relaxed">Chat to capture your experience</div>
          </Link>

          <Link href="/tailor" className="glass card-lift p-6 rounded-[var(--radius-xl)] text-left flex flex-col gap-2.5 relative overflow-hidden group delay-150">
            <span className="w-10 h-10 rounded-[var(--radius-md)] bg-brand-light flex items-center justify-center shrink-0 text-brand">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2.5a2.12 2.12 0 013 3L6 17l-4 1 1-4L14.5 2.5z"/>
              </svg>
            </span>
            <div className="font-display font-semibold text-fg text-[15px] tracking-tight">Tailor</div>
            <div className="text-content-muted text-xs leading-relaxed">Match your resume to any role</div>
          </Link>

        </div>

        {/* Features list */}
        <div className="mt-10 flex items-center justify-center gap-4 flex-wrap animate-fade-up-d4">
          <span className="flex items-center gap-1.5 text-xs text-content-muted">
            <span className="text-brand text-[8px]">&#9679;</span> Live ATS scoring
          </span>
          <span className="flex items-center gap-1.5 text-xs text-content-muted">
            <span className="text-brand text-[8px]">&#9679;</span> Per-job tailoring
          </span>
          <span className="flex items-center gap-1.5 text-xs text-content-muted">
            <span className="text-brand text-[8px]">&#9679;</span> Smart version tracking
          </span>
        </div>

      </main>
    </div>
  )
}
