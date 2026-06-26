'use client'

import { useEffect, useRef } from 'react'
import { useChatStore, type ChatMessage } from '@/store/useChatStore'
import { ChatContainer } from '@/components/chat/ChatContainer'

interface DashboardChatClientProps {
  userName: string
  stats: { education: number; experience: number; projects: number; skills: number }
  completeness: number
}

export function DashboardChatClient({ userName, stats, completeness }: DashboardChatClientProps) {
  const addMessage = useChatStore((s) => s.addMessage)
  const clearChat = useChatStore((s) => s.clearChat)
  const initRef = useRef(false)

  useEffect(() => {
    if (initRef.current) return
    initRef.current = true
    clearChat()

    const welcome: ChatMessage = {
      id: 'dash-welcome',
      role: 'assistant',
      content: `Welcome back, ${userName}! I'm your Resumint assistant. Here's your Career Vault at a glance.`,
      widget: 'DASHBOARD_WELCOME',
      meta: { name: userName },
    }

    const statsMsg: ChatMessage = {
      id: 'dash-stats',
      role: 'assistant',
      content: '',
      widget: 'DASHBOARD_STATS',
      meta: stats as unknown as Record<string, unknown>,
    }

    const completenessMsg: ChatMessage = {
      id: 'dash-completeness',
      role: 'assistant',
      content: '',
      widget: 'DASHBOARD_COMPLETENESS',
      meta: { completeness },
    }

    const actions: ChatMessage = {
      id: 'dash-actions',
      role: 'assistant',
      content: 'Where would you like to go?',
      widget: 'DASHBOARD_QUICK_ACTIONS',
    }

    addMessage(welcome)
    addMessage(statsMsg)
    addMessage(completenessMsg)
    addMessage(actions)
  }, [addMessage, clearChat, userName, stats, completeness])

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-hidden max-w-3xl mx-auto w-full">
        <ChatContainer mode="DASHBOARD" />
      </div>
    </div>
  )
}
