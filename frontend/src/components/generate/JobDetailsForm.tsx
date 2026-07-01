import { useBuilderStore } from '@/store/useBuilderStore'
import type { TemplateType } from '@/store/useBuilderStore'

const TEMPLATES: { value: TemplateType; label: string }[] = [
  { value: 'nsut-canonical', label: 'NSUT Canonical' },
  { value: 'ats-clean', label: 'ATS Clean' },
  { value: 'modern', label: 'Modern' },
  { value: 'compact', label: 'Compact' },
]

export function JobDetailsForm() {
  const jobTitle = useBuilderStore((s) => s.jobTitle)
  const company = useBuilderStore((s) => s.company)
  const template = useBuilderStore((s) => s.template)
  
  const setJobTitle = useBuilderStore((s) => s.setJobTitle)
  const setCompany = useBuilderStore((s) => s.setCompany)
  const setTemplate = useBuilderStore((s) => s.setTemplate)

  return (
    <div className="ml-11">
      <div className="bg-card border border-edge rounded-[var(--radius-md)] p-4 space-y-3 max-w-md">
        <p className="text-xs font-medium text-content">Job Details</p>
        <div>
          <label className="text-[11px] text-content-muted block mb-1">Job Title</label>
          <input
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="e.g. Senior Software Engineer"
            className="w-full h-8 bg-muted-bg border border-edge rounded-[var(--radius-sm)] px-2.5 text-sm text-content placeholder:text-content-subtle outline-none focus:border-brand transition-colors"
          />
        </div>
        <div>
          <label className="text-[11px] text-content-muted block mb-1">Company</label>
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g. Acme Corp"
            className="w-full h-8 bg-muted-bg border border-edge rounded-[var(--radius-sm)] px-2.5 text-sm text-content placeholder:text-content-subtle outline-none focus:border-brand transition-colors"
          />
        </div>
        <div>
          <label className="text-[11px] text-content-muted block mb-1">Template</label>
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value as TemplateType)}
            className="w-full h-8 bg-muted-bg border border-edge rounded-[var(--radius-sm)] px-2.5 text-sm text-content outline-none focus:border-brand transition-colors"
          >
            {TEMPLATES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
