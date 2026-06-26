'use client'

import { useBuilderStore } from '@/store/useBuilderStore'

interface TailoringChecklistWidgetProps {
  projectId?: string
}

export function TailoringChecklistWidget({ projectId }: TailoringChecklistWidgetProps) {
  const profile = useBuilderStore((s) => s.profile)
  const selectedIds = useBuilderStore((s) =>
    projectId ? s.selectedBulletIds[projectId] || [] : []
  )
  const toggleBullet = useBuilderStore((s) => s.toggleBullet)

  if (projectId && profile) {
    const project = profile.projects.find((p) => p.id === projectId)
    if (!project) return null

    return (
      <div className="mt-4 border border-edge rounded-lg bg-surface-subtle p-3">
        <h4 className="font-semibold text-sm mb-2 text-content">{project.title}</h4>
        <div className="space-y-2">
          {project.vaultBullets.map((bullet) => {
            const isSelected = selectedIds.includes(bullet.id)
            return (
              <label
                key={bullet.id}
                className="flex items-start gap-2 cursor-pointer group p-1 rounded hover:bg-muted-bg transition-colors"
              >
                <input
                  type="checkbox"
                  className="mt-1 accent-brand h-4 w-4 rounded border-edge-strong transition-all"
                  checked={isSelected}
                  onChange={() => toggleBullet(projectId, bullet.id)}
                />
                <span
                  className={`text-sm leading-relaxed transition-colors ${
                    isSelected
                      ? 'text-content font-medium'
                      : 'text-content-muted group-hover:text-content'
                  }`}
                >
                  {bullet.text}
                </span>
              </label>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="mt-3 border border-edge rounded-lg bg-surface-subtle p-4 text-center text-sm text-content-muted">
      <p>Select the bullets that best match your target role.</p>
      <p className="text-xs mt-1">Use the checklist above to customize your resume.</p>
    </div>
  )
}
