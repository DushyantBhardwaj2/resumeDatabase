import { Context, Next } from 'hono'
import { redisClient } from './queue/redis'

export interface RateLimiterOptions {
  /** The time window in milliseconds for the rate limit */
  windowMs: number
  /** Maximum number of requests allowed in the time window */
  limit: number
  /** Function to generate a unique key (e.g., based on IP or User ID) */
  keyGenerator: (c: Context) => string
  /** Custom error message when the limit is exceeded */
  message?: string
}

export function rateLimiter(options: RateLimiterOptions) {
  return async (c: Context, next: Next) => {
    const key = `rl:${options.keyGenerator(c)}`

    try {
      if (redisClient.status !== 'ready') {
        return await next()
      }
      
      // Execute INCR and PTTL atomically via a Redis transaction
      const results = await redisClient.multi().incr(key).pttl(key).exec()

      if (results && results.length >= 2) {
        const incrErr = results[0][0]
        const count = results[0][1] as number
        const pttl = results[1][1] as number

        if (!incrErr && typeof count === 'number') {
          // pttl returns -1 if no expiry is set
          if (count === 1 || pttl === -1) {
            // Background expire setup
            redisClient.pexpire(key, options.windowMs).catch((err) => {
              console.error('[RateLimiter] Failed to set expiry:', err)
            })
          }

          c.header('X-RateLimit-Limit', options.limit.toString())
          c.header('X-RateLimit-Remaining', Math.max(0, options.limit - count).toString())

          if (count > options.limit) {
            return c.json(
              { error: options.message || 'Too many requests, please try again later.' },
              429
            )
          }
        }
      }
    } catch (err) {
      // If Redis is unavailable, log the error but allow the request to pass through
      // to maintain system availability.
      console.error('[RateLimiter] Redis error, bypassing rate limit:', err)
    }

    await next()
  }
}
