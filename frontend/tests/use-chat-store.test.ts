import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useChatStore } from '@/store/useChatStore'

function getStore() {
  return useChatStore.getState()
}

beforeEach(() => {
  // Reset store to initial state before each test
  useChatStore.setState({
    messagesByMode: { ONBOARDING: [], BUILDER: [], DASHBOARD: [], TAILOR: [], PROFILE: [] },
    currentPhase: 'GREETING',
    isTyping: false,
    mode: 'ONBOARDING',
    extractedData: {},
  })
  vi.clearAllMocks()
})

// ── addMessage ────────────────────────────────────────────────────────────────

describe('addMessage', () => {
  it('appends message to the current mode list', () => {
    const msg = { id: 1, role: 'user' as const, content: 'Hello' }
    getStore().addMessage(msg)
    expect(getStore().messagesByMode.ONBOARDING).toHaveLength(1)
    expect(getStore().messagesByMode.ONBOARDING[0].content).toBe('Hello')
  })

  it('does not affect messages in other modes', () => {
    const msg = { id: 1, role: 'user' as const, content: 'Hello' }
    getStore().addMessage(msg)
    expect(getStore().messagesByMode.BUILDER).toHaveLength(0)
    expect(getStore().messagesByMode.DASHBOARD).toHaveLength(0)
  })

  it('appends multiple messages in order', () => {
    getStore().addMessage({ id: 1, role: 'user', content: 'First' })
    getStore().addMessage({ id: 2, role: 'assistant', content: 'Second' })
    const msgs = getStore().messagesByMode.ONBOARDING
    expect(msgs).toHaveLength(2)
    expect(msgs[0].content).toBe('First')
    expect(msgs[1].content).toBe('Second')
  })
})

// ── simple setters ────────────────────────────────────────────────────────────

describe('simple setters', () => {
  it('setTyping updates isTyping', () => {
    getStore().setTyping(true)
    expect(getStore().isTyping).toBe(true)
    getStore().setTyping(false)
    expect(getStore().isTyping).toBe(false)
  })

  it('setPhase updates currentPhase', () => {
    getStore().setPhase('REVIEW_EXPERIENCE')
    expect(getStore().currentPhase).toBe('REVIEW_EXPERIENCE')
  })

  it('setMode updates mode', () => {
    getStore().setMode('BUILDER')
    expect(getStore().mode).toBe('BUILDER')
  })
})

// ── clearChat ─────────────────────────────────────────────────────────────────

describe('clearChat', () => {
  it('clears messages for the current ONBOARDING mode only', () => {
    getStore().addMessage({ id: 1, role: 'user', content: 'Onboarding msg' })
    // Add a message to BUILDER mode
    useChatStore.setState((s) => ({
      messagesByMode: { ...s.messagesByMode, BUILDER: [{ id: 2, role: 'user', content: 'Builder msg' }] },
    }))
    getStore().clearChat()
    expect(getStore().messagesByMode.ONBOARDING).toHaveLength(0)
    expect(getStore().messagesByMode.BUILDER).toHaveLength(1)
  })

  it('resets currentPhase to GREETING when in ONBOARDING mode', () => {
    useChatStore.setState({ currentPhase: 'REVIEW_SKILLS' })
    getStore().clearChat()
    expect(getStore().currentPhase).toBe('GREETING')
  })

  it('does NOT reset currentPhase when in non-ONBOARDING mode', () => {
    useChatStore.setState({ mode: 'BUILDER', currentPhase: 'REVIEW_EXPERIENCE' })
    getStore().clearChat()
    expect(getStore().currentPhase).toBe('REVIEW_EXPERIENCE')
  })

  it('resets extractedData when in ONBOARDING mode', () => {
    useChatStore.setState({ extractedData: { name: 'Alice' } })
    getStore().clearChat()
    expect(getStore().extractedData).toEqual({})
  })

  it('preserves extractedData when in non-ONBOARDING mode', () => {
    useChatStore.setState({ mode: 'BUILDER', extractedData: { jobTitle: 'SWE' } })
    getStore().clearChat()
    expect(getStore().extractedData).toEqual({ jobTitle: 'SWE' })
  })
})

// ── mapWidgetToPhase (via setPhase after sendMessage NAVIGATE intent) ─────────
// We test mapWidgetToPhase indirectly by verifying the store's behavior
// when a NAVIGATE intent is received from sendMessage.

describe('mapWidgetToPhase mappings', () => {
  // We mock the API call made by sendMessage and test state transitions
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const mappings: Array<[string, string]> = [
    ['CONTACT', 'REVIEW_CONTACT_AND_CERTS'],
    ['EXPERIENCE', 'REVIEW_EXPERIENCE'],
    ['PROJECTS', 'REVIEW_PROJECTS'],
    ['SKILLS', 'REVIEW_SKILLS'],
    ['CERTIFICATES', 'REVIEW_CONTACT_AND_CERTS'],
    ['REVIEW', 'COMPLETE'],
    ['UPLOAD_DROPZONE', 'AWAITING_RESUME_OR_TEXT'],
  ]

  for (const [widget, expectedPhase] of mappings) {
    it(`maps widget ${widget} → phase ${expectedPhase}`, async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          reply: 'ok',
          intent: 'NAVIGATE',
          targetWidget: widget,
          extractedData: {},
        }),
      } as any)

      await getStore().sendMessage('test')
      expect(getStore().currentPhase).toBe(expectedPhase)
    })
  }

  it('maps unknown widget → GREETING', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        reply: 'ok',
        intent: 'NAVIGATE',
        targetWidget: 'UNKNOWN_WIDGET',
        extractedData: {},
      }),
    } as any)

    useChatStore.setState({ currentPhase: 'REVIEW_SKILLS' })
    await getStore().sendMessage('test')
    // Unknown widget → GREETING (from mapWidgetToPhase fallback)
    expect(getStore().currentPhase).toBe('GREETING')
  })
})

// ── sendMessage error handling ────────────────────────────────────────────────

describe('sendMessage error handling', () => {
  it('adds error assistant message on network failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    await getStore().sendMessage('hello')
    const msgs = getStore().messagesByMode.ONBOARDING
    const lastMsg = msgs[msgs.length - 1]
    expect(lastMsg.role).toBe('assistant')
    expect(lastMsg.content).toContain("couldn't process")
    vi.unstubAllGlobals()
  })

  it('sets isTyping to false after error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fail')))
    await getStore().sendMessage('hello')
    expect(getStore().isTyping).toBe(false)
    vi.unstubAllGlobals()
  })

  it('adds user message before the request', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fail')))
    await getStore().sendMessage('my message')
    const msgs = getStore().messagesByMode.ONBOARDING
    expect(msgs[0].role).toBe('user')
    expect(msgs[0].content).toBe('my message')
    vi.unstubAllGlobals()
  })
})
