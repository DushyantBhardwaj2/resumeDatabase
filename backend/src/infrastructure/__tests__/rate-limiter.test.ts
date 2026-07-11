import { describe, it, expect, vi, beforeEach } from 'vitest'
import { rateLimiter } from '../rate-limiter'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeContext(overrides: Record<string, unknown> = {}) {
  const headers: Record<string, string> = {}
  return {
    json: vi.fn((body: unknown, status?: number) => ({ body, status })),
    header: vi.fn((key: string, value: string) => { headers[key] = value }),
    req: { header: vi.fn() },
    _headers: headers,
    ...overrides,
  } as any
}

let currentRedisMock: any

vi.mock('../queue/redis', () => ({
  get redisClient() {
    return currentRedisMock
  }
}))

function makeRedis(count: number, pttl: number, shouldError = false) {
  return {
    status: 'ready',
    multi: vi.fn(() => ({
      incr: vi.fn(() => ({
        pttl: vi.fn(() => ({
          exec: vi.fn().mockResolvedValue(
            shouldError
              ? null
              : [
                  [null, count],  // [error, count]
                  [null, pttl],   // [error, pttl]
                ]
          ),
        })),
      })),
    })),
    pexpire: vi.fn().mockResolvedValue(1),
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('rateLimiter middleware', () => {
  const next = vi.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    vi.clearAllMocks()
    currentRedisMock = makeRedis(1, -1)
  })

  it('calls next() when request is within limit', async () => {
    currentRedisMock = makeRedis(1, -1)
    const c = makeContext()
    const opts = { windowMs: 60000, limit: 10, keyGenerator: () => 'user:1' }
    await rateLimiter(opts)(c, next)
    expect(next).toHaveBeenCalledOnce()
  })

  it('returns 429 when count exceeds limit', async () => {
    currentRedisMock = makeRedis(11, 30000)
    const c = makeContext()
    const opts = {
      windowMs: 60000,
      limit: 10,
      keyGenerator: () => 'user:1',
      message: 'Too many requests',
    }
    await rateLimiter(opts)(c, next)
    expect(c.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Too many requests' }),
      429
    )
    expect(next).not.toHaveBeenCalled()
  })

  it('sets X-RateLimit-Limit and X-RateLimit-Remaining headers', async () => {
    currentRedisMock = makeRedis(3, 30000)
    const c = makeContext()
    const opts = { windowMs: 60000, limit: 10, keyGenerator: () => 'user:1' }
    await rateLimiter(opts)(c, next)
    expect(c.header).toHaveBeenCalledWith('X-RateLimit-Limit', '10')
    expect(c.header).toHaveBeenCalledWith('X-RateLimit-Remaining', '7')
  })

  it('X-RateLimit-Remaining never goes below 0', async () => {
    currentRedisMock = makeRedis(15, 30000)
    const c = makeContext()
    const opts = { windowMs: 60000, limit: 10, keyGenerator: () => 'user:1' }
    await rateLimiter(opts)(c, next)
    // Header should be '0', not a negative number
    const remaining = c._headers['X-RateLimit-Remaining']
    expect(Number(remaining)).toBeGreaterThanOrEqual(0)
  })

  it('passes through when Redis errors (availability guarantee)', async () => {
    currentRedisMock = {
      multi: vi.fn(() => ({
        incr: vi.fn(() => ({
          pttl: vi.fn(() => ({
            exec: vi.fn().mockRejectedValue(new Error('Redis down')),
          })),
        })),
      })),
      pexpire: vi.fn(),
    }
    const c = makeContext()
    const opts = { windowMs: 60000, limit: 10, keyGenerator: () => 'user:1' }
    await rateLimiter(opts)(c, next)
    // Must still call next — rate limiter should not block when Redis is down
    expect(next).toHaveBeenCalledOnce()
  })

  it('calls pexpire on first request (pttl == -1)', async () => {
    currentRedisMock = makeRedis(1, -1)
    const c = makeContext()
    const opts = { windowMs: 60000, limit: 10, keyGenerator: () => 'user:1' }
    await rateLimiter(opts)(c, next)
    expect(currentRedisMock.pexpire).toHaveBeenCalledWith(expect.stringContaining('rl:'), 60000)
  })

  it('uses default error message when none provided', async () => {
    currentRedisMock = makeRedis(11, 30000)
    const c = makeContext()
    const opts = { windowMs: 60000, limit: 10, keyGenerator: () => 'user:1' }
    await rateLimiter(opts)(c, next)
    expect(c.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('Too many requests') }),
      429
    )
  })
})
