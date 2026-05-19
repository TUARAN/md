import type { PostAccount } from '@md/shared/types'

export interface PublicSocialAccount {
  type: string
  title: string
  displayName: string
  uid: string
  icon: string
  avatar?: string
  url: string
  loggedIn: boolean
  syncSource?: PostAccount[`syncSource`]
  followers?: string
  reads?: string
  updatedAt: number
}

export interface SocialAccountCategory {
  name: string
  platforms: string[]
}

export const SOCIAL_ACCOUNT_CATEGORIES: SocialAccountCategory[] = [
  {
    name: `媒体平台`,
    platforms: [`wechat`, `zhihu`, `baijiahao`, `wangyihao`, `sohu`, `weibo`, `bilibili`, `sspai`, `twitter`, `douyin`, `xiaohongshu`, `douban`, `toutiao`],
  },
  {
    name: `博客平台`,
    platforms: [`csdn`, `cnblogs`, `juejin`, `medium`, `cto51`, `segmentfault`, `oschina`, `infoq`, `jianshu`],
  },
  {
    name: `云平台及开发者社区`,
    platforms: [`tencentcloud`, `aliyun`, `huaweicloud`, `huaweidev`, `alipayopen`, `volcengine`, `elecfans`, `qianfan`, `modelscope`],
  },
]

export type CreatorKind = `blogger` | `developer` | `media` | `brand` | `custom`

export type CreatorModuleType = `social-accounts` | `content-cases` | `collaboration` | `performance`

export interface CreatorProfileModule<T = unknown> {
  type: CreatorModuleType
  title: string
  status: `ready` | `planned`
  data: T
}

export interface PublicCreatorProfile {
  schemaVersion: 1
  id: string
  kind: CreatorKind
  title: string
  subtitle: string
  updatedAt: number
  modules: CreatorProfileModule[]
}

/**
 * 创作者 TUARAN 在各平台的个人主页（写死兜底，非全站通用默认）。
 * 仅当扩展/缓存无法解析出 TUARAN 的真实主页，或只能落到平台门户时使用。
 * 维护说明见 docs/creator-profile-urls.md
 */
export const PLATFORM_DEFAULT_PROFILE_URLS: Record<string, string> = {
  csdn: `https://blog.csdn.net/aifs2025`,
  juejin: `https://juejin.cn/user/1521379823340792`,
  zhihu: `https://www.zhihu.com/people/tu-tu-tu-tu-tu-25-1`,
  toutiao: `https://www.toutiao.com/c/user/token/MS4wLjABAAAAqDPAgOjSsjLeLCA_T2AQUDIZsl29T4P4aymfpldAtA7cjg7FWpDigq4G2uwaHH7H/`,
  oschina: `https://my.oschina.net/u/9753726`,
  cto51: `https://blog.51cto.com/u_13961087`,
  infoq: `https://www.infoq.cn/profile/101F0D86A30093/publish`,
  baijiahao: `https://mbd.baidu.com/newspage/data/dtlandingwise?sourceFrom=baijiahao&nid=dt_4601215864081255881`,
  weibo: `https://weibo.com/u/7962821975`,
  xiaohongshu: `https://xhslink.com/m/7w6ONgVXPX6`,
  tencentcloud: `https://cloud.tencent.com/developer/user/7738744`,
  aliyun: `https://developer.aliyun.com/article/1723858`,
  huaweicloud: `https://bbs.huaweicloud.com/blogs/388492`,
  segmentfault: `https://segmentfault.com/u/aran_tu/articles`,
}

/** 默认主页对应平台在名片上的展示名（用于补全未检测到的账号） */
const PLATFORM_DEFAULT_DISPLAY_NAMES: Record<string, { title: string, displayName: string }> = {
  csdn: { title: `CSDN`, displayName: `aifs2025` },
  juejin: { title: `掘金`, displayName: `掘金安东尼` },
  zhihu: { title: `知乎`, displayName: `三十而立方` },
  toutiao: { title: `今日头条`, displayName: `掘金安东尼` },
  oschina: { title: `开源中国`, displayName: `TUARAN` },
  cto51: { title: `51CTO`, displayName: `u_13961087` },
  infoq: { title: `InfoQ`, displayName: `TUARAN` },
  baijiahao: { title: `百家号`, displayName: `TUARAN` },
  weibo: { title: `微博`, displayName: `TUARAN` },
  xiaohongshu: { title: `小红书`, displayName: `TUARAN` },
  tencentcloud: { title: `腾讯云`, displayName: `TUARAN` },
  aliyun: { title: `阿里云`, displayName: `TUARAN` },
  huaweicloud: { title: `华为云`, displayName: `TUARAN` },
  segmentfault: { title: `思否`, displayName: `aran_tu` },
}

