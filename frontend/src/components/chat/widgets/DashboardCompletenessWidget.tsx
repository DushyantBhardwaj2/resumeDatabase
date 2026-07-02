'use client'

interface DashboardCompletenessWidgetProps {
  percent: number
}

function getHint(pct: number): string {
  if (pct <= 25) return 'Add your education to get started.'
  if (pct <= 50) return 'Add work experience to strengthen your profile.'
  if (pct <= 75) return 'Add projects to showcase your work.'
  if (pct <= 99) return 'Add your skills to complete your profile.'
  return 'Your profile is complete. Ready to tailor!'
}

export function DashboardCompletenessWidget({ percent }: DashboardCompletenessWidgetProps) {
  return (
    <div className="glass card-lift h-full p-6 rounded-[var(--radius-xl)] flex flex-col relative overflow-hidden">
      
      {/* Background Pulse Glow */}
      <div className="absolute top-1/2 left-1/2 w-[120%] h-[120%] bg-brand/5 rounded-full blur-[40px] -translate-x-1/2 -translate-y-1/2 pointer-events-none animate-pulse-glow"></div>

      <div className="flex items-center justify-between mb-2 relative z-10">
        <h3 className="font-display text-base text-fg font-semibold m-0">Completeness</h3>
        <span className="bg-brand/10 text-brand text-xs font-semibold px-2 py-0.5 rounded-full font-mono">{percent}%</span>
      </div>

      <p className="text-xs text-content-muted relative z-10">{getHint(percent)}</p>

      {/* Progress Circle Container */}
      <div className="flex-1 flex items-center justify-center mt-4 relative z-10">
        <div className="relative w-28 h-28 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-edge" />
            <circle 
              cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" 
              className="text-brand drop-shadow-[0_0_8px_rgba(22,163,74,0.5)] transition-all duration-1000 ease-out"
              strokeDasharray="282.7"
              strokeDashoffset={282.7 - (282.7 * percent) / 100}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <span className="font-display font-bold text-2xl text-fg">{percent}%</span>
          </div>
        </div>
      </div>

    </div>
  )
}
