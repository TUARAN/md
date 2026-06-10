import { TUARAN_CREATOR_ID } from '@/constants/creatorOffer'

/** 站长账号：安东尼 / tuaran 创作名片仅绑定此邮箱 */
export const SITE_OWNER_EMAIL = `tuaran666@gmail.com`

export const SITE_OWNER_CREATOR_ID = TUARAN_CREATOR_ID

export function isSiteOwnerEmail(email: string | null | undefined): boolean {
  return (email ?? ``).trim().toLowerCase() === SITE_OWNER_EMAIL
}

export function isSiteOwnerCreatorId(creatorId: string): boolean {
  return creatorId.trim().toLowerCase() === SITE_OWNER_CREATOR_ID
}