/** 未单独校对平台时使用的 TUARAN 预估粉丝/阅读 */
const TUARAN_ESTIMATED_PROFILE_STATS = { followers: `100`, reads: `2万` } as const

/**
 * TUARAN 各平台粉丝/阅读静态快照（③，见 docs/creator-profile-urls.md「数据来源总览」）。
 * 优先级：COSE/CSYNC 检测 + localStorage 缓存（①②）> 本表；仅缺字段时用本表补位。
 */
export const PLATFORM_DEFAULT_PROFILE_STATS: Record<string, { followers: string, reads: string }> = {
  juejin: { followers: `11,834`, reads: `2,410,254` },
  zhihu: { followers: `345`, reads: `380,471` },
  toutiao: { followers: `709`, reads: `129,381` },
  xiaohongshu: { followers: `1.2万`, reads: `150万` },
  csdn: { ...TUARAN_ESTIMATED_PROFILE_STATS },
  oschina: { ...TUARAN_ESTIMATED_PROFILE_STATS },
  cto51: { ...TUARAN_ESTIMATED_PROFILE_STATS },
  infoq: { ...TUARAN_ESTIMATED_PROFILE_STATS },
  baijiahao: { ...TUARAN_ESTIMATED_PROFILE_STATS },
  weibo: { ...TUARAN_ESTIMATED_PROFILE_STATS },
  tencentcloud: { ...TUARAN_ESTIMATED_PROFILE_STATS },
  aliyun: { ...TUARAN_ESTIMATED_PROFILE_STATS },
  huaweicloud: { ...TUARAN_ESTIMATED_PROFILE_STATS },
  segmentfault: { ...TUARAN_ESTIMATED_PROFILE_STATS },
}

function applyDefaultProfileStats(account: PublicSocialAccount): PublicSocialAccount {
  const stats = PLATFORM_DEFAULT_PROFILE_STATS[account.type]
  if (!stats)
    return account
  return {
    ...account,
    followers: account.followers || stats.followers,
    reads: account.reads || stats.reads,
  }
}

/** 无个人 uid 时的平台门户（非编辑页） */
export const PLATFORM_HOME_URLS: Record<string, string> = {
  csdn: `https://blog.csdn.net`,
  juejin: `https://juejin.cn`,
  wechat: `https://mp.weixin.qq.com`,
  zhihu: `https://www.zhihu.com`,
  toutiao: `https://www.toutiao.com`,
  segmentfault: `https://segmentfault.com`,
  cnblogs: `https://www.cnblogs.com`,
  oschina: `https://my.oschina.net`,
  cto51: `https://blog.51cto.com`,
  infoq: `https://xie.infoq.cn`,
  jianshu: `https://www.jianshu.com`,
  baijiahao: `https://baijiahao.baidu.com`,
  wangyihao: `https://mp.163.com`,
  tencentcloud: `https://cloud.tencent.com/developer`,
  medium: `https://medium.com`,
  sspai: `https://sspai.com`,
  sohu: `https://mp.sohu.com`,
  bilibili: `https://www.bilibili.com`,
  weibo: `https://weibo.com`,
  aliyun: `https://developer.aliyun.com`,
  huaweicloud: `https://bbs.huaweicloud.com`,
  huaweidev: `https://developer.huawei.com/consumer/cn`,
  twitter: `https://x.com`,
  qianfan: `https://qianfan.cloud.baidu.com`,
  alipayopen: `https://open.alipay.com`,
  modelscope: `https://modelscope.cn`,
  volcengine: `https://developer.volcengine.com`,
  douyin: `https://www.douyin.com`,
  xiaohongshu: `https://www.xiaohongshu.com`,
  elecfans: `https://www.elecfans.com`,
  douban: `https://www.douban.com`,
}

