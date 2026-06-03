/**
 * D1 access helpers for email-auth users.
 */

import type { UserRecord } from './types'

function defaultLoginFromEmail(email: string): string {
  const local = email.split(`@`)[0]?.trim() || `user`
  return local.replace(/[^\w.-]+/g, `-`).slice(0, 48) || `user`
}

export async function createEmailUser(
  db: D1Database,
  params: {
    email: string
    passwordHash: string
  },
): Promise<UserRecord> {
  const now = Math.floor(Date.now() / 1000)
  const id = crypto.randomUUID()
  const login = defaultLoginFromEmail(params.email)

  await db
    .prepare(
      `INSERT INTO users
        (id, email, password_hash, login, name, avatar_url, auth_provider,
         email_verified_at, plan, ai_quota_used, ai_quota_reset_at,
         pro_expires_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, NULL, NULL, 'email', ?, 'free', 0, 0, 0, ?, ?)`,
    )
    .bind(id, params.email, params.passwordHash, login, now, now, now)
    .run()

  return {
    id,
    email: params.email,
    password_hash: params.passwordHash,
    login,
    name: null,
    avatar_url: null,
    auth_provider: `email`,
    email_verified_at: now,
    plan: `free`,
    ai_quota_used: 0,
    ai_quota_reset_at: 0,
    pro_expires_at: 0,
    created_at: now,
    updated_at: now,
  }
}

export async function getUserByEmail(db: D1Database, email: string): Promise<UserRecord | null> {
  const row = await db
    .prepare(`SELECT * FROM users WHERE lower(email) = lower(?)`)
    .bind(email)
    .first<UserRecord>()
  return row ?? null
}

export async function getUserById(db: D1Database, id: string): Promise<UserRecord | null> {
  const row = await db.prepare(`SELECT * FROM users WHERE id = ?`).bind(id).first<UserRecord>()
  return row ?? null
}
