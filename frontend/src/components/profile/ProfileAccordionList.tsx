'use client'

import { useState } from 'react'
import { CaretDown, CaretUp, Link as LinkIcon, PencilSimple, Trash } from '@phosphor-icons/react'
import type { VaultBullet } from '@resumint/shared'

export type AccordionItem = {
  id: string
  title: string
  subtitle?: string
  url?: string
  bullets: VaultBullet[]
}

interface ProfileAccordionListProps {
  items: AccordionItem[]
  emptyLabel?: string
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

export function ProfileAccordionList({ items, emptyLabel = 'No entries yet', onEdit, onDelete }: ProfileAccordionListProps) {
  const [openId, setOpenId] = useState<string | null>(null)

  const toggle = (id: string) => setOpenId(openId === id ? null : id)

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-sm text-content-muted">
        {emptyLabel}
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      {items.map((item) => {
        const isOpen = openId === item.id
        return (
          <div
            key={item.id}
            className="rounded-[var(--radius-md)] border border-edge bg-card overflow-hidden transition-all duration-200"
          >
            <button
              onClick={() => toggle(item.id)}
              className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-surface transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-content truncate">{item.title}</p>
                {item.subtitle && (
                  <p className="text-[11px] text-content-muted mt-0.5 truncate">{item.subtitle}</p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 text-content-subtle hover:text-brand transition-colors rounded hover:bg-surface-hover"
                    title="Visit link"
                  >
                    <LinkIcon size={14} />
                  </a>
                )}
                {onEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit(item.id)
                    }}
                    className="p-1.5 text-content-subtle hover:text-brand transition-colors rounded hover:bg-surface-hover"
                    title="Edit entry"
                  >
                    <PencilSimple size={14} />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDelete(item.id)
                    }}
                    className="p-1.5 text-content-subtle hover:text-red-500 transition-colors rounded hover:bg-red-500/10"
                    title="Delete entry"
                  >
                    <Trash size={14} />
                  </button>
                )}
                <span className="p-1.5 text-content-subtle transition-transform duration-200">
                  {isOpen ? <CaretUp size={14} /> : <CaretDown size={14} />}
                </span>
              </div>
            </button>

            <div
              className={[
                'transition-all duration-200 overflow-hidden',
                isOpen ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0',
              ].join(' ')}
            >
              <div className="px-3 pb-3 pt-1 border-t border-edge space-y-1.5">
                {item.bullets.length === 0 ? (
                  <p className="text-[11px] text-content-subtle italic py-1">No bullets yet</p>
                ) : (
                  item.bullets.map((b) => (
                    <div key={b.id} className="flex items-start gap-2">
                      <span className="text-brand text-[10px] mt-0.5 shrink-0">•</span>
                      <p className="text-[11px] text-content leading-relaxed">{b.text}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
