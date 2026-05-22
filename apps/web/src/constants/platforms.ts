/**
 * 内容分发平台单一注册表。
 *
 * 平台的 type / 展示名 / 分类 / 登录入口 / 门户首页此处唯一定义，
 * 发布弹窗、登录链接、名片矩阵、宣发策略等全部从这里派生，避免多份清单各自漂移。
 *
 * canonical type 取 `x`：X（原 Twitter）全站统一用 `x`。
 * 历史遗留的 `twitter`（旧 COSE key / 旧本地缓存）通过 normalizePlatformType 收敛到 `x`。
 */

export type PlatformCategoryId = `media` | `blog` | `cloud`

export interface PlatformDef {
  /** canonical 平台 key（与 COSE/CSYNC 扩展上报一致） */
  type: string
  /** 展示名（发布弹窗、矩阵、宣发页共用） */
  title: string
  category: PlatformCategoryId
  /** 发布弹窗「登录」入口 */
  loginUrl: string
  /** 平台门户首页（无个人 uid 时的兜底） */
  homeUrl: string
}

export const PLATFORM_CATEGORY_LABELS: Record<PlatformCategoryId, string> = {
  media: `媒体平台`,
  blog: `博客平台`,
  cloud: `云平台及开发者社区`,
}

/** 旧 key → canonical key。新增别名只能往这里加。 */
const PLATFORM_TYPE_ALIASES: Record<string, string> = {
  twitter: `x`,
}

/** 把任意来源的平台 type 收敛成 canonical key */
export function normalizePlatformType(type: string): string {
  const t = (type ?? ``).trim().toLowerCase()
  return PLATFORM_TYPE_ALIASES[t] ?? t
}

