'use client'

import { Lightbulb } from '@phosphor-icons/react'

const tips = [
  {
    title: 'Be Specific in Job Descriptions',
    body: 'Include concrete technologies, methodologies, and outcomes. Vague descriptions lead to generic bullet points.',
  },
  {
    title: 'Use the STAR Method',
    body: 'Situation, Task, Action, Result — frame your experience bullet points around measurable impact.',
  },
  {
    title: 'Toggle Strategically',
    body: 'Not every bullet belongs on every resume. Curate your best points that match what the job asks for.',
  },
  {
    title: 'ATS Keywords Matter',
    body: 'Applicant Tracking Systems scan for role-specific keywords. Review the JD and ensure your resume mirrors its language.',
  },
  {
    title: 'Keep It One Page',
    body: 'For most roles, a single-page resume is ideal. Our templates are optimized for density without clutter.',
  },
  {
    title: 'Update Your Profile First',
    body: 'Before generating a tailored resume, make sure your profile is complete in the Profile Builder.',
  },
]

export default function TipsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-9 w-9 rounded-full bg-brand-light flex items-center justify-center">
          <Lightbulb size={18} className="text-brand" weight="fill" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight text-content">
            Tips
          </h1>
          <p className="text-sm text-content-muted">Get the most out of resume building</p>
        </div>
      </div>

      <div className="space-y-4">
        {tips.map((tip) => (
          <div
            key={tip.title}
            className="bg-white dark:bg-[#1a1d23] border border-edge rounded-[var(--radius-md)] p-4"
          >
            <h3 className="text-sm font-semibold text-content mb-1">{tip.title}</h3>
            <p className="text-xs text-content-muted leading-relaxed">{tip.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
