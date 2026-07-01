import IORedis from 'ioredis'

const rawUrl = process.env.REDIS_URL ?? 'redis://localhost:6379'

// ── Parse the Redis URL into host/port/password/db ────────────────────────────
// We derive a plain ConnectionOptions object from the URL so that BullMQ can
// create its own internal ioredis connections without us handing it an IORedis
// instance. This avoids the TypeScript incompatibility that arises when BullMQ
// bundles its own ioredis copy that differs from the one in our node_modules.
function parseRedisUrl(url: string): { host: string; port: number; password?: string; db?: number; tls?: object } {
  try {
    const u = new URL(url)
    const opts: ReturnType<typeof parseRedisUrl> = {
      host: u.hostname || 'localhost',
      port: Number(u.port) || 6379,
    }
    if (u.password) opts.password = decodeURIComponent(u.password)
    if (u.pathname && u.pathname.length > 1) opts.db = parseInt(u.pathname.slice(1), 10)
    if (u.protocol === 'rediss:') opts.tls = {}
    return opts
  } catch {
    return { host: 'localhost', port: 6379 }
  }
}

/** Connection options for BullMQ — passed directly so BullMQ creates its own ioredis internally */
export const bullmqConnectionOpts = {
  ...parseRedisUrl(rawUrl),
  maxRetriesPerRequest: null as null,  // Required by BullMQ
  enableReadyCheck: false,
}

// ── Direct Redis client ───────────────────────────────────────────────────────
// Used only for SETEX / GET operations (storing PDF result bytes).
// Kept as a plain ioredis instance separate from BullMQ's internal connections.
export const redisClient = new IORedis(rawUrl, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: false,
})

redisClient.on('error', (err: Error) => {
  console.error('[Redis] connection error:', err.message)
})

redisClient.on('connect', () => {
  const safeUrl = rawUrl.replace(/:\/\/[^@]+@/, '://***@')
  console.log('[Redis] connected to', safeUrl)
})
