interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-[100dvh] flex">
      {/* ── Left: form panel ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-[100dvh] bg-surface">
        {/* Logo */}
        <div className="px-8 lg:px-16 py-8">
          <a
            href="/"
            className="font-display font-bold text-xl text-content inline-flex items-center gap-1"
          >
            resumint
            <span className="w-1.5 h-1.5 rounded-full bg-brand inline-block mb-1 ml-0.5" aria-hidden="true" />
          </a>
        </div>

        {/* Form content */}
        <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 pb-16">
          {children}
        </div>
      </div>

      {/* ── Right: visual panel (desktop only) ─────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] lg:flex-col lg:items-center lg:justify-center bg-[#0C0C0E] relative overflow-hidden sticky top-0 h-screen">
        {/* Radial green glow */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-96 h-96 rounded-full bg-emerald-500/8 blur-3xl" />
        </div>

        {/* Mascot */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://pub.hyperagent.com/api/published/pbf01KVTPK7FD_SR5361NVA73GMYJB/cb659cfe-7343-4420-82bc-7872de735cff.png"
          alt="Resumint mascot"
          className="relative z-10 w-56 h-56 object-contain drop-shadow-2xl"
        />

        {/* Tagline */}
        <p className="relative z-10 text-white/70 text-sm font-medium mt-5 text-center px-8">
          Built for students who mean business
        </p>

        {/* Feature chips */}
        <div className="relative z-10 flex flex-wrap justify-center gap-2 mt-4 px-8">
          {['ATS Optimized', 'Role Specific', 'AI Powered'].map((chip) => (
            <span
              key={chip}
              className="px-3 py-1 rounded-full text-xs font-medium text-white/60 border border-white/10 bg-white/5"
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export { AuthLayout }
