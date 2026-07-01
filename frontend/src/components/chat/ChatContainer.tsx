'use client'

import { useEffect, useRef, useMemo, type ReactNode } from 'react'
import { useChatStore } from '@/store/useChatStore'
import { MessageBubble } from './MessageBubble'
import { ChatInput } from './ChatInput'

type ChatContainerMode = 'ONBOARDING' | 'BUILDER' | 'DASHBOARD' | 'TAILOR' | 'PROFILE'

interface ChatContainerProps {
  mode: ChatContainerMode
  renderWidget?: ((widget: string | null | undefined, meta?: Record<string, unknown>) => ReactNode) | null
  renderInput?: false
}

export function ChatContainer({ mode, renderWidget, renderInput }: ChatContainerProps) {
  const messagesByMode = useChatStore((s) => s.messagesByMode)
  const storeMode = useChatStore((s) => s.mode)
  const isTyping = useChatStore((s) => s.isTyping)
  const sendMessage = useChatStore((s) => s.sendMessage)
  const setMode = useChatStore((s) => s.setMode)
  const scrollRef = useRef<HTMLDivElement>(null)
  
  const messages = useMemo(() => messagesByMode[storeMode] || [], [messagesByMode, storeMode])

  useEffect(() => {
    setMode(mode)
  }, [mode, setMode])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isTyping])

  return (
    <div className="flex flex-col h-full">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scroll-smooth"
      >
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-content-muted text-sm">
            Start a conversation to build your resume...
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} renderWidget={renderWidget} />
        ))}
        {isTyping && (
          <div className="flex items-center gap-1.5 text-content-muted text-sm px-1">
            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        )}
      </div>

      {renderInput !== false && (
        <div className="p-4 bg-card/80 backdrop-blur border-t border-edge">
          <ChatInput onSend={sendMessage} disabled={isTyping} />
        </div>
      )}
    </div>
  )
}
