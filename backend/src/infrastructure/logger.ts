import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV !== 'production'
      ? { target: 'pino/file', options: { destination: 1 } }
      : undefined,
  redact: {
    paths: ['req.headers.cookie', 'req.headers.authorization', 'body.password'],
    censor: '[REDACTED]',
  },
})