export const PLATFORM_REGISTRY: PlatformDef[] = [
  // —— 媒体平台 ——
  { type: `wechat`, title: `公众号`, category: `media`, loginUrl: `https://mp.weixin.qq.com`, homeUrl: `https://mp.weixin.qq.com` },
  { type: `zhihu`, title: `知乎`, category: `media`, loginUrl: `https://www.zhihu.com/signin`, homeUrl: `https://www.zhihu.com` },
  { type: `baijiahao`, title: `百家号`, category: `media`, loginUrl: `https://baijiahao.baidu.com`, homeUrl: `https://baijiahao.baidu.com` },
  { type: `wangyihao`, title: `网易号`, category: `media`, loginUrl: `https://mp.163.com/subscribe_v4/index.html#/article-publish`, homeUrl: `https://mp.163.com` },
  { type: `sohu`, title: `搜狐号`, category: `media`, loginUrl: `https://mp.sohu.com/mpfe/v4/login`, homeUrl: `https://mp.sohu.com` },
  { type: `weibo`, title: `微博`, category: `media`, loginUrl: `https://passport.weibo.com/sso/signin`, homeUrl: `https://weibo.com` },
  { type: `bilibili`, title: `哔哩哔哩`, category: `media`, loginUrl: `https://passport.bilibili.com/login`, homeUrl: `https://www.bilibili.com` },
  { type: `sspai`, title: `少数派`, category: `media`, loginUrl: `https://sspai.com/write`, homeUrl: `https://sspai.com` },
  { type: `x`, title: `X`, category: `media`, loginUrl: `https://x.com/compose/articles/edit/`, homeUrl: `https://x.com` },
  { type: `douyin`, title: `抖音`, category: `media`, loginUrl: `https://creator.douyin.com/creator-micro/content/post/article?default-tab=5&enter_from=publish_page&media_type=article&type=new`, homeUrl: `https://www.douyin.com` },
  { type: `xiaohongshu`, title: `小红书`, category: `media`, loginUrl: `https://creator.xiaohongshu.com/publish/publish?from=menu&target=article`, homeUrl: `https://www.xiaohongshu.com` },
  { type: `douban`, title: `豆瓣`, category: `media`, loginUrl: `https://www.douban.com/note/create`, homeUrl: `https://www.douban.com` },
  { type: `toutiao`, title: `今日头条`, category: `media`, loginUrl: `https://mp.toutiao.com`, homeUrl: `https://www.toutiao.com` },

  // —— 博客平台 ——
  { type: `csdn`, title: `CSDN`, category: `blog`, loginUrl: `https://blog.csdn.net`, homeUrl: `https://blog.csdn.net` },
  { type: `cnblogs`, title: `博客园`, category: `blog`, loginUrl: `https://i.cnblogs.com/articles/edit`, homeUrl: `https://www.cnblogs.com` },
  { type: `juejin`, title: `掘金`, category: `blog`, loginUrl: `https://juejin.cn`, homeUrl: `https://juejin.cn` },
  { type: `medium`, title: `Medium`, category: `blog`, loginUrl: `https://medium.com/m/signin`, homeUrl: `https://medium.com` },
  { type: `cto51`, title: `51CTO`, category: `blog`, loginUrl: `https://blog.51cto.com/blogger/publish?&newBloger=2`, homeUrl: `https://blog.51cto.com` },
  { type: `segmentfault`, title: `思否`, category: `blog`, loginUrl: `https://segmentfault.com/write?freshman=1`, homeUrl: `https://segmentfault.com` },
  { type: `oschina`, title: `开源中国`, category: `blog`, loginUrl: `https://my.oschina.net/blog/write`, homeUrl: `https://my.oschina.net` },
  { type: `infoq`, title: `InfoQ`, category: `blog`, loginUrl: `https://xie.infoq.cn/draft/`, homeUrl: `https://xie.infoq.cn` },
  { type: `jianshu`, title: `简书`, category: `blog`, loginUrl: `https://www.jianshu.com/sign_in`, homeUrl: `https://www.jianshu.com` },

  // —— 云平台及开发者社区 ——
  { type: `tencentcloud`, title: `腾讯云`, category: `cloud`, loginUrl: `https://cloud.tencent.com/developer`, homeUrl: `https://cloud.tencent.com/developer` },
  { type: `aliyun`, title: `阿里云`, category: `cloud`, loginUrl: `https://account.aliyun.com/login/login.htm`, homeUrl: `https://developer.aliyun.com` },
  { type: `huaweicloud`, title: `华为云`, category: `cloud`, loginUrl: `https://bbs.huaweicloud.com/blogs/article`, homeUrl: `https://bbs.huaweicloud.com` },
  { type: `huaweidev`, title: `华为开发者`, category: `cloud`, loginUrl: `https://developer.huawei.com/consumer/cn/blog/create`, homeUrl: `https://developer.huawei.com/consumer/cn` },
  { type: `alipayopen`, title: `支付宝开放平台`, category: `cloud`, loginUrl: `https://open.alipay.com/portal/forum/post/add#article`, homeUrl: `https://open.alipay.com` },
  { type: `volcengine`, title: `火山引擎`, category: `cloud`, loginUrl: `https://developer.volcengine.com/articles/draft`, homeUrl: `https://developer.volcengine.com` },
  { type: `elecfans`, title: `电子发烧友`, category: `cloud`, loginUrl: `https://www.elecfans.com/d/article/md/`, homeUrl: `https://www.elecfans.com` },
  { type: `qianfan`, title: `百度千帆`, category: `cloud`, loginUrl: `https://qianfan.cloud.baidu.com/qianfandev/topic/create`, homeUrl: `https://qianfan.cloud.baidu.com` },
  { type: `modelscope`, title: `魔搭社区`, category: `cloud`, loginUrl: `https://modelscope.cn/learn/create`, homeUrl: `https://modelscope.cn` },
]

const PLATFORM_BY_TYPE: Record<string, PlatformDef> = Object.fromEntries(
  PLATFORM_REGISTRY.map(p => [p.type, p]),
)

/** 取平台定义（先收敛别名）；未知 type 返回 undefined */
export function getPlatform(type: string): PlatformDef | undefined {
  return PLATFORM_BY_TYPE[normalizePlatformType(type)]
}

/** 平台展示名；未知 type 回落到 type 本身 */
export function getPlatformTitle(type: string): string {
  return getPlatform(type)?.title ?? normalizePlatformType(type)
}

/** 发布弹窗「登录」入口；未知 type 返回 `#` */
export function getPlatformLoginUrl(type: string): string {
  return getPlatform(type)?.loginUrl ?? `#`
}

/** 平台门户首页；未知 type 返回 `#` */
export function getPlatformHomeUrl(type: string): string {
  return getPlatform(type)?.homeUrl ?? `#`
}

export interface PlatformCategory {
  name: string
  platforms: string[]
}

/** 按分类分组的平台清单（发布弹窗 / 名片矩阵共用） */
export const PLATFORM_CATEGORIES: PlatformCategory[] = (
  [`media`, `blog`, `cloud`] as PlatformCategoryId[]
).map(category => ({
  name: PLATFORM_CATEGORY_LABELS[category],
  platforms: PLATFORM_REGISTRY.filter(p => p.category === category).map(p => p.type),
}))
