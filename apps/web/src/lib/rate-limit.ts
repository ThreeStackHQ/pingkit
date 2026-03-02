/**
 * SEC-002: Simple in-memory sliding-window rate limiter.
 *
 * For production, replace with Redis-backed limiter (e.g. @upstash/ratelimit).
 * This in-memory version is suitable for single-instance deployments and
 * provides meaningful abuse protection for API endpoints.
 */

interface RateLimitState {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitState>()

// Prune expired entries every 5 minutes to prevent unbounded memory growth
setInterval(() => {
  const now = Date.now()
  for (const [key, state] of store) {
    if (state.resetAt < now) store.delete(key)
  }
}, 5 * 60 * 1000)

export interface RateLimitOptions {
  /** Maximum requests allowed in the window */
  limit: number
  /** Window duration in milliseconds */
  windowMs: number
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
}

/**
 * Check rate limit for a given key (e.g. userId or IP).
 * Returns { success: false } when limit is exceeded.
 */
export function rateLimit(key: string, opts: RateLimitOptions): RateLimitResult {
  const now = Date.now()
  const existing = store.get(key)

  if (!existing || existing.resetAt < now) {
    // New window
    const resetAt = now + opts.windowMs
    store.set(key, { count: 1, resetAt })
    return { success: true, remaining: opts.limit - 1, resetAt }
  }

  if (existing.count >= opts.limit) {
    return { success: false, remaining: 0, resetAt: existing.resetAt }
  }

  existing.count++
  return { success: true, remaining: opts.limit - existing.count, resetAt: existing.resetAt }
}

/** Rate limit presets */
export const LIMITS = {
  /** Monitor creation: 30 per hour per user */
  monitorCreate: { limit: 30, windowMs: 60 * 60 * 1000 },
  /** Alert channel creation: 20 per hour per user */
  alertChannelCreate: { limit: 20, windowMs: 60 * 60 * 1000 },
  /** Test alert: 10 per 5 minutes per user */
  alertTest: { limit: 10, windowMs: 5 * 60 * 1000 },
} as const
