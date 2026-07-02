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
    <div className="space-y-4">
      {items.map((item) => {
        const isOpen = openId === item.id
        return (
          <div
            key={item.id}
            className="rounded-[var(--radius-lg)] border border-edge bg-card p-5 relative group overflow-hidden transition-all hover-glow"
          >
            <div className="absolute top-0 left-0 w-1 h-full bg-brand opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex items-start justify-between gap-4">
              <div
                className="flex-1 cursor-pointer"
                onClick={() => toggle(item.id)}
              >
                <h4 className="font-display font-semibold text-lg text-fg">{item.title}</h4>
                {item.subtitle && (
                  <p className="text-sm text-brand font-medium mb-3">{item.subtitle}</p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 text-content-subtle hover:text-brand transition-colors rounded hover:bg-surface-hover"
                    title="Visit link"
                  >
                    <LinkIcon size={16} />
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
                    <PencilSimple size={16} />
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
                    <Trash size={16} />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    toggle(item.id)
                  }}
                  className="p-1.5 text-content-subtle transition-transform duration-200"
                >
                  {isOpen ? <CaretUp size={16} /> : <CaretDown size={16} />}
                </button>
              </div>
            </div>

            <div
              className={[
                'transition-all duration-200 overflow-hidden',
                isOpen ? 'max-h-[1000px] opacity-100 mt-2' : 'max-h-0 opacity-0',
              ].join(' ')}
            >
              <ul className="space-y-2 m-0 p-0 list-none">
                {item.bullets.length === 0 ? (
                  <li className="text-[13px] text-content-subtle italic py-1">No bullets yet</li>
                ) : (
                  item.bullets.map((b) => (
                    <li key={b.id} className="text-[13px] text-content-muted leading-relaxed flex items-start gap-2">
                      <span className="text-brand text-[10px] mt-1">&#9679;</span>
                      <span className="flex-1">{b.text}</span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        )
      })}
    </div>
  )
}
