'use client'

import { useState } from 'react'
import { api } from '@/config/api-client'
import { Check, ArrowsMerge, Plus } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface MergeSuggestionWidgetProps {
  mergeSuggestion: {
    sourceContent: { title: string; description: string; techStack: string[] }
    targetEntry: { id: string; title: string; type: 'experience' | 'project' } | null
    matchScore: number
    shouldSuggest: boolean
  }
}

export function MergeSuggestionWidget({ mergeSuggestion }: MergeSuggestionWidgetProps) {
  const [status, setStatus] = useState<'pending' | 'applied-merge' | 'applied-new'>('pending')

  if (!mergeSuggestion || !mergeSuggestion.targetEntry) return null

  const target = mergeSuggestion.targetEntry
  const source = mergeSuggestion.sourceContent

  const handleMerge = async () => {
    try {
      // Map to MERGE_INTO action
      const action = {
        type: 'MERGE_INTO',
        sourceId: crypto.randomUUID(), // source content is new
        targetId: target.id,
        targetType: target.type,
      }

      const res = await api.api.protected.memory.apply.$post({
        json: { actions: [action] },
      })

      if (res.ok) {
        setStatus('applied-merge')
        toast.success(`Successfully merged into ${target.title}!`)
      } else {
        throw new Error()
      }
    } catch {
      toast.error('Failed to merge entry')
    }
  }

  const handleSaveAsNew = async () => {
    try {
      // Create project action
      const action = {
        type: 'CREATE_PROJECT',
        project: {
          title: source.title,
          techStack: source.techStack,
          tags: source.techStack,
          bullets: [{ text: source.description, order: 0 }],
          source: { type: 'MANUAL', importedAt: new Date().toISOString() },
        },
      }

      const res = await api.api.protected.memory.apply.$post({
        json: { actions: [action] },
      })

      if (res.ok) {
        setStatus('applied-new')
        toast.success('Saved as new project!')
      } else {
        throw new Error()
      }
    } catch {
      toast.error('Failed to save project')
    }
  }

  if (status === 'applied-merge') {
    return (
      <div className="p-3 bg-brand/10 border border-brand/20 rounded-xl flex items-center gap-2 text-xs text-brand font-medium my-2">
        <Check size={16} weight="bold" />
        <span>Merged into &ldquo;{target.title}&rdquo; successfully!</span>
      </div>
    )
  }

  if (status === 'applied-new') {
    return (
      <div className="p-3 bg-brand/10 border border-brand/20 rounded-xl flex items-center gap-2 text-xs text-brand font-medium my-2">
        <Check size={16} weight="bold" />
        <span>Saved as a new project successfully!</span>
      </div>
    )
  }

  return (
    <div className="glass border border-edge/60 bg-card/60 backdrop-blur rounded-2xl p-5 shadow-xl my-3 flex flex-col gap-3">
      <div className="flex items-center gap-2 text-xs text-content font-medium leading-relaxed">
        <span>I noticed this sounds related to your existing <strong>&ldquo;{target.title}&rdquo;</strong>.</span>
      </div>

      <div className="flex flex-col gap-2 pt-1">
        <button
          onClick={handleMerge}
          className="w-full text-left p-3 rounded-xl border border-brand/20 hover:border-brand/40 bg-brand/5 hover:bg-brand/10 transition-all flex items-center justify-between cursor-pointer group"
        >
          <div className="flex items-center gap-2.5">
            <ArrowsMerge className="w-4 h-4 text-brand" />
            <div className="text-xs">
              <span className="font-semibold text-fg block">Merge into &ldquo;{target.title}&rdquo;</span>
              <span className="text-content-muted text-[10px] block mt-0.5">Adds detail as additional experiences/bullets</span>
            </div>
          </div>
          <span className="text-[10px] bg-brand/15 text-brand px-2 py-0.5 rounded font-bold">
            Match: {Math.round(mergeSuggestion.matchScore * 100)}%
          </span>
        </button>

        <button
          onClick={handleSaveAsNew}
          className="w-full text-left p-3 rounded-xl border border-edge hover:border-edge-focus bg-surface/40 hover:bg-surface/70 transition-all flex items-center gap-2.5 cursor-pointer"
        >
          <Plus className="w-4 h-4 text-content-muted" />
          <div className="text-xs">
            <span className="font-semibold text-fg block">Save as New Project</span>
            <span className="text-content-muted text-[10px] block mt-0.5">Creates a separate standalone project card</span>
          </div>
        </button>
      </div>
    </div>
  )
}
