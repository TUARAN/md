/**
 * Email verification code persistence and validation.
 */

export type EmailCodePurpose = 'register' | 'reset_password'

const CODE_TTL_SEC = 10 * 60
const MAX_ATTEMPTS = 5

function toHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)]
    .map(b => b.toString(16).padStart(2, `0`))
    .join(``)
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function generateEmailCode(): string {
  const buf = new Uint8Array(4)
  crypto.getRandomValues(buf)
  const n = new DataView(buf.buffer).getUint32(0) % 1_000_000
  return n.toString().padStart(6, `0`)
}

export async function hashEmailCode(
  secret: string,
  email: string,
  code: string,
  purpose: EmailCodePurpose,
): Promise<string> {
  const payload = `${normalizeEmail(email)}:${purpose}:${code}:${secret}`
  const digest = await crypto.subtle.digest(`SHA-256`, new TextEncoder().encode(payload))
  return toHex(digest)
}

export async function storeEmailCode(
  db: D1Database,
  params: {
    email: string
    code: string
    purpose: EmailCodePurpose
    secret: string
  },
): Promise<void> {
  const now = Math.floor(Date.now() / 1000)
  const email = normalizeEmail(params.email)
  const codeHash = await hashEmailCode(params.secret, email, params.code, params.purpose)

  await db
    .prepare(
      `INSERT INTO email_verification_codes
        (id, email, code_hash, purpose, expires_at, consumed_at, attempts, created_at)
       VALUES (?, ?, ?, ?, ?, NULL, 0, ?)`,
    )
    .bind(crypto.randomUUID(), email, codeHash, params.purpose, now + CODE_TTL_SEC, now)
    .run()
}

export async function consumeEmailCode(
  db: D1Database,
  params: {
    email: string
    code: string
    purpose: EmailCodePurpose
    secret: string
  },
): Promise<{ ok: true } | { ok: false, error: string }> {
  const now = Math.floor(Date.now() / 1000)
  const email = normalizeEmail(params.email)
  const row = await db
    .prepare(
      `SELECT * FROM email_verification_codes
       WHERE email = ? AND purpose = ? AND consumed_at IS NULL
       ORDER BY created_at DESC
       LIMIT 1`,
    )
    .bind(email, params.purpose)
    .first<{
    id: string
    code_hash: string
    expires_at: number
    attempts: number
  }>()

  if (!row)
    return { ok: false, error: `验证码不存在或已失效` }
  if (row.expires_at < now)
    return { ok: false, error: `验证码已过期` }
  if (row.attempts >= MAX_ATTEMPTS)
    return { ok: false, error: `验证码尝试次数过多，请重新发送` }

  const codeHash = await hashEmailCode(params.secret, email, params.code, params.purpose)
  if (codeHash !== row.code_hash) {
    await db
      .prepare(`UPDATE email_verification_codes SET attempts = attempts + 1 WHERE id = ?`)
      .bind(row.id)
      .run()
    return { ok: false, error: `验证码错误` }
  }

  await db
    .prepare(`UPDATE email_verification_codes SET consumed_at = ?, attempts = attempts + 1 WHERE id = ?`)
    .bind(now, row.id)
    .run()
  return { ok: true }
}