/** 用平台 uid / 用户名拼个人主页（名片展示用，勿与同步用的编辑页混用） */
const PLATFORM_PROFILE_URL_BUILDERS: Record<string, (uid: string) => string> = {
  csdn: uid => `https://blog.csdn.net/${uid}`,
  juejin: uid => `https://juejin.cn/user/${uid}`,
  zhihu: uid => `https://www.zhihu.com/people/${uid}`,
  bilibili: uid => `https://space.bilibili.com/${uid}`,
  weibo: uid => `https://weibo.com/u/${uid}`,
  xiaohongshu: uid => `https://www.xiaohongshu.com/user/profile/${uid}`,
  douban: uid => `https://www.douban.com/people/${uid}/`,
  twitter: uid => `https://x.com/${uid}`,
  cnblogs: uid => `https://www.cnblogs.com/${uid}`,
  segmentfault: uid => `https://segmentfault.com/u/${uid}`,
  oschina: uid => `https://my.oschina.net/u/${uid}`,
  cto51: uid => `https://blog.51cto.com/${uid}`,
  infoq: uid => `https://xie.infoq.cn/u/${uid}`,
  jianshu: uid => `https://www.jianshu.com/u/${uid}`,
  medium: uid => `https://medium.com/@${uid.replace(/^@/, ``)}`,
  tencentcloud: uid => `https://cloud.tencent.com/developer/user/${uid}`,
  aliyun: uid => `https://developer.aliyun.com/u/${uid}`,
  huaweicloud: uid => `https://bbs.huaweicloud.com/community/users/${uid}`,
  huaweidev: uid => `https://developer.huawei.com/consumer/cn/community/home/${uid}`,
  volcengine: uid => `https://developer.volcengine.com/user/${uid}`,
  elecfans: uid => `https://www.elecfans.com/u/${uid}`,
  modelscope: uid => `https://modelscope.cn/profile/${uid}`,
  sspai: uid => `https://sspai.com/u/${uid}`,
  toutiao: uid => `https://www.toutiao.com/c/user/token/${uid}`,
  douyin: uid => `https://www.douyin.com/user/${uid}`,
  sohu: uid => `https://mp.sohu.com/profile/${uid}`,
  baijiahao: uid => `https://author.baidu.com/home/${uid}`,
  wangyihao: uid => `https://mp.163.com/v2/homepage/profile/${uid}`,
  qianfan: uid => `https://qianfan.cloud.baidu.com/qianfandev/u/${uid}`,
  alipayopen: uid => `https://open.alipay.com/portal/forum/user/${uid}`,
}

