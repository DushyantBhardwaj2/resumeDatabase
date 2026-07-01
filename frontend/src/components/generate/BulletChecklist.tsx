import { useCallback } from 'react'
import { useBuilderStore } from '@/store/useBuilderStore'
import { ArrowClockwise, CheckSquare, Square } from '@phosphor-icons/react'

export function BulletChecklist() {
  const profile = useBuilderStore((s) => s.profile)
  const selectedBulletIds = useBuilderStore((s) => s.selectedBulletIds)
  const status = useBuilderStore((s) => s.status)
  const setSelections = useBuilderStore((s) => s.setSelections)
  const toggleBullet = useBuilderStore((s) => s.toggleBullet)

  const handleSelectAll = useCallback(() => {
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

  const handleDeselectAll = useCallback(() => {
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

  const totalBullets = profile
    ? [...profile.experience, ...profile.projects].reduce((s, i) => s + i.vaultBullets.length, 0)
    : 0
  const selectedCount = Object.values(selectedBulletIds).reduce((s, ids) => s + ids.length, 0)

  return (
    <div className="ml-11">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-content">
          Select bullets to include
        </p>
        <span className="text-[10px] text-content-muted">
          {selectedCount} / {totalBullets} selected
        </span>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={handleSelectAll}
          className="text-[10px] px-2.5 py-1 rounded-[var(--radius-sm)] bg-surface border border-edge text-content-muted hover:text-content transition-colors"
        >
          Select All
        </button>
        <button
          onClick={handleDeselectAll}
          className="text-[10px] px-2.5 py-1 rounded-[var(--radius-sm)] bg-surface border border-edge text-content-muted hover:text-content transition-colors"
        >
          Deselect All
        </button>
        {status === 'compiling' && (
          <span className="flex items-center gap-1.5 text-[10px] text-content-muted ml-auto">
            <ArrowClockwise size={10} className="animate-spin" />
            Updating preview...
          </span>
        )}
      </div>
      {profile && (
        <div className="space-y-3">
          {profile.experience.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold tracking-widest text-brand uppercase mb-1.5">Experience</p>
              {profile.experience.map((exp) => (
                <ChecklistGroup
                  key={exp.id}
                  id={exp.id}
                  heading={`${exp.role} — ${exp.company}`}
                  bullets={exp.vaultBullets}
                  selectedIds={selectedBulletIds[exp.id] || []}
                  onToggle={toggleBullet}
                />
              ))}
            </div>
          )}
          {profile.projects.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold tracking-widest text-brand uppercase mb-1.5">Projects</p>
              {profile.projects.map((proj) => (
                <ChecklistGroup
                  key={proj.id}
                  id={proj.id}
                  heading={proj.title}
                  bullets={proj.vaultBullets}
                  selectedIds={selectedBulletIds[proj.id] || []}
                  onToggle={toggleBullet}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ChecklistGroup({
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
    <div className="bg-card border border-edge rounded-[var(--radius-md)] overflow-hidden mb-2">
      <div className="px-3 py-2 bg-surface border-b border-edge flex items-center justify-between">
        <p className="text-xs font-medium text-content truncate">{heading}</p>
        <span className="text-[10px] text-content-muted shrink-0 ml-2">{selectedIds.length}/{bullets.length}</span>
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
                <CheckSquare size={14} className="text-brand shrink-0 mt-0.5" weight="fill" />
              ) : (
                <Square size={14} className="text-content-subtle shrink-0 mt-0.5" />
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
