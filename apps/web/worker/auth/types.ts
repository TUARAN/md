/**
 * Shared auth types for the Syncblog Worker.
 */

export interface UserRecord {
  id: string
  email: string | null
  password_hash: string | null
  login: string
  name: string | null
  avatar_url: string | null
  auth_provider: 'email' | 'legacy_github'
  email_verified_at: number | null
  /**
   * Stored plan label. Kept as a Pinned tier hint; **runtime** plan is
   *  derived from `pro_expires_at` so we never serve a stale Pro.
   */
  plan: 'free' | 'pro'
  ai_quota_used: number
  ai_quota_reset_at: number
  /** Unix seconds. When >= now, the user is Pro. 0 means never paid. */
  pro_expires_at: number
  created_at: number
  updated_at: number
}

/** Billing record stored in `subscriptions`. */
export interface SubscriptionRecord {
  id: string
  user_id: string
  provider: 'wechat' | 'alipay' | 'manual'
  provider_order_id: string | null
  provider_subscription_id: string | null
  sku: 'pro_monthly' | 'pro_yearly'
  status: 'pending' | 'active' | 'cancelled' | 'expired' | 'refunded'
  amount_cents: number
  currency: string
  started_at: number
  current_period_end: number
  cancelled_at: number | null
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
  iat: number
  exp: number
}
