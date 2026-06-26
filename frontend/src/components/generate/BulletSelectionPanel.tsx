'use client'

import { useCallback } from 'react'
import { useBuilderStore } from '@/store/useBuilderStore'
import { CheckSquare, Square } from '@phosphor-icons/react'

export function BulletSelectionPanel() {
  const profile = useBuilderStore((s) => s.profile)
  const selectedBulletIds = useBuilderStore((s) => s.selectedBulletIds)
  const toggleBullet = useBuilderStore((s) => s.toggleBullet)
  const setSelections = useBuilderStore((s) => s.setSelections)
  const status = useBuilderStore((s) => s.status)

  const selectAll = useCallback(() => {
    if (!profile) return
    const all: Record<string, string[]> = {}
    for (const exp of profile.experience) {
      all[exp.id] = exp.vaultBullets.map((b) => b.id)
    }
    for (const proj of profile.projects) {
      all[proj.id] = proj.vaultBullets.map((b) => b.id)
    }
    setSelections(all)
  }, [profile, setSelections])

  const deselectAll = useCallback(() => {
    if (!profile) return
    const empty: Record<string, string[]> = {}
    for (const exp of profile.experience) {
      empty[exp.id] = []
    }
    for (const proj of profile.projects) {
      empty[proj.id] = []
    }
    setSelections(empty)
  }, [profile, setSelections])

  if (status === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6">
        <p className="text-sm text-content-muted">Enter job details and click <span className="font-medium text-content">Create Resume</span></p>
        <p className="text-xs text-content-subtle mt-1">Tailored bullets will appear here for you to review and select.</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-content-muted">No profile loaded.</p>
      </div>
    )
  }

  const totalBullets = [...profile.experience, ...profile.projects].reduce(
    (sum, item) => sum + item.vaultBullets.length, 0
  )
  const selectedCount = Object.values(selectedBulletIds).reduce(
    (sum, ids) => sum + ids.length, 0
  )

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="text-xs font-semibold tracking-widest text-content-subtle uppercase">
          Bullet Points
        </h2>
        <span className="text-xs text-content-muted">
          {selectedCount} / {totalBullets} selected
        </span>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={selectAll}
          className="text-xs px-3 py-1.5 rounded-[var(--radius-md)] bg-surface border border-edge text-content-muted hover:text-content hover:bg-surface-subtle transition-colors"
        >
          Select All
        </button>
        <button
          onClick={deselectAll}
          className="text-xs px-3 py-1.5 rounded-[var(--radius-md)] bg-surface border border-edge text-content-muted hover:text-content hover:bg-surface-subtle transition-colors"
        >
          Deselect All
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-5 pr-1">
        {/* Experience section */}
        {profile.experience.length > 0 && (
          <div>
            <h3 className="text-[10px] font-semibold tracking-widest text-brand uppercase mb-2">
              Experience
            </h3>
            <div className="space-y-3">
              {profile.experience.map((exp) => (
                <BulletGroup
                  key={exp.id}
                  id={exp.id}
                  heading={`${exp.role} — ${exp.company}`}
                  bullets={exp.vaultBullets}
                  selectedIds={selectedBulletIds[exp.id] || []}
                  onToggle={toggleBullet}
                />
              ))}
            </div>
          </div>
        )}

        {/* Projects section */}
        {profile.projects.length > 0 && (
          <div>
            <h3 className="text-[10px] font-semibold tracking-widest text-brand uppercase mb-2">
              Projects
            </h3>
            <div className="space-y-3">
              {profile.projects.map((proj) => (
                <BulletGroup
                  key={proj.id}
                  id={proj.id}
                  heading={proj.title}
                  bullets={proj.vaultBullets}
                  selectedIds={selectedBulletIds[proj.id] || []}
                  onToggle={toggleBullet}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function BulletGroup({
  id,
  heading,
  bullets,
  selectedIds,
  onToggle,
}: {
  id: string
  heading: string
  bullets: Array<{ id: string; text: string }>
  selectedIds: string[]
  onToggle: (itemId: string, bulletId: string) => void
}) {
  return (
    <div className="bg-white dark:bg-[#1a1d23] border border-edge rounded-[var(--radius-md)] overflow-hidden">
      <div className="px-3 py-2 bg-surface border-b border-edge">
        <p className="text-xs font-medium text-content truncate">{heading}</p>
        <p className="text-[10px] text-content-subtle">{selectedIds.length}/{bullets.length} selected</p>
      </div>
      <div className="divide-y divide-edge">
        {bullets.map((bullet) => {
          const isSelected = selectedIds.includes(bullet.id)
          return (
            <button
              key={bullet.id}
              onClick={() => onToggle(id, bullet.id)}
              className="w-full flex items-start gap-2.5 px-3 py-2 text-left hover:bg-surface-subtle transition-colors"
            >
              {isSelected ? (
                <CheckSquare size={16} className="text-brand shrink-0 mt-0.5" weight="fill" />
              ) : (
                <Square size={16} className="text-content-subtle shrink-0 mt-0.5" />
              )}
              <span className={`text-xs leading-relaxed ${isSelected ? 'text-content' : 'text-content-muted'}`}>
                {bullet.text}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
