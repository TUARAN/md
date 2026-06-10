/**
 * 创作名片(`/creator-offer/:creatorId`)路径辅助。
 *
 * 历史上还有 `/creator-profile` 平台矩阵页,2026-05 已合并入工作流 `/matrix` 路由,
 * 相关 helper(`creatorPlatformMatrixRoute`、`parseCreatorIdFromSearch`)随之删除。
 */

const appBasePath = import.meta.env.BASE_URL.startsWith(`.`) ? `/` : import.meta.env.BASE_URL

export function getAppBasePath() {
  return appBasePath.replace(/\/$/, ``) || ``
}

/** 创作名片主锚点(creator-offer 页面内的主区块) */
export const CREATOR_CARD_HASH = `content-sync`

/** 个人 IP 合作说明页（需登录）,如 /md/creator-offer/tuaran */
export function creatorOfferRoute(creatorId: string, hash = ``) {
  const id = creatorId.trim().toLowerCase()
  const path = `${getAppBasePath()}/creator-offer/${encodeURIComponent(id)}`
  const normalizedHash = hash.replace(/^#/, ``)
  return normalizedHash ? `${path}#${normalizedHash}` : path
}

/** 创作名片(对外主入口),自动滚动到 CREATOR_CARD_HASH 区块 */
export function creatorCardRoute(creatorId: string) {
  return creatorOfferRoute(creatorId, CREATOR_CARD_HASH)
}
