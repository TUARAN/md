/**
 * Per-user AI quota.
 *
 * Window: UTC day. Counter resets the first time we see `now >= reset_at`.
 *
 * Limits are intentionally conservative for v1; revisit when we ship Pro
 * billing. `plan` lives on the user row so admins can manually flip users to
 * pro from the D1 console while billing isn't wired up.
 */

import type { PublicUser, UserRecord } from './types'

export const AI_QUOTA_LIMITS: Record<UserRecord['plan'], number> = {
  free: 10,
  pro: 1000,
}

/**
 * Effective plan = stored plan reconciled against `pro_expires_at`.
 *
 * Pro flows in via webhook → `pro_expires_at` is set to the end of the
 * paid period. When that expires (no renewal received) the user silently
 * drops back to Free without any explicit job — we just compute it.
 */
export function effectivePlan(user: UserRecord): UserRecord['plan'] {
  const nowSec = Math.floor(Date.now() / 1000)
  if (user.pro_expires_at && user.pro_expires_at >= nowSec)
    return `pro`
  return `free`
}

function nextUtcMidnight(nowMs: number): number {
  const d = new Date(nowMs)
  return Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate() + 1,
    0,
    0,
    0,
    0,
  ) / 1000
}

export interface QuotaSnapshot {
  used: number
  limit: number
  resetAt: number
}

/**
 * Atomically check & consume one unit of AI quota for the user.
 *
 * Returns the post-consume snapshot on success, or null when the user has
 * exhausted their quota for the current window.
 */
export async function consumeAiQuota(
  db: D1Database,
  user: UserRecord,
  increment = 1,
): Promise<QuotaSnapshot | null> {
  const nowSec = Math.floor(Date.now() / 1000)
  const limit = AI_QUOTA_LIMITS[effectivePlan(user)]

  // Window expired (or never set) → reset counter + window.
  if (!user.ai_quota_reset_at || nowSec >= user.ai_quota_reset_at) {
    const newReset = nextUtcMidnight(Date.now())
    if (increment > limit)
      return null
    await db
      .prepare(
        `UPDATE users SET ai_quota_used = ?, ai_quota_reset_at = ?, updated_at = ? WHERE id = ?`,
      )
      .bind(increment, newReset, nowSec, user.id)
      .run()
    return { used: increment, limit, resetAt: newReset }
  }

  const projected = user.ai_quota_used + increment
  if (projected > limit)
    return null

  // Optimistic update — race risk is minimal at our scale; if two requests
  // land in the same ms they may both succeed by 1 unit. Acceptable.
  await db
    .prepare(
      `UPDATE users SET ai_quota_used = ?, updated_at = ? WHERE id = ?`,
    )
    .bind(projected, nowSec, user.id)
    .run()
  return { used: projected, limit, resetAt: user.ai_quota_reset_at }
}

export function quotaSnapshotFor(user: UserRecord): QuotaSnapshot {
  const nowSec = Math.floor(Date.now() / 1000)
  const limit = AI_QUOTA_LIMITS[effectivePlan(user)]
  if (!user.ai_quota_reset_at || nowSec >= user.ai_quota_reset_at) {
    return { used: 0, limit, resetAt: nextUtcMidnight(Date.now()) }
  }
  return { used: user.ai_quota_used, limit, resetAt: user.ai_quota_reset_at }
}

export function toPublicUser(u: UserRecord): PublicUser {
  return {
    id: u.id,
    login: u.github_login,
    name: u.name,
    email: u.email,
    avatarUrl: u.avatar_url,
    plan: effectivePlan(u),
    aiQuota: quotaSnapshotFor(u),
  }
}
