import { SITE_OWNER_CREATOR_ID } from '@/constants/siteOwner'

/** 系统保留标签，不可被普通用户占用 */
export const RESERVED_CREATOR_IDS = new Set([
  SITE_OWNER_CREATOR_ID,
  `admin`,
  `api`,
  `settings`,
  `pricing`,
  `edit`,
  `sync`,
  `workflow`,
  `changelog`,
  `import`,
  `creator-offer`,
  `docs`,
  `matrix`,
  `distribution`,
  `stats`,
  `creation`,
  `data`,
])

export const CREATOR_ID_MIN_LEN = 3
export const CREATOR_ID_MAX_LEN = 48

export function slugifyCreatorId(raw: string): string {
  // 先 slice 再 strip 前后连字符：避免截断点恰好是 - 时尾部留 - 被后续 regex 拒掉
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, `-`)
    .slice(0, CREATOR_ID_MAX_LEN)
    .replace(/^-+|-+$/g, ``)
}

export function validateCreatorId(raw: string, opts?: { allowSiteOwnerId?: boolean }): string | null {
  const id = slugifyCreatorId(raw)
  if (id.length < CREATOR_ID_MIN_LEN)
    return `标签 ID 至少 ${CREATOR_ID_MIN_LEN} 个字符`
  if (!/^[a-z0-9][a-z0-9_-]*[a-z0-9]$/.test(id) && id.length >= 2)
    return `标签 ID 仅支持小写字母、数字、连字符与下划线，且需以字母或数字开头/结尾`
  if (!opts?.allowSiteOwnerId && RESERVED_CREATOR_IDS.has(id))
    return `标签 ID「${id}」已被系统保留`
  if (opts?.allowSiteOwnerId && id !== SITE_OWNER_CREATOR_ID && RESERVED_CREATOR_IDS.has(id))
    return `标签 ID「${id}」已被系统保留`
  return null
}
