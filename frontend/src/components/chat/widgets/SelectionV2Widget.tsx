'use client'

import { useState, useMemo } from 'react'
import { useBuilderStore } from '@/store/useBuilderStore'
import { CheckSquare, Square, CaretDown, CaretUp, Sparkle, MagicWand } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface SelectionV2 {
  entryId: string
  entryType: 'experience' | 'project' | 'education'
  confidence: number
  rank: number
  rationale: string
  selectedBulletIds: string[]
}

interface SelectionV2WidgetProps {
  selections: SelectionV2[]
}

export function SelectionV2Widget({ selections }: SelectionV2WidgetProps) {
  const profile = useBuilderStore((s) => s.profile)
  const updateProfile = useBuilderStore((s) => s.updateProfile)
  const selectedBulletIds = useBuilderStore((s) => s.selectedBulletIds)
  const toggleBullet = useBuilderStore((s) => s.toggleBullet)
  const selectedExperienceIds = useBuilderStore((s) => s.selectedExperienceIds)
  const selectedProjectIds = useBuilderStore((s) => s.selectedProjectIds)
  const triggerCompile = useBuilderStore((s) => s.triggerCompile)
  const isCompiling = useBuilderStore((s) => s.isCompiling)
  const setCurrentStage = useBuilderStore((s) => s.setCurrentStage)

  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Hydrate titles and bullets from profile
  const entriesWithDetails = useMemo(() => {
    if (!profile) return []
    return selections.map((sel) => {
      let title = 'Unknown Entry'
      let bullets: any[] = []

      if (sel.entryType === 'experience') {
        const item = profile.experience?.find((e) => e.id === sel.entryId)
        if (item) {
          title = `${item.role} at ${item.company}`
          bullets = item.vaultBullets || []
        }
      } else if (sel.entryType === 'project') {
        const item = profile.projects?.find((p) => p.id === sel.entryId)
        if (item) {
          title = item.title
          bullets = item.vaultBullets || []
        }
      } else if (sel.entryType === 'education') {
        const item = profile.education?.find((ed) => ed.id === sel.entryId)
        if (item) {
          title = `${item.degree} at ${item.school}`
        }
      }

      return {
        ...sel,
        title,
        bullets,
      }
    })
  }, [selections, profile])

  const handleGenerate = async () => {
    setCurrentStage('reviewing')
    try {
      // Sync selections into useBuilderStore's selectedBulletIds, selectedExperienceIds, selectedProjectIds
      const storeSelections: Record<string, string[]> = {}
      const storeExpIds: string[] = []
      const storeProjIds: string[] = []

      selections.forEach((sel) => {
        if (sel.entryType === 'experience') {
          storeExpIds.push(sel.entryId)
        } else if (sel.entryType === 'project') {
          storeProjIds.push(sel.entryId)
        }
        // Use either the user's toggled bullets or the AI's default recommendations
        storeSelections[sel.entryId] = selectedBulletIds[sel.entryId] || sel.selectedBulletIds
      })

      useBuilderStore.setState({
        selectedBulletIds: { ...selectedBulletIds, ...storeSelections },
        selectedExperienceIds: storeExpIds,
        selectedProjectIds: storeProjIds,
      })

      toast.loading('Compiling your resume...', { id: 'compile-loader' })
      await triggerCompile()
      toast.dismiss('compile-loader')
      toast.success('Resume generated successfully!')
    } catch {
      toast.dismiss('compile-loader')
      toast.error('Failed to compile PDF')
    }
  }

  if (!profile) return null

  return (
    <div className="glass border border-edge/60 bg-card/60 backdrop-blur rounded-2xl p-5 shadow-xl my-3 flex flex-col gap-4 max-w-lg w-full animate-fade-in">
      <div className="flex items-center gap-2">
        <Sparkle className="w-5 h-5 text-brand" weight="fill" />
        <span className="text-xs uppercase font-bold tracking-wider text-brand">Selections & Tailoring</span>
      </div>

      <div className="space-y-3">
        {entriesWithDetails.map((entry) => {
          const isExpanded = expandedId === entry.entryId
          const entrySelections = selectedBulletIds[entry.entryId] || entry.selectedBulletIds

          return (
            <div key={entry.entryId} className="border border-edge/40 rounded-xl overflow-hidden bg-background/30">
              {/* Header block */}
              <div className="p-3 flex flex-col gap-2 cursor-pointer hover:bg-surface-subtle/50 transition-colors" onClick={() => setExpandedId(isExpanded ? null : entry.entryId)}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <span className="font-semibold text-xs text-fg truncate block">
                      {entry.title}
                    </span>
                    <span className="text-[9px] uppercase font-bold tracking-wider text-content-muted mt-0.5 block">
                      {entry.entryType}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {entry.bullets.length > 0 && (
                      <span className="text-[10px] text-brand/90 font-medium">
                        {entrySelections.length}/{entry.bullets.length} points
                      </span>
                    )}
                    {isExpanded ? <CaretUp size={14} /> : <CaretDown size={14} />}
                  </div>
                </div>

                {/* Confidence Bar */}
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-edge/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand rounded-full transition-all duration-500"
                      style={{ width: `${entry.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-brand leading-none">
                    {Math.round(entry.confidence * 100)}% Match
                  </span>
                </div>
              </div>

              {/* Bullets Sub-List */}
              {isExpanded && entry.bullets.length > 0 && (
                <div className="divide-y divide-edge/30 bg-background/50 border-t border-edge/30">
                  {entry.bullets.map((bullet: any) => {
                    const isSelected = entrySelections.includes(bullet.id)
                    return (
                      <button
                        key={bullet.id}
                        onClick={() => toggleBullet(entry.entryId, bullet.id)}
                        className="w-full flex items-start gap-2.5 px-3.5 py-2.5 text-left hover:bg-surface-subtle transition-colors relative group"
                      >
                        {isSelected ? (
                          <CheckSquare size={15} className="text-brand shrink-0 mt-0.5" weight="fill" />
                        ) : (
                          <Square size={15} className="text-content-subtle shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <span className={`text-[11px] leading-relaxed block ${isSelected ? 'text-content font-medium' : 'text-content-muted'}`}>
                            {bullet.text}
                          </span>
                          {bullet.isAIGenerated && (
                            <div className="flex items-center gap-1 mt-1 text-[9px] text-brand/80 font-medium">
                              <MagicWand size={10} /> AI Tailored
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="border-t border-edge/40 pt-3 flex items-center justify-between gap-3 mt-1">
        <span className="text-[10px] text-content-muted">Toggle points to fine-tune your resume layout.</span>
        <button
          onClick={handleGenerate}
          disabled={isCompiling}
          className="px-4 py-2 bg-brand text-brand-fg hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-brand/10 transition-all cursor-pointer"
        >
          {isCompiling ? (
            <>
              <span className="w-3.5 h-3.5 rounded-full border border-brand-fg border-t-transparent animate-spin shrink-0" />
              Compiling...
            </>
          ) : (
            <>
              Generate Resume
            </>
          )}
        </button>
      </div>
    </div>
  )
}
