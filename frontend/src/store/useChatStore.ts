import { create } from 'zustand'
import { api } from '@/config/api-client'
export type ChatMessage = {
  id: string | number
  role: 'user' | 'assistant' | 'system'
  content: string
  widget?: string | null
  meta?: Record<string, unknown>
}

export type OnboardingPhase =
  | 'GREETING'
  | 'AWAITING_RESUME_OR_TEXT'
  | 'PROCESSING_UPLOAD'
  | 'REVIEW_EXPERIENCE'
  | 'REVIEW_PROJECTS'
  | 'REVIEW_SKILLS'
  | 'REVIEW_CONTACT_AND_CERTS'
  | 'COMPLETE'

export type ChatMode = 'ONBOARDING' | 'BUILDER' | 'DASHBOARD' | 'TAILOR' | 'PROFILE'

interface ChatStore {
  messagesByMode: Record<ChatMode, ChatMessage[]>
  currentPhase: OnboardingPhase
  isTyping: boolean
  mode: ChatMode
  extractedData: Record<string, unknown>

  addMessage: (msg: ChatMessage) => void
  setTyping: (typing: boolean) => void
  setPhase: (phase: OnboardingPhase) => void
  setMode: (mode: ChatMode) => void
  clearChat: () => void
  sendMessage: (text: string) => Promise<void>
}

const initialModeMessages: Record<ChatMode, ChatMessage[]> = {
  ONBOARDING: [],
  BUILDER: [],
  DASHBOARD: [],
  TAILOR: [],
  PROFILE: [],
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messagesByMode: { ...initialModeMessages },
  currentPhase: 'GREETING',
  isTyping: false,
  mode: 'ONBOARDING',
  extractedData: {},

  addMessage: (msg) =>
    set((state) => ({
      messagesByMode: {
        ...state.messagesByMode,
        [state.mode]: [...(state.messagesByMode[state.mode] || []), msg],
      },
    })),

  setTyping: (typing) => set({ isTyping: typing }),

  setPhase: (phase) => set({ currentPhase: phase }),

  setMode: (mode) => set({ mode }),

  clearChat: () =>
    set((state) => ({
      messagesByMode: {
        ...state.messagesByMode,
        [state.mode]: [],
      },
      currentPhase: state.mode === 'ONBOARDING' ? 'GREETING' : state.currentPhase,
      extractedData: state.mode === 'ONBOARDING' ? {} : state.extractedData,
    })),

  sendMessage: async (text) => {
    const { messagesByMode, currentPhase, mode } = get()
    const modeMessages = messagesByMode[mode] || []

    const userMsg: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content: text,
    }
    set((state) => ({
      messagesByMode: {
        ...state.messagesByMode,
        [mode]: [...(state.messagesByMode[mode] || []), userMsg],
      },
      isTyping: true,
    }))

    try {
      const res = await api.api.protected.chat.interact.$post({
        json: {
          messages: [...modeMessages, userMsg].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          currentState: { phase: currentPhase },
          mode,
        },
      })

      if (!res.ok) throw new Error('Chat request failed')

      const data = await res.json()

      const assistantMsg: ChatMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.reply,
        widget: data.targetWidget,
        meta: data.extractedData && typeof data.extractedData === 'object' && Object.keys(data.extractedData).length > 0
          ? { generatedData: data.extractedData }
          : undefined,
      }

      set((state) => ({
        messagesByMode: {
          ...state.messagesByMode,
          [mode]: [...(state.messagesByMode[mode] || []), assistantMsg],
        },
        isTyping: false,
        extractedData: data.extractedData
          ? { ...state.extractedData, ...data.extractedData }
          : state.extractedData,
        currentPhase: data.intent === 'NAVIGATE' && data.targetWidget
          ? mapWidgetToPhase(data.targetWidget)
          : state.currentPhase,
      }))

      // Persist both messages to chat history
      fetch('/api/protected/chat/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'user', content: text, mode }),
      }).catch(() => {})
      if (data.reply) {
        fetch('/api/protected/chat/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: 'assistant', content: data.reply, widget: data.targetWidget, mode }),
        }).catch(() => {})
      }
    } catch {
      set((state) => ({
        messagesByMode: {
          ...state.messagesByMode,
          [mode]: [...(state.messagesByMode[mode] || []), {
            id: Date.now() + 1,
            role: 'assistant',
            content: "Sorry, I couldn't process that. Please try again.",
            widget: null,
          }],
        },
        isTyping: false,
      }))
    }
  },
}))

function mapWidgetToPhase(widget: string): OnboardingPhase {
  const map: Record<string, OnboardingPhase> = {
    CONTACT: 'REVIEW_CONTACT_AND_CERTS',
    EXPERIENCE: 'REVIEW_EXPERIENCE',
    PROJECTS: 'REVIEW_PROJECTS',
    SKILLS: 'REVIEW_SKILLS',
    CERTIFICATES: 'REVIEW_CONTACT_AND_CERTS',
    REVIEW: 'COMPLETE',
    UPLOAD_DROPZONE: 'AWAITING_RESUME_OR_TEXT',
  }
  return map[widget] || 'GREETING'
}
