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
  if (fromAccount)
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
 * 名片展示用主页链接。同步扩展里的 home/url 多为编辑页，此处优先拼「我的主页」。
 */
export function resolveSocialAccountUrl(account: PostAccount) {
  const raw = account as unknown as Record<string, unknown>

  for (const key of [`profileUrl`, `profile`, `homepage`]) {
    const explicit = firstString(raw, [key])
    if (isLikelyProfileUrl(explicit))
      return explicit
  }

  const uid = resolveProfileUid(account, raw)
  const built = buildProfileUrlByType(account.type, uid)
  if (built)
    return built

  for (const key of [`home`, `url`]) {
    const candidate = firstString(raw, [key])
    if (isLikelyProfileUrl(candidate))
      return candidate
    if (/^https?:\/\//i.test(candidate)) {
      const fromEditorPath = extractUidFromPlatformUrl(account.type, candidate)
      const rebuilt = fromEditorPath ? buildProfileUrlByType(account.type, fromEditorPath) : null
      if (rebuilt)
        return rebuilt
    }
  }

  return PLATFORM_HOME_URLS[account.type] || `#`
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

  return applyProfileHomeUrls([...map.values()])
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
  const accounts = applyProfileHomeUrls(getCreatorProfileAccounts(profile))
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