const EDITOR_PUBLISH_URL_HINTS = [
  /\/edit(?:\/|$|[?#])/i,
  /\/write(?:\/|$|[?#])/i,
  /\/publish(?:\/|$|[?#])/i,
  /\/create(?:\/|$|[?#])/i,
  /\/draft(?:\/|$|[?#])/i,
  /\/sign[_-]?in/i,
  /\/login/i,
  /passport\./i,
  /\/compose\//i,
  /article-publish/i,
  /blogger\/publish/i,
  /note\/create/i,
  /post\/add/i,
  /articles\/edit/i,
  /topic\/create/i,
  /learn\/create/i,
  /content\/post/i,
  /target=article/i,
  /\/d\/article\//i,
  /mpfe\/v4\/login/i,
  /account\..*\/login/i,
  /creator-micro/i,
  /zhuanlan\.zhihu\.com\/write/i,
  /creator\.xiaohongshu\.com/i,
  /creator\.douyin\.com/i,
]

const CSDN_RESERVED_PATH_SEGMENTS = new Set([
  `article`,
  `rank`,
  `nav`,
  `download`,
  `community`,
  `ask`,
])

function asString(value: unknown) {
  return typeof value === `string` || typeof value === `number` ? String(value).trim() : ``
}

function firstString(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = asString(row[key])
    if (value)
      return value
  }
  return ``
}

function isEditorOrPublishUrl(url: string) {
  return EDITOR_PUBLISH_URL_HINTS.some(pattern => pattern.test(url))
}

function isLikelyProfileUrl(url: string) {
  if (!/^https?:\/\//i.test(url))
    return false
  return !isEditorOrPublishUrl(url)
}

function sanitizeProfileUid(uid: string) {
  const trimmed = uid.trim()
  if (!trimmed || trimmed.includes(`-plugin`))
    return ``
  return trimmed
}

function isWeakProfileUid(uid: string, type: string) {
  const clean = sanitizeProfileUid(uid)
  if (!clean)
    return true
  if (clean === type)
    return true
  return false
}

function getDefaultProfileUrl(type: string) {
  return PLATFORM_DEFAULT_PROFILE_URLS[type] ?? null
}

/** 是否为平台门户首页（非个人主页） */
function isGenericPortalUrl(url: string, type: string) {
  if (!url || url === `#`)
    return true
  const portal = PLATFORM_HOME_URLS[type]
  if (portal && url.replace(/\/$/, ``) === portal.replace(/\/$/, ``))
    return true
  try {
    const parsed = new URL(url)
    const portalParsed = portal ? new URL(portal) : null
    if (portalParsed && parsed.origin === portalParsed.origin) {
      const path = parsed.pathname.replace(/\/$/, ``) || `/`
      const portalPath = portalParsed.pathname.replace(/\/$/, ``) || `/`
      if (path === portalPath || path === `/`)
        return true
    }
  }
  catch {
    return true
  }
  return false
}

function shouldUseDefaultProfileUrl(type: string, resolved: string, uid: string) {
  const defaultUrl = getDefaultProfileUrl(type)
  if (!defaultUrl)
    return false
  if (resolved === defaultUrl)
    return false
  if (isGenericPortalUrl(resolved, type) || isEditorOrPublishUrl(resolved) || resolved === `#`)
    return true
  if (isWeakProfileUid(uid, type))
    return true
  return false
}

function resolveWithDefaultFallback(type: string, uid: string, resolved: string) {
  if (shouldUseDefaultProfileUrl(type, resolved, uid)) {
    const defaultUrl = getDefaultProfileUrl(type)
    if (defaultUrl)
      return defaultUrl
  }
  return resolved
}

function buildProfileUrlByType(type: string, uid: string) {
  const cleanUid = sanitizeProfileUid(uid)
  if (!cleanUid)
    return null
  const builder = PLATFORM_PROFILE_URL_BUILDERS[type]
  if (!builder)
    return null
  return builder(cleanUid)
}

function extractUidFromPlatformUrl(type: string, url: string): string | null {
  try {
    const parsed = new URL(url)
    const path = parsed.pathname

    switch (type) {
      case `csdn`: {
        const seg = path.split(`/`).filter(Boolean)[0]
        if (seg && !CSDN_RESERVED_PATH_SEGMENTS.has(seg.toLowerCase()))
          return seg
        break
      }
      case `juejin`: {
        const m = path.match(/\/user\/([^/]+)/)
        if (m?.[1])
          return m[1]
        break
      }
      case `zhihu`: {
        const m = path.match(/\/people\/([^/]+)/)
        if (m?.[1])
          return m[1]
        break
      }
      case `bilibili`: {
        const m = path.match(/\/(?:space\/)?(\d+)/)
        if (m?.[1])
          return m[1]
        break
      }
      case `weibo`: {
        const m = path.match(/\/u\/([^/]+)/)
        if (m?.[1])
          return m[1]
        break
      }
      case `cnblogs`:
      case `cto51`: {
        const seg = path.split(`/`).filter(Boolean)[0]
        if (seg && ![`articles`, `blogger`].includes(seg))
          return seg
        break
      }
      case `segmentfault`: {
        const m = path.match(/\/u\/([^/]+)/)
        if (m?.[1])
          return m[1]
        break
      }
      case `oschina`: {
        const m = path.match(/\/u\/([^/]+)/)
        if (m?.[1])
          return m[1]
        break
      }
      case `jianshu`: {
        const m = path.match(/\/u\/([^/]+)/)
        if (m?.[1])
          return m[1]
        break
      }
      case `infoq`: {
        const m = path.match(/\/u\/([^/]+)/)
        if (m?.[1])
          return m[1]
        break
      }
      case `medium`: {
        const m = path.match(/\/@([^/]+)/)
        if (m?.[1])
          return m[1]
        break
      }
      case `xiaohongshu`: {
        const m = path.match(/\/user\/profile\/([^/]+)/)
        if (m?.[1])
          return m[1]
        break
      }
      case `douban`: {
        const m = path.match(/\/people\/([^/]+)/)
        if (m?.[1])
          return m[1]
        break
      }
      case `twitter`: {
        const seg = path.split(`/`).filter(Boolean)[0]
        if (seg && ![`compose`, `home`, `i`].includes(seg))
          return seg
        break
      }
      case `douyin`: {
        const m = path.match(/\/user\/([^/]+)/)
        if (m?.[1])
          return m[1]
        break
      }
      default:
        break
    }
  }
  catch {
    return null
  }
  return null
}

function resolveProfileUid(account: PostAccount, raw: Record<string, unknown>) {
  const fromAccount = sanitizeProfileUid(account.uid || ``)
  if (fromAccount && !isWeakProfileUid(fromAccount, account.type))
    return fromAccount

  for (const key of [`profileUrl`, `profile`, `homepage`, `home`, `url`]) {
    const value = firstString(raw, [key])
    if (!value)
      continue
    const extracted = extractUidFromPlatformUrl(account.type, value)
    if (extracted)
      return extracted
  }
  return ``
}

/**
 * 名片展示用主页链接。同步扩展里的 home/url 多为编辑页，此处优先拼「我的主页」；
 * 仍无法得到个人主页时，使用 PLATFORM_DEFAULT_PROFILE_URLS，再退回平台门户。
 */
export function resolveSocialAccountUrl(account: PostAccount) {
  const raw = account as unknown as Record<string, unknown>
  const uidForFallback = sanitizeProfileUid(account.uid || ``) || account.type

  for (const key of [`profileUrl`, `profile`, `homepage`]) {
    const explicit = firstString(raw, [key])
    if (isLikelyProfileUrl(explicit))
      return resolveWithDefaultFallback(account.type, uidForFallback, explicit)
  }

  const uid = resolveProfileUid(account, raw)
  const built = uid ? buildProfileUrlByType(account.type, uid) : null
  if (built)
    return resolveWithDefaultFallback(account.type, uidForFallback, built)

  for (const key of [`home`, `url`]) {
    const candidate = firstString(raw, [key])
    if (isLikelyProfileUrl(candidate))
      return resolveWithDefaultFallback(account.type, uidForFallback, candidate)
    if (/^https?:\/\//i.test(candidate)) {
      const fromEditorPath = extractUidFromPlatformUrl(account.type, candidate)
      const rebuilt = fromEditorPath ? buildProfileUrlByType(account.type, fromEditorPath) : null
      if (rebuilt)
        return resolveWithDefaultFallback(account.type, uidForFallback, rebuilt)
    }
  }

  const portal = PLATFORM_HOME_URLS[account.type] || `#`
  return resolveWithDefaultFallback(account.type, uidForFallback, portal)
}

function createDefaultPublicAccount(type: string): PublicSocialAccount {
  const meta = PLATFORM_DEFAULT_DISPLAY_NAMES[type]
  const url = PLATFORM_DEFAULT_PROFILE_URLS[type]!
  return applyDefaultProfileStats({
    type,
    title: meta?.title ?? type,
    displayName: meta?.displayName ?? `TUARAN`,
    uid: type,
    icon: ``,
    url,
    loggedIn: true,
    updatedAt: Date.now(),
  })
}

/**
 * 合并默认主页配置：补全未检测到的平台，并修正仍为门户首页的链接。
 */
export function mergeDefaultProfileAccounts(accounts: PublicSocialAccount[]): PublicSocialAccount[] {
  const map = new Map(accounts.map(account => [account.type, account]))

  for (const type of Object.keys(PLATFORM_DEFAULT_PROFILE_URLS)) {
    const existing = map.get(type)
    if (!existing) {
      map.set(type, createDefaultPublicAccount(type))
      continue
    }

    const resolved = resolveSocialAccountUrl({
      type: existing.type,
      uid: existing.uid,
      displayName: existing.displayName,
      home: existing.url,
      icon: existing.icon,
      title: existing.title,
      checked: false,
      loggedIn: existing.loggedIn,
    })

    const next = resolved !== existing.url
      ? { ...existing, url: resolved, updatedAt: Date.now() }
      : existing
    map.set(type, applyDefaultProfileStats(next))
  }

  return [...map.values()]
}

export function normalizePublicSocialAccounts(accounts: PostAccount[]) {
  const now = Date.now()
  const publicRows = accounts
    .filter(account => account.loggedIn)
    .map((account) => {
      const raw = account as unknown as Record<string, unknown>
      const followers = firstString(raw, [`followers`, `followerCount`, `fans`, `fansCount`, `fanCount`])
      const reads = firstString(raw, [`reads`, `readCount`, `viewCount`, `views`, `totalReads`])
      return {
        type: account.type,
        title: account.title,
        displayName: account.displayName || `已登录`,
        uid: account.uid || account.type,
        icon: account.icon,
        avatar: account.avatar,
        url: resolveSocialAccountUrl(account),
        loggedIn: !!account.loggedIn,
        syncSource: account.syncSource,
        followers,
        reads,
        updatedAt: now,
      } satisfies PublicSocialAccount
    })

  const map = new Map<string, PublicSocialAccount>()
  for (const row of publicRows)
    map.set(`${row.type}:${row.uid}:${row.displayName}`, row)

  return mergeDefaultProfileAccounts(applyProfileHomeUrls([...map.values()]))
}

/** 将已缓存账号的 url 纠正为个人主页（兼容旧数据里残留的编辑页链接） */
export function applyProfileHomeUrls(accounts: PublicSocialAccount[]): PublicSocialAccount[] {
  return accounts.map((account) => {
    const url = resolveSocialAccountUrl({
      type: account.type,
      uid: account.uid,
      displayName: account.displayName,
      home: account.url,
      icon: account.icon,
      title: account.title,
      checked: false,
      loggedIn: account.loggedIn,
    })
    return url === account.url ? account : { ...account, url }
  })
}

export function repairCreatorProfile(profile: PublicCreatorProfile): PublicCreatorProfile {
  const accounts = mergeDefaultProfileAccounts(applyProfileHomeUrls(getCreatorProfileAccounts(profile)))
  return {
    ...profile,
    modules: profile.modules.map(module =>
      module.type === `social-accounts`
        ? { ...module, data: accounts }
        : module,
    ),
  }
}

export function createCreatorProfile(accounts: PublicSocialAccount[]): PublicCreatorProfile {
  const updatedAt = Math.max(Date.now(), ...accounts.map(account => account.updatedAt || 0))
  return {
    schemaVersion: 1,
    id: `TUARAN`,
    kind: `blogger`,
    title: `创作名片`,
    subtitle: `平台主页导航与品牌合作入口`,
    updatedAt,
    modules: [
      {
        type: `social-accounts`,
        title: `账号矩阵`,
        status: `ready`,
        data: accounts,
      },
      {
        type: `content-cases`,
        title: `内容案例`,
        status: `planned`,
        data: [],
      },
      {
        type: `collaboration`,
        title: `合作方式`,
        status: `planned`,
        data: {},
      },
      {
        type: `performance`,
        title: `数据表现`,
        status: `planned`,
        data: {},
      },
    ],
  }
}

export function getCreatorProfileAccounts(profile: PublicCreatorProfile) {
  const module = profile.modules.find(item => item.type === `social-accounts`)
  return Array.isArray(module?.data) ? module.data as PublicSocialAccount[] : []
}

export function encodeCreatorProfile(profile: PublicCreatorProfile) {
  const json = JSON.stringify(profile)
  return btoa(encodeURIComponent(json))
}

export function decodeCreatorProfile(data: string) {
  try {
    const json = decodeURIComponent(atob(data))
    const parsed = JSON.parse(json)
    if (parsed && typeof parsed === `object` && Array.isArray(parsed.modules)) {
      return {
        id: `TUARAN`,
        ...parsed,
      } as PublicCreatorProfile
    }
    if (Array.isArray(parsed))
      return createCreatorProfile(parsed as PublicSocialAccount[])
    return null
  }
  catch {
    return null
  }
}
