import { describe, it, expect, vi, beforeEach } from 'vitest'
import { extractJson, extractBalanced } from '../ai/index'

// ── extractBalanced ───────────────────────────────────────────────────────────

describe('extractBalanced', () => {
  it('extracts a simple JSON object', () => {
    expect(extractBalanced('{"a":1}', '{', '}')).toBe('{"a":1}')
  })

  it('extracts nested braces correctly', () => {
    expect(extractBalanced('{"a":{"b":2}}', '{', '}')).toBe('{"a":{"b":2}}')
  })

  it('extracts a simple array', () => {
    expect(extractBalanced('[1,2,3]', '[', ']')).toBe('[1,2,3]')
  })

  it('does not count braces inside strings', () => {
    const text = '{"key": "has { brace }"}'
    expect(extractBalanced(text, '{', '}')).toBe(text)
  })

  it('returns null when no matching pair found', () => {
    expect(extractBalanced('no braces here', '{', '}')).toBeNull()
  })

  it('returns null for unbalanced input', () => {
    expect(extractBalanced('{unclosed', '{', '}')).toBeNull()
  })

  it('extracts the first complete match when text before it exists', () => {
    const text = 'prefix {"key":"value"} suffix'
    expect(extractBalanced(text, '{', '}')).toBe('{"key":"value"}')
  })
})

// ── extractJson ───────────────────────────────────────────────────────────────

describe('extractJson', () => {
  it('extracts JSON from a plain response', () => {
    expect(extractJson('{"result": true}')).toBe('{"result": true}')
  })

  it('extracts JSON from a ```json code block', () => {
    const input = '```json\n{"result": true}\n```'
    expect(extractJson(input)).toBe('{"result": true}')
  })

  it('extracts JSON from a plain ``` code block', () => {
    const input = '```\n{"result": true}\n```'
    expect(extractJson(input)).toBe('{"result": true}')
  })

  it('extracts array JSON', () => {
    expect(extractJson('["a","b","c"]')).toBe('["a","b","c"]')
  })

  it('extracts array from a code block', () => {
    const input = '```\n["one","two"]\n```'
    expect(extractJson(input)).toBe('["one","two"]')
  })

  it('falls back to trimmed text when no JSON detected', () => {
    // Non-JSON plain text with no braces/brackets
    expect(extractJson('  hello world  ')).toBe('hello world')
  })

  it('handles nested JSON in a code block', () => {
    const input = '```json\n{"a":{"b":1}}\n```'
    expect(extractJson(input)).toBe('{"a":{"b":1}}')
  })

  it('strips text before and after JSON object', () => {
    expect(extractJson('Here is the result: {"ok":true}. Done.')).toBe('{"ok":true}')
  })
})

// ── OpenCodeZenAIService: external API mocking ────────────────────────────────

describe('OpenCodeZenAIService', () => {
  // We test the class behavior by mocking fetch globally.
  // These tests verify the service handles API errors, timeouts, and schema failures.

  beforeEach(() => {
    vi.restoreAllMocks()
    // Ensure API key is set for all tests by default
    process.env.OPENCODE_API_KEY = 'test-key'
  })

  it('throws when OPENCODE_API_KEY is missing', async () => {
    delete process.env.OPENCODE_API_KEY
    const { OpenCodeZenAIService } = await import('../ai/index')
    const svc = new OpenCodeZenAIService()
    await expect(svc.generateStructuredData('sys', 'user', { parse: (d: unknown) => d }))
      .rejects
      .toThrow('Missing OPENCODE_API_KEY')
  })

  it('throws with status code on non-OK HTTP response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => 'Service unavailable',
    }))
    const { OpenCodeZenAIService } = await import('../ai/index')
    const svc = new OpenCodeZenAIService()
    await expect(svc.generateStructuredData('sys', 'user', { parse: (d: unknown) => d }))
      .rejects
      .toThrow('AI API error: 503')
  })

  it('throws on missing choices in AI response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [] }),
    }))
    const { OpenCodeZenAIService } = await import('../ai/index')
    const svc = new OpenCodeZenAIService()
    await expect(svc.generateStructuredData('sys', 'user', { parse: (d: unknown) => d }))
      .rejects
      .toThrow('Invalid response format')
  })

  it('throws on schema parse failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '{"val":1}' } }],
      }),
    }))
    const { OpenCodeZenAIService } = await import('../ai/index')
    const svc = new OpenCodeZenAIService()
    const schema = { parse: (_: unknown) => { throw new Error('schema error') } }
    await expect(svc.generateStructuredData('sys', 'user', schema))
      .rejects
      .toThrow('AI returned invalid data format')
  })

  it('returns schema-parsed data on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: '{"name":"Alice"}' } }],
      }),
    }))
    const { OpenCodeZenAIService } = await import('../ai/index')
    const svc = new OpenCodeZenAIService()
    const schema = { parse: (d: unknown) => d as { name: string } }
    const result = await svc.generateStructuredData('sys', 'user', schema)
    expect(result).toEqual({ name: 'Alice' })
  })

  it('throws timeout message on AbortError', async () => {
    const abortError = new Error('Aborted')
    abortError.name = 'AbortError'
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abortError))
    const { OpenCodeZenAIService } = await import('../ai/index')
    const svc = new OpenCodeZenAIService()
    await expect(svc.generateStructuredData('sys', 'user', { parse: (d: unknown) => d }))
      .rejects
      .toThrow('timed out')
  })
})
