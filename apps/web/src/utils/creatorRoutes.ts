const appBasePath = import.meta.env.BASE_URL.startsWith(`.`) ? `/` : import.meta.env.BASE_URL

export function getAppBasePath() {
  return appBasePath.replace(/\/$/, ``) || ``
}

/** 个人 IP 合作说明页，如 /md/creator-offer/tuaran */
export function creatorOfferRoute(creatorId: string) {
  const id = creatorId.trim().toLowerCase()
  return `${getAppBasePath()}/creator-offer/${encodeURIComponent(id)}`
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
