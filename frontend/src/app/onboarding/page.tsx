'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { api } from '@/config/api-client'
import { ChatContainer } from '@/components/chat/ChatContainer'
import { ChatInput } from '@/components/chat/ChatInput'
import { useChatStore } from '@/store/useChatStore'

export default function OnboardingPage() {
  const router = useRouter()
  const addMessage = useChatStore((s) => s.addMessage)
  const setMode = useChatStore((s) => s.setMode)
  const currentPhase = useChatStore((s) => s.currentPhase)
  const isTyping = useChatStore((s) => s.isTyping)
  const sendMessage = useChatStore((s) => s.sendMessage)
  const extractedData = useChatStore((s) => s.extractedData)
  const [completing, setCompleting] = useState(false)
  const initRef = useRef(false)

  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    ;(async () => {
      try {
        const res = await api.api.protected.profile.$get()
        if (res.ok) {
          const profile = await res.json()
          if (profile && profile.contact) {
            router.replace('/dashboard')
            return
          }
        }
      } catch {
        // no profile — proceed with onboarding
      }

      setMode('ONBOARDING')

      if (!useChatStore.getState().messagesByMode['ONBOARDING']?.length) {
        addMessage({
          id: 'greeting',
          role: 'assistant',
          content: [
            "Hi! I'm your Resumint Assistant. Let's build your Career Vault.",
            '',
            'You can:',
            '- Upload an existing PDF resume',
            '- Describe your experience, projects, and skills',
            '- Or just start typing!',
            '',
            'What would you like to do?',
          ].join('\n'),
          widget: 'UPLOAD_DROPZONE',
        })
      }
    })()
  }, [addMessage, setMode, router])

  useEffect(() => {
    if (currentPhase !== 'COMPLETE' || completing) return

    ;(async () => {
      setCompleting(true)
      try {
        const res = await api.api.protected.profile.$post({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          json: { parsed: extractedData as any },
        })
        if (!res.ok) throw new Error()
        toast.success('Profile created! Welcome to Resumint.')
        router.push('/dashboard')
      } catch {
        toast.error('Failed to save profile')
      } finally {
        setCompleting(false)
      }
    })()
  }, [currentPhase, completing, extractedData, router])

  return (
    <div className="min-h-dvh bg-surface flex flex-col overflow-hidden relative">
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-0" aria-hidden>
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand/5 blur-3xl animate-fade-in" />
        <div className="absolute -bottom-32 -left-32 w-[30rem] h-[30rem] rounded-full bg-brand/5 blur-3xl animate-fade-in delay-150" />
        <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full bg-brand/[0.03] blur-3xl animate-fade-in delay-300" />
      </div>

      <header className="relative z-10 shrink-0 border-b border-edge/50 glass animate-fade-up">
        <div className="max-w-3xl mx-auto h-14 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="font-display text-lg font-bold text-content tracking-tight">
              Resumint
            </span>
            <span className="text-[10px] font-medium text-content-muted uppercase tracking-widest bg-surface-subtle px-2 py-0.5 rounded-full">
              Onboarding
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-content-muted">
            <span className="hidden sm:inline">AI-Powered Career Vault</span>
            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center p-4 sm:p-6 lg:p-8 relative z-10 overflow-hidden">
        <div className="w-full max-w-3xl h-full flex flex-col glass rounded-[var(--radius-2xl)] shadow-xl animate-fade-up delay-75 overflow-hidden">
          <ChatContainer mode="ONBOARDING" renderInput={false} />
        </div>
      </main>

      <div className="relative z-10 shrink-0 glass border-t border-edge/50 animate-fade-up delay-150">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <ChatInput onSend={sendMessage} disabled={isTyping} placeholder="Type a message or drop your resume above..." />
        </div>
      </div>
    </div>
  )
}