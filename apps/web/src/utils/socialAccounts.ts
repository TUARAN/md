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

export const PLATFORM_HOME_URLS: Record<string, string> = {
  csdn: `https://blog.csdn.net`,
  juejin: `https://juejin.cn`,
  wechat: `https://mp.weixin.qq.com`,
  zhihu: `https://www.zhihu.com`,
  toutiao: `https://mp.toutiao.com`,
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
  bilibili: `https://space.bilibili.com`,
  weibo: `https://weibo.com`,
  aliyun: `https://developer.aliyun.com`,
  huaweicloud: `https://bbs.huaweicloud.com`,
  huaweidev: `https://developer.huawei.com/consumer/cn/blog`,
  twitter: `https://x.com`,
  qianfan: `https://qianfan.cloud.baidu.com`,
  alipayopen: `https://open.alipay.com/portal/forum`,
  modelscope: `https://modelscope.cn`,
  volcengine: `https://developer.volcengine.com`,
  douyin: `https://creator.douyin.com`,
  xiaohongshu: `https://creator.xiaohongshu.com`,
  elecfans: `https://www.elecfans.com`,
  douban: `https://www.douban.com`,
}

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

export function resolveSocialAccountUrl(account: PostAccount) {
  const raw = account as unknown as Record<string, unknown>
  const direct = firstString(raw, [`profileUrl`, `profile`, `url`, `homepage`, `home`])
  if (/^https?:\/\//i.test(direct))
    return direct

  const uid = encodeURIComponent(account.uid || ``)
  if (uid && !uid.includes(`-plugin`)) {
    const byType: Record<string, string> = {
      csdn: `https://blog.csdn.net/${uid}`,
      juejin: `https://juejin.cn/user/${uid}`,
      zhihu: `https://www.zhihu.com/people/${uid}`,
      bilibili: `https://space.bilibili.com/${uid}`,
      weibo: `https://weibo.com/u/${uid}`,
      xiaohongshu: `https://www.xiaohongshu.com/user/profile/${uid}`,
      douban: `https://www.douban.com/people/${uid}/`,
      twitter: `https://x.com/${uid}`,
    }
    if (byType[account.type])
      return byType[account.type]
  }

  return PLATFORM_HOME_URLS[account.type] || account.home || `#`
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

  return [...map.values()]
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
