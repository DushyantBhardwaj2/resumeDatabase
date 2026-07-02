'use client'

import { Layout, FileText, Briefcase, GraduationCap, Code } from '@phosphor-icons/react'
import Link from 'next/link'
import { ChromaGrid } from '@/components/ui/chroma-grid'

interface TemplateItem {
  id: string
  name: string
  description: string
  icon: React.ElementType
  badge?: string
}

const TEMPLATES: TemplateItem[] = [
  { id: 'classic', name: 'Classic', description: 'Clean & traditional layout', icon: FileText },
  { id: 'modern', name: 'Modern', description: 'Sleek & contemporary design', icon: Layout, badge: 'Popular' },
  { id: 'technical', name: 'Technical', description: 'Optimized for engineering roles', icon: Code },
  { id: 'executive', name: 'Executive', description: 'Polished for senior positions', icon: Briefcase },
  { id: 'academic', name: 'Academic', description: 'Ideal for research & education', icon: GraduationCap },
  { id: 'minimal', name: 'Minimal', description: 'Less is more — minimalist design', icon: Layout },
]

export default function TemplatesPage() {
  return (
    <div className="px-6 lg:px-10 py-16 max-w-5xl">
      <div className="animate-fade-up mb-10">
        <div className="w-12 h-12 rounded-[var(--radius-lg)] bg-muted-bg border border-edge flex items-center justify-center mb-6">
          <Layout size={22} className="text-content-muted" weight="regular" />
        </div>
        <span className="inline-flex items-center bg-brand-light text-brand text-xs font-medium px-2.5 py-1 rounded-full border border-brand/20 mb-4">
          Coming soon
        </span>
        <h1 className="font-display text-2xl font-bold tracking-tight text-content">Resume Templates</h1>
        <p className="text-content-muted mt-2 text-sm leading-relaxed max-w-lg">
          Choose from professionally designed templates to match any industry.
        </p>
      </div>

      <ChromaGrid items={TEMPLATES} columns={3} renderItem={(template) => {
        const Icon = template.icon
        return (
          <div className="p-5">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-muted-bg flex items-center justify-center mb-3">
              <Icon size={20} className="text-content-muted" weight="regular" />
            </div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-display text-base font-semibold text-content">{template.name}</h3>
              {template.badge && (
                <span className="text-[10px] font-medium text-brand bg-brand-light px-1.5 py-0.5 rounded-full">
                  {template.badge}
                </span>
              )}
            </div>
            <p className="text-sm text-content-muted">{template.description}</p>
          </div>
        )
      }} />

      <div className="mt-10">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-brand font-medium hover:underline">
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}
