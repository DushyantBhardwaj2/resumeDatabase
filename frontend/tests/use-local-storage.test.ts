import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from '@/lib/use-local-storage'

// jsdom provides localStorage
describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('returns the initialValue before localStorage is read (SSR-safe)', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))
    // On mount, before useEffect fires, value should be initialValue
    expect(result.current[0]).toBe('initial')
  })

  it('reads from localStorage after mount when key exists', async () => {
    localStorage.setItem('greet', JSON.stringify('hello from storage'))
    const { result } = renderHook(() => useLocalStorage('greet', 'initial'))
    // Allow useEffect to run
    await act(async () => {})
    expect(result.current[0]).toBe('hello from storage')
  })

  it('stays at initialValue when localStorage has no entry for key', async () => {
    const { result } = renderHook(() => useLocalStorage('absent-key', 42))
    await act(async () => {})
    expect(result.current[0]).toBe(42)
  })

  it('setValue updates state and writes to localStorage', async () => {
    const { result } = renderHook(() => useLocalStorage('myKey', ''))
    await act(async () => {
      result.current[1]('new-value')
    })
    expect(result.current[0]).toBe('new-value')
    expect(JSON.parse(localStorage.getItem('myKey')!)).toBe('new-value')
  })

  it('setValue supports functional update form', async () => {
    const { result } = renderHook(() => useLocalStorage<number>('counter', 0))
    await act(async () => {
      result.current[1]((prev) => prev + 1)
    })
    expect(result.current[0]).toBe(1)
  })

  it('silently ignores invalid JSON in localStorage (no crash)', async () => {
    localStorage.setItem('bad-json', '{this is not json}')
    const { result } = renderHook(() => useLocalStorage('bad-json', 'fallback'))
    await act(async () => {})
    // Should fall back to initialValue, not throw
    expect(result.current[0]).toBe('fallback')
  })

  it('reads updated value when key changes', async () => {
    localStorage.setItem('key-a', JSON.stringify('value-a'))
    localStorage.setItem('key-b', JSON.stringify('value-b'))
    let key = 'key-a'
    const { result, rerender } = renderHook(() => useLocalStorage(key, 'default'))
    await act(async () => {})
    expect(result.current[0]).toBe('value-a')

    key = 'key-b'
    rerender()
    await act(async () => {})
    expect(result.current[0]).toBe('value-b')
  })
})
