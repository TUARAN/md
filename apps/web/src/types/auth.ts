/**
 * Public-safe user shape returned by the Worker `/api/auth/me`.
 *
 * Keep in sync with `apps/web/worker/auth/types.ts`.
 */

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
    /** Unix epoch seconds at which the quota window resets. */
    resetAt: number
  }
}
