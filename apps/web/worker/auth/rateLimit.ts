/**
 * Per-IP rate limit backed by the `rate_limits` D1 table.
 *
 * Two layers of defence sit on top of the user quota:
 *   1. This rate limit, keyed by IP + endpoint scope, drops floods before
 *      they touch the upstream API key or burn user quota
 *   2. The per-user AI quota (see `quota.ts`) caps a logged-in account's
 *      DeepSeek calls regardless of IP
 *
 * Trade-offs:
 *   - D1 write per request adds ~5–20 ms latency. Acceptable for chat
 *     endpoints; if hot paths ever need <1 ms, swap for KV or Durable
 *     Objects.
 *   - Window is fixed (not sliding). A burst right at a window boundary
 *     can briefly allow ~2× the limit. Good enough for abuse blocking;
 *     not appropriate for billing.
 *   - Stale rows (`expires_at < now`) are left in place; cleanup is meant
 *     to be a periodic cron, not paid for on every write.
 */

export interface RateLimitResult {
  /** True when the caller may proceed. */
  allowed: boolean
  /** Seconds the caller should wait before retrying. */
  retryAfter: number
  /** Current request count within the active window. */
  count: number
  /** Configured ceiling. */
  limit: number
}

/**
 * Read the public client IP from the incoming request. Cloudflare adds
 * `cf-connecting-ip`; fall back to `x-forwarded-for` for non-CF contexts
 * (local `wrangler dev`, custom proxies). When neither is present we use
 * the literal `"unknown"` bucket so the limit still applies globally to
 * unidentified clients.
 */
export function getClientIp(request: Request): string {
  const cf = request.headers.get(`cf-connecting-ip`)
  if (cf)
    return cf
  const xff = request.headers.get(`x-forwarded-for`)
  if (xff)
    return xff.split(`,`)[0].trim()
  return `unknown`
}

/**
 * Atomically increment the per-IP counter for `(scope, ip)` in the current
 * `windowSec` window and return whether the call falls under `limit`.
 */
export async function consumeRate(
  db: D1Database,
  scope: string,
  ip: string,
  limit: number,
  windowSec: number,
): Promise<RateLimitResult> {
  const now = Math.floor(Date.now() / 1000)
  const windowId = Math.floor(now / windowSec)
  const expiresAt = (windowId + 1) * windowSec
  const key = `${scope}:${ip}:${windowId}`

  // INSERT ... ON CONFLICT DO UPDATE keeps the bump atomic at the D1 level.
  const row = await db
    .prepare(
      `INSERT INTO rate_limits (key, count, expires_at) VALUES (?, 1, ?)
       ON CONFLICT(key) DO UPDATE SET count = count + 1
       RETURNING count`,
    )
    .bind(key, expiresAt)
    .first<{ count: number }>()

  const count = row?.count ?? 1
  if (count > limit) {
    return {
      allowed: false,
      retryAfter: Math.max(1, expiresAt - now),
      count,
      limit,
    }
  }
  return { allowed: true, retryAfter: 0, count, limit }
}

/**
 * Standard 429 response with a `Retry-After` header. Body is JSON so clients
 * can branch on `code` without parsing English error messages.
 */
export function rateLimitedResponse(
  result: RateLimitResult,
  scope: string,
): Response {
  return new Response(
    JSON.stringify({
      ok: false,
      error: `Rate limit exceeded`,
      code: `RATE_LIMITED`,
      scope,
      retryAfter: result.retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': `application/json; charset=utf-8`,
        'Cache-Control': `no-store`,
        'Retry-After': String(result.retryAfter),
        'Access-Control-Allow-Origin': `*`,
        'Access-Control-Allow-Headers': `*`,
      },
    },
  )
}
