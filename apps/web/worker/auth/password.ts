/**
 * Password hashing for Cloudflare Workers using Web Crypto PBKDF2.
 */

const PASSWORD_ALG = `pbkdf2_sha256`
const PASSWORD_ITERATIONS = 100_000
const SALT_BYTES = 16
const HASH_BYTES = 32

function b64urlFromBytes(bytes: Uint8Array): string {
  let bin = ``
  for (let i = 0; i < bytes.length; i++)
    bin += String.fromCharCode(bytes[i])
  return btoa(bin).replace(/\+/g, `-`).replace(/\//g, `_`).replace(/=+$/, ``)
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

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length)
    return false
  let diff = 0
  for (let i = 0; i < a.length; i++)
    diff |= a[i] ^ b[i]
  return diff === 0
}

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    `raw`,
    new TextEncoder().encode(password),
    `PBKDF2`,
    false,
    [`deriveBits`],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: `PBKDF2`, hash: `SHA-256`, salt, iterations },
    key,
    HASH_BYTES * 8,
  )
  return new Uint8Array(bits)
}

export async function hashPassword(password: string): Promise<string> {
  const salt = new Uint8Array(SALT_BYTES)
  crypto.getRandomValues(salt)
  const hash = await derive(password, salt, PASSWORD_ITERATIONS)
  return [
    PASSWORD_ALG,
    String(PASSWORD_ITERATIONS),
    b64urlFromBytes(salt),
    b64urlFromBytes(hash),
  ].join(`$`)
}

export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  if (!stored)
    return false
  const [alg, iterationText, saltText, hashText] = stored.split(`$`)
  const iterations = Number(iterationText)
  if (alg !== PASSWORD_ALG || !Number.isInteger(iterations) || iterations < 100_000 || !saltText || !hashText)
    return false

  try {
    const expected = b64urlToBytes(hashText)
    const actual = await derive(password, b64urlToBytes(saltText), iterations)
    return timingSafeEqual(actual, expected)
  }
  catch {
    return false
  }
}
