/**
 * Stateless session token: HMAC-SHA-256 over `header.payload`.
 * Format `b64u(header).b64u(payload).b64u(sig)` (JWT-shaped, custom alg label "sb").
 *
 * Signed with `SESSION_SECRET` Worker secret. Stored in HttpOnly cookie.
 */

import type { SessionClaims } from './types'

export const SESSION_TTL_SEC = 30 * 24 * 60 * 60 // 30 days
const HEADER = { alg: `HS256`, typ: `sb` } as const

function b64urlFromBytes(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let bin = ``
  for (let i = 0; i < arr.length; i++)
    bin += String.fromCharCode(arr[i])
  return btoa(bin).replace(/\+/g, `-`).replace(/\//g, `_`).replace(/=+$/, ``)
}

function b64urlFromString(s: string): string {
  return b64urlFromBytes(new TextEncoder().encode(s))
}

function b64urlToBytes(s: string): Uint8Array {
  const padded = s.replace(/-/g, `+`).replace(/_/g, `/`)
    + `=`.repeat((4 - s.length % 4) % 4)
  const bin = atob(padded)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++)
    out[i] = bin.charCodeAt(i)
  return out
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    `raw`,
    new TextEncoder().encode(secret),
    { name: `HMAC`, hash: `SHA-256` },
    false,
    [`sign`, `verify`],
  )
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length)
    return false
  let diff = 0
  for (let i = 0; i < a.length; i++)
    diff |= a[i] ^ b[i]
  return diff === 0
}

export async function mintSession(
  secret: string,
  payload: { sub: string },
): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const claims: SessionClaims = {
    sub: payload.sub,
    iat: now,
    exp: now + SESSION_TTL_SEC,
  }
  const headerPart = b64urlFromString(JSON.stringify(HEADER))
  const payloadPart = b64urlFromString(JSON.stringify(claims))
  const data = `${headerPart}.${payloadPart}`
  const key = await hmacKey(secret)
  const sig = await crypto.subtle.sign(`HMAC`, key, new TextEncoder().encode(data))
  return `${data}.${b64urlFromBytes(sig)}`
}

export async function verifySession(
  secret: string,
  token: string,
): Promise<SessionClaims | null> {
  const parts = token.split(`.`)
  if (parts.length !== 3)
    return null
  const [h, p, s] = parts
  const data = `${h}.${p}`

  let sigOk = false
  try {
    const key = await hmacKey(secret)
    const expected = await crypto.subtle.sign(`HMAC`, key, new TextEncoder().encode(data))
    sigOk = timingSafeEqual(new Uint8Array(expected), b64urlToBytes(s))
  }
  catch {
    return null
  }
  if (!sigOk)
    return null

  let claims: SessionClaims
  try {
    claims = JSON.parse(new TextDecoder().decode(b64urlToBytes(p))) as SessionClaims
  }
  catch {
    return null
  }

  if (
    typeof claims.sub !== `string`
    || typeof claims.exp !== `number`
    || claims.exp < Math.floor(Date.now() / 1000)
  ) {
    return null
  }

  return claims
}

/** Generate a random URL-safe token for CSRF state / nonces. */
export function randomToken(byteLen = 24): string {
  const buf = new Uint8Array(byteLen)
  crypto.getRandomValues(buf)
  return b64urlFromBytes(buf)
}
