/**
 * Shared auth types for the Syncblog Worker.
 */

export interface UserRecord {
  id: string
  github_id: number
  github_login: string
  email: string | null
  name: string | null
  avatar_url: string | null
  plan: 'free' | 'pro'
  ai_quota_used: number
  ai_quota_reset_at: number
  created_at: number
  updated_at: number
}

/** Public-safe shape returned to the frontend. */
export interface PublicUser {
  id: string
  login: string
  name: string | null
  email: string | null
  avatarUrl: string | null
  plan: 'free' | 'pro'
  aiQuota: {
    used: number
    limit: number
    resetAt: number
  }
}

export interface SessionClaims {
  sub: string // syncblog user id
  ghi: number // github id (for quick legacy lookup if needed)
  iat: number
  exp: number
}
