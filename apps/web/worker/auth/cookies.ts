/**
 * Minimal cookie helpers — no external dep.
 */

export function parseCookies(header: string | null): Record<string, string> {
  if (!header)
    return {}
  const out: Record<string, string> = {}
  for (const piece of header.split(`;`)) {
    const idx = piece.indexOf(`=`)
    if (idx === -1)
      continue
    const k = piece.slice(0, idx).trim()
    const v = piece.slice(idx + 1).trim()
    if (!k)
      continue
    try {
      out[k] = decodeURIComponent(v)
    }
    catch {
      out[k] = v
    }
  }
  return out
}

export interface CookieOpts {
  maxAge?: number
  path?: string
  httpOnly?: boolean
  secure?: boolean
  sameSite?: 'Lax' | 'Strict' | 'None'
}

export function serializeCookie(name: string, value: string, opts: CookieOpts = {}): string {
  const parts = [`${name}=${encodeURIComponent(value)}`]
  parts.push(`Path=${opts.path ?? `/`}`)
  if (opts.maxAge !== undefined)
    parts.push(`Max-Age=${opts.maxAge}`)
  if (opts.httpOnly !== false)
    parts.push(`HttpOnly`)
  if (opts.secure !== false)
    parts.push(`Secure`)
  parts.push(`SameSite=${opts.sameSite ?? `Lax`}`)
  return parts.join(`; `)
}

export const SESSION_COOKIE = `sb_session`
