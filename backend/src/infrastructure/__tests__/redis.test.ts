import { describe, it, expect } from 'vitest'
import { parseRedisUrl } from '../queue/redis'

describe('parseRedisUrl', () => {
  it('parses a plain redis:// URL', () => {
    const result = parseRedisUrl('redis://localhost:6379')
    expect(result.host).toBe('localhost')
    expect(result.port).toBe(6379)
    expect(result.password).toBeUndefined()
    expect(result.db).toBeUndefined()
    expect(result.tls).toBeUndefined()
  })

  it('parses a URL with a password', () => {
    const result = parseRedisUrl('redis://:mysecret@redis.example.com:6379')
    expect(result.host).toBe('redis.example.com')
    expect(result.port).toBe(6379)
    expect(result.password).toBe('mysecret')
  })

  it('URL-decodes percent-encoded passwords', () => {
    // '@' in password encoded as %40
    const result = parseRedisUrl('redis://:pass%40word@localhost:6379')
    expect(result.password).toBe('pass@word')
  })

  it('parses a database index from the URL path', () => {
    const result = parseRedisUrl('redis://localhost:6379/3')
    expect(result.db).toBe(3)
  })

  it('uses TLS for rediss:// scheme', () => {
    const result = parseRedisUrl('rediss://localhost:6380')
    expect(result.tls).toEqual({})
  })

  it('defaults port to 6379 when missing', () => {
    const result = parseRedisUrl('redis://localhost')
    expect(result.port).toBe(6379)
  })

  it('falls back to localhost:6379 for an invalid URL', () => {
    const result = parseRedisUrl('not-a-valid-url')
    expect(result.host).toBe('localhost')
    expect(result.port).toBe(6379)
    expect(result.password).toBeUndefined()
  })

  it('falls back gracefully for an empty string', () => {
    const result = parseRedisUrl('')
    expect(result.host).toBe('localhost')
    expect(result.port).toBe(6379)
  })
})
