// In-memory rate limiting store: maps IP to { count, resetAt }
const ipRequestCounts = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 30 // requests per minute per IP
const WINDOW_MS = 60 * 1000 // 1 minute

// Periodic cleanup of expired entries to prevent memory leaks
setInterval(() => {
  const now = Date.now()
  for (const [ip, record] of ipRequestCounts.entries()) {
    if (now > record.resetAt) {
      ipRequestCounts.delete(ip)
    }
  }
}, WINDOW_MS)

export default defineEventHandler(async (event) => {
  // Only apply to /api/mc/ routes
  if (!event.path.startsWith('/api/mc/')) {
    return
  }

  // --- Origin check ---
  const origin = getRequestHeader(event, 'origin')
  const host = getRequestHeader(event, 'host')

  // Allow same-origin requests (no origin header = same-origin)
  if (origin && host && !origin.includes(host)) {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }

  // --- Rate limiting ---
  const ip =
    getRequestIP(event, { xForwardedFor: true }) ||
    event.node.req.socket.remoteAddress ||
    'unknown'

  const now = Date.now()
  let record = ipRequestCounts.get(ip)

  if (!record || now > record.resetAt) {
    // New window
    ipRequestCounts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return
  }

  record.count++

  if (record.count > RATE_LIMIT) {
    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests',
    })
  }
})
