'use client'

import { useState } from 'react'
import { CaretDown, CaretUp, Link as LinkIcon } from '@phosphor-icons/react'
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
}

export function ProfileAccordionList({ items, emptyLabel = 'No entries yet' }: ProfileAccordionListProps) {
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
              <div className="flex items-center gap-2 shrink-0 ml-2">
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-content-subtle hover:text-brand transition-colors"
                  >
                    <LinkIcon size={13} />
                  </a>
                )}
                <span className="text-content-subtle transition-transform duration-200">
                  {isOpen ? <CaretUp size={13} /> : <CaretDown size={13} />}
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
