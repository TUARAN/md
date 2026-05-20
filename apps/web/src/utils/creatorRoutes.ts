const appBasePath = import.meta.env.BASE_URL.startsWith(`.`) ? `/` : import.meta.env.BASE_URL

export function getAppBasePath() {
  return appBasePath.replace(/\/$/, ``) || ``
}

/** 创作名片主锚点（与工作流「内容同步」对应） */
export const CREATOR_CARD_HASH = `content-sync`

/** 个人 IP 合作说明页，如 /md/creator-offer/tuaran */
export function creatorOfferRoute(creatorId: string, hash = ``) {
  const id = creatorId.trim().toLowerCase()
  const path = `${getAppBasePath()}/creator-offer/${encodeURIComponent(id)}`
  const normalizedHash = hash.replace(/^#/, ``)
  return normalizedHash ? `${path}#${normalizedHash}` : path
}

/** 创作名片（对外主入口） */
export function creatorCardRoute(creatorId: string) {
  return creatorOfferRoute(creatorId, CREATOR_CARD_HASH)
}

export function parseCreatorOfferId(pathname: string) {
  const match = pathname.match(/\/creator-offer\/([^/]+)\/?$/i)
  if (!match?.[1])
    return null
  try {
    return decodeURIComponent(match[1]).trim().toLowerCase()
  }
  catch {
    return null
  }
}

export function isCreatorOfferPath(pathname: string) {
  return parseCreatorOfferId(pathname) !== null
}
