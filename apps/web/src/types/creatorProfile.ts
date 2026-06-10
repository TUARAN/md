import type { PublicSocialAccount } from '@/utils/socialAccounts'

/** Server-persisted creator profile for a Syncblog account. */
export interface UserCreatorProfile {
  creatorId: string
  displayName: string
  tagline: string
  homepage: string | null
  contactHint: string | null
  socialAccounts: PublicSocialAccount[]
  shareEnabled: boolean
  shareToken: string | null
  updatedAt: number
}

/** Public read-only snapshot (no share token). */
export type PublicCreatorProfileView = Omit<UserCreatorProfile, 'shareToken'>

export interface UserCreatorProfilePayload {
  creatorId?: string
  displayName?: string
  tagline?: string
  homepage?: string | null
  contactHint?: string | null
  socialAccounts?: PublicSocialAccount[]
  shareEnabled?: boolean
  regenerateShareToken?: boolean
}
