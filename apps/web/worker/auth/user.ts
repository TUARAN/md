/**
 * D1 access helpers for the users table.
 */

import type { UserRecord } from './types'

export interface GitHubProfile {
  id: number
  login: string
  email: string | null
  name: string | null
  avatar_url: string | null
}

export async function upsertUserFromGitHub(
  db: D1Database,
  profile: GitHubProfile,
): Promise<UserRecord> {
  const now = Math.floor(Date.now() / 1000)

  const existing = await db
    .prepare(`SELECT * FROM users WHERE github_id = ?`)
    .bind(profile.id)
    .first<UserRecord>()

  if (existing) {
    await db
      .prepare(
        `UPDATE users SET github_login = ?, email = ?, name = ?, avatar_url = ?, updated_at = ? WHERE id = ?`,
      )
      .bind(
        profile.login,
        profile.email,
        profile.name,
        profile.avatar_url,
        now,
        existing.id,
      )
      .run()
    return {
      ...existing,
      github_login: profile.login,
      email: profile.email,
      name: profile.name,
      avatar_url: profile.avatar_url,
      updated_at: now,
    }
  }

  const id = crypto.randomUUID()
  await db
    .prepare(
      `INSERT INTO users (id, github_id, github_login, email, name, avatar_url, plan, ai_quota_used, ai_quota_reset_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      profile.id,
      profile.login,
      profile.email,
      profile.name,
      profile.avatar_url,
      `free`,
      0,
      0,
      now,
      now,
    )
    .run()

  return {
    id,
    github_id: profile.id,
    github_login: profile.login,
    email: profile.email,
    name: profile.name,
    avatar_url: profile.avatar_url,
    plan: `free`,
    ai_quota_used: 0,
    ai_quota_reset_at: 0,
    created_at: now,
    updated_at: now,
  }
}

export async function getUserById(db: D1Database, id: string): Promise<UserRecord | null> {
  const row = await db.prepare(`SELECT * FROM users WHERE id = ?`).bind(id).first<UserRecord>()
  return row ?? null
}
