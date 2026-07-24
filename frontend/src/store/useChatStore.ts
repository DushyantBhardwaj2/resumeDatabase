import { create } from 'zustand'
import { api } from '@/config/api-client'

export type ChatMessage = {
  id: string | number
  role: 'user' | 'assistant' | 'system'
  content: string
  type?: 'text' | 'proposal-cards' | 'selection' | 'search-results' | 'merge-suggestion'
  actions?: any[]
  selections?: any[]
  searchResults?: any[]
  mergeSuggestion?: any
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
  loadHistory: (mode: ChatMode) => Promise<void>
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
  
  loadHistory: async (mode) => {
    try {
      const res = await api.api.protected.chat.history.$get({
        query: { mode }
      })
      if (res.ok) {
        const messages = await res.json()
        set((state) => ({
          messagesByMode: {
            ...state.messagesByMode,
            [mode]: messages,
          },
        }))
      }
    } catch { /* ignore */ }
  },

  clearChat: async () => {
    try {
      await api.api.protected.chat.history.$delete()
    } catch { /* ignore */ }
    set((state) => ({
      messagesByMode: {
        ...state.messagesByMode,
        [state.mode]: [],
      },
      currentPhase: state.mode === 'ONBOARDING' ? 'GREETING' : state.currentPhase,
      extractedData: state.mode === 'ONBOARDING' ? {} : state.extractedData,
    }))
  },

  sendMessage: async (text) => {
    const { messagesByMode, currentPhase, mode } = get()
    const modeMessages = messagesByMode[mode] || []

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
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
          message: text,
        },
      })

      if (!res.ok) throw new Error('Chat request failed')

      const data = await res.json()

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.reply,
        type: data.type,
        actions: data.actions,
        selections: data.selections,
        searchResults: data.searchResults,
        mergeSuggestion: data.mergeSuggestion,
        widget: data.type !== 'text' ? data.type : null,
      }

      const isAffirmative = /looks good|looks great|confirm|save|continue|done|good to go|proceed|yes/i.test(text)
      const hasData = Object.keys(get().extractedData || {}).length > 0
      const isComplete = (data.intent === 'CREATE_RESUME' && data.type === 'selection') || (mode === 'ONBOARDING' && hasData && isAffirmative)

      set((state) => ({
        messagesByMode: {
          ...state.messagesByMode,
          [mode]: [...(state.messagesByMode[mode] || []), assistantMsg],
        },
        isTyping: false,
        currentPhase: isComplete ? 'COMPLETE' : state.currentPhase,
      }))

      // Persist both messages to chat history
      api.api.protected.chat.save.$post({
        json: { role: 'user', content: text },
      }).catch(() => {})
      if (data.reply) {
        api.api.protected.chat.save.$post({
          json: { role: 'assistant', content: data.reply },
        }).catch(() => {})
      }
    } catch {
      set((state) => ({
        messagesByMode: {
          ...state.messagesByMode,
          [mode]: [...(state.messagesByMode[mode] || []), {
            id: crypto.randomUUID(),
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
