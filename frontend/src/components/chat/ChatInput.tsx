'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { ArrowUp, X } from '@phosphor-icons/react'

const DRAFT_KEY = 'resumint-chat-draft'

interface ChatInputProps {
  onSend: (text: string) => void
  disabled?: boolean
  placeholder?: string
}

export function ChatInput({ onSend, disabled, placeholder }: ChatInputProps) {
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const hydratedRef = useRef(false)

  // Hydrate draft from localStorage after mount to avoid SSR mismatch
  useEffect(() => {
    hydratedRef.current = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    try { setText(localStorage.getItem(DRAFT_KEY) || '') } catch { /* noop */ }
  }, [])

  useEffect(() => {
    if (!hydratedRef.current) return
    try {
      if (text) localStorage.setItem(DRAFT_KEY, text)
      else localStorage.removeItem(DRAFT_KEY)
    } catch { /* noop */ }
  }, [text])

  const clearDraft = useCallback(() => {
    setText('')
    try { localStorage.removeItem(DRAFT_KEY) } catch { /* noop */ }
  }, [])

  const handleSend = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    clearDraft()
    inputRef.current?.focus()
  }, [text, disabled, onSend, clearDraft])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex items-end gap-2">
      <div className="relative flex-1">
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Type a message...'}
          rows={1}
          disabled={disabled}
          className="w-full resize-none bg-muted-bg border border-edge rounded-[var(--radius-lg)] px-3 py-2.5 pr-8 text-sm text-content placeholder:text-content-subtle outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-colors disabled:opacity-50"
          style={{ minHeight: '2.5rem', maxHeight: '8rem' }}
          onInput={(e) => {
            const el = e.currentTarget
            el.style.height = 'auto'
            el.style.height = `${Math.min(el.scrollHeight, 8 * 16)}px`
          }}
        />
        {text && (
          <button
            type="button"
            onClick={clearDraft}
            className="absolute right-2 top-2 h-5 w-5 flex items-center justify-center rounded-full text-content-subtle hover:text-content hover:bg-muted-bg transition-colors"
          >
            <X size={10} />
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={handleSend}
        disabled={!text.trim() || disabled}
        className="h-10 w-10 shrink-0 flex items-center justify-center rounded-[var(--radius-lg)] bg-brand text-brand-fg hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
      >
        <ArrowUp size={16} weight="bold" />
      </button>
    </div>
  )
}
