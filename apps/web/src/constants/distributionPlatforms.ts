import { getPlatformHomeUrl, getPlatformLoginUrl } from '@/constants/platforms'

export interface DistributionPlatformOption {
  type: string
  title: string
  homeUrl: string
  publishUrl: string
  iconUrl: string
}

export interface DistributionPlatformGroup {
  id: string
  title: string
  platforms: DistributionPlatformOption[]
}

const PLATFORM_ICON_URLS: Record<string, string> = {
  'wechat': `https://res.wx.qq.com/a/wx_fed/assets/res/NTI4MWU5.ico`,
  'zhihu': `https://static.zhihu.com/heifetz/favicon.ico`,
  'zhihu-thought': `https://static.zhihu.com/heifetz/favicon.ico`,
  'baijiahao': `https://pic.rmb.bdstatic.com/10e1e2b43c35577e1315f0f6aad6ba24.vnd.microsoft.icon`,
  'wangyihao': `https://static.ws.126.net/163/f2e/news/yxybd_pc/resource/static/share-icon.png`,
  'sohu': `https://statics.itc.cn/mp-new/icon/1.1/favicon.ico`,
  'weibo': `https://weibo.com/favicon.ico`,
  'bilibili': `https://www.bilibili.com/favicon.ico`,
  'sspai': `https://cdn-static.sspai.com/favicon/sspai.ico`,
  'x': `https://abs.twimg.com/favicons/twitter.3.ico`,
  'douyin': `https://lf3-static.bytednsdoc.com/obj/eden-cn/yvahlyj_upfbvk_zlp/ljhwZthlaukjlkulzlp/pc_creator/favicon_v2_7145ff0.ico`,
  'douyin-note': `https://lf3-static.bytednsdoc.com/obj/eden-cn/yvahlyj_upfbvk_zlp/ljhwZthlaukjlkulzlp/pc_creator/favicon_v2_7145ff0.ico`,
  'xiaohongshu': `https://www.xiaohongshu.com/favicon.ico`,
  'douban': `https://cdn.simpleicons.org/douban/07C160`,
  'toutiao': `https://sf3-cdn-tos.toutiaostatic.com/obj/eden-cn/uhbfnupkbps/toutiao_favicon.ico`,
  'toutiao-micro': `https://sf3-cdn-tos.toutiaostatic.com/obj/eden-cn/uhbfnupkbps/toutiao_favicon.ico`,
  'csdn': `https://g.csdnimg.cn/static/logo/favicon32.ico`,
  'cnblogs': `https://www.cnblogs.com/favicon.ico`,
  'juejin': `https://lf-web-assets.juejin.cn/obj/juejin-web/xitu_juejin_web/static/favicons/favicon-32x32.png`,
  'juejin-pin': `https://lf-web-assets.juejin.cn/obj/juejin-web/xitu_juejin_web/static/favicons/favicon-32x32.png`,
  'medium': `https://cdn.simpleicons.org/medium`,
  'cto51': `https://blog.51cto.com/favicon.ico`,
  'segmentfault': `https://fastly.jsdelivr.net/gh/bucketio/img16@main/2026/02/01/1769960912823-e037663a-7f65-414e-a114-ed86b4e86964.png`,
  'oschina': `https://wsrv.nl/?url=static.oschina.net/new-osc/img/favicon.ico`,
  'infoq': `https://static001.infoq.cn/static/write/img/write-favicon.jpg`,
  'jianshu': `https://www.jianshu.com/favicon.ico`,
  'tencentcloud': `https://cloudcache.tencent-cloud.com/qcloud/favicon.ico`,
  'aliyun': `https://img.alicdn.com/tfs/TB1_ZXuNcfpK1RjSZFOXXa6nFXa-32-32.ico`,
  'huaweicloud': `https://www.huaweicloud.com/favicon.ico`,
  'huaweidev': `https://developer.huawei.com/favicon.ico`,
  'alipayopen': `https://www.alipay.com/favicon.ico`,
  'volcengine': `https://lf1-cdn-tos.bytegoofy.com/goofy/tech-fe/fav.png`,
  'elecfans': `https://www.elecfans.com/favicon.ico`,
  'qianfan': `https://bce.bdstatic.com/img/favicon.ico`,
  'modelscope': `https://img.alicdn.com/imgextra/i4/O1CN01fvt4it25rEZU4Gjso_!!6000000007579-2-tps-128-128.png`,
  'jike': `https://web.okjike.com/favicon.ico`,
  'maimai': `https://maimai.cn/favicon.ico`,
  'xueqiu': `https://xueqiu.com/favicon.ico`,
  'bsky': `https://bsky.app/static/favicon-32x32.png`,
  'threads': `https://static.cdninstagram.com/rsrc.php/v4/yK/r/ATdtiLb2BQ9.png`,
  'instagram': `https://www.instagram.com/static/images/ico/favicon-192.png/68d99ba29cc8.png`,
  'pinterest': `https://s.pinimg.com/webapp/favicon-54a5b2af.png`,
  'facebook': `https://static.xx.fbcdn.net/rsrc.php/yx/r/e9sqr8WnkCf.ico`,
  'zhishi': `https://wx.zsxq.com/favicon.ico`,
  'xiaoheihe': `https://www.xiaoheihe.cn/favicon.ico`,
  'dedao': `https://www.dedao.cn/favicon.ico`,
  'linkedin': `https://static.licdn.com/sc/h/akt4ae504epesldzj74dzred8`,
  'substack': `https://substack.com/favicon.ico`,
  'reddit': `https://www.redditstatic.com/desktop2x/img/favicon/favicon-32x32.png`,
  'feishu-wecom-dingtalk': `https://www.feishu.cn/favicon.ico`,
  'shipinhao-note': `https://res.wx.qq.com/t/wx_fed/finder/helper/finder-helper-web/res/favicon-v2.ico`,
  'kuaishou-note': `https://static.yximgs.com/udata/pkg/ks-ad-fe/favicon.ico`,
  'xiaobot': `https://xiaobot.net/favicon.ico`,
  'dedao-course': `https://www.dedao.cn/favicon.ico`,
  'geektime': `https://static001.geekbang.org/static/time/icon/favicon-32x32.jpg`,
  'zhihu-salt': `https://static.zhihu.com/heifetz/favicon.ico`,
  'juejin-course': `https://lf-web-assets.juejin.cn/obj/juejin-web/xitu_juejin_web/static/favicons/favicon-32x32.png`,
  'qidian': `https://www.qidian.com/favicon.ico`,
  'fanqie': `https://fanqienovel.com/favicon.ico`,
  'qimao': `https://www.qimao.com/favicon.ico`,
  'jjwxc': `https://www.jjwxc.net/favicon.ico`,
  'zongheng': `https://www.zongheng.com/favicon.ico`,
  'ciweimao': `https://www.ciweimao.com/favicon.ico`,
  'weread': `https://weread.qq.com/favicon.ico`,
  'publisher': `https://www.nppa.gov.cn/favicon.ico`,
  'github': `https://github.githubassets.com/favicons/favicon.svg`,
  'gitee': `https://gitee.com/favicon.ico`,
  'gitcode': `https://gitcode.com/favicon.ico`,
  'gitlab': `https://gitlab.com/favicon.ico`,
  'producthunt': `https://www.producthunt.com/favicon.ico`,
  'hackernews': `https://news.ycombinator.com/favicon.ico`,
  'v2ex': `https://www.v2ex.com/static/img/icon_rayps_64.png`,
  'devto': `https://d2fltix0v2e0sb.cloudfront.net/dev-badge.svg`,
}

export function getDistributionPlatformIcon(type: string): string {
  return PLATFORM_ICON_URLS[type] ?? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(getPlatformHomeUrl(type))}&sz=32`
}

const PLATFORM_PUBLISH_URLS: Record<string, string> = {
  'weibo': `https://weibo.com`,
  'juejin-pin': `https://juejin.cn/pin`,
  'zhihu-thought': `https://www.zhihu.com`,
  'x': `https://x.com/compose/post`,
  'jike': `https://web.okjike.com`,
  'douban': `https://www.douban.com/note/create`,
  'toutiao-micro': `https://mp.toutiao.com`,
  'douyin-note': `https://creator.douyin.com`,
  'shipinhao-note': `https://channels.weixin.qq.com`,
  'kuaishou-note': `https://cp.kuaishou.com`,
}

export function getDistributionPlatformPublishUrl(type: string, fallbackUrl?: string): string {
  const publishUrl = PLATFORM_PUBLISH_URLS[type] || getPlatformLoginUrl(type)
  if (publishUrl && publishUrl !== `#`)
    return publishUrl
  return fallbackUrl || getPlatformHomeUrl(type)
}

function platform(type: string, title: string, homeUrl?: string): DistributionPlatformOption {
  const resolvedHomeUrl = homeUrl || getPlatformHomeUrl(type)
  return {
    type,
    title,
    homeUrl: resolvedHomeUrl,
    publishUrl: getDistributionPlatformPublishUrl(type, resolvedHomeUrl),
    iconUrl: getDistributionPlatformIcon(type),
  }
}

export const OPINION_PLATFORM_GROUPS: DistributionPlatformGroup[] = [
  {
    id: `instant`,
    title: `即时观点`,
    platforms: [
      platform(`weibo`, `微博`),
      platform(`jike`, `即刻`, `https://web.okjike.com`),
      platform(`x`, `X`),
      platform(`zhihu-thought`, `知乎·写想法`, `https://www.zhihu.com`),
      platform(`juejin-pin`, `掘金沸点`, `https://juejin.cn/pin`),
      platform(`maimai`, `脉脉`, `https://maimai.cn`),
      platform(`xueqiu`, `雪球`, `https://xueqiu.com`),
      platform(`bsky`, `Bsky`, `https://bsky.app`),
      platform(`threads`, `Threads`, `https://www.threads.net`),
    ],
  },
  {
    id: `visual`,
    title: `图文短内容`,
    platforms: [
      platform(`xiaohongshu`, `小红书`),
      platform(`douyin-note`, `抖音(图文)`, `https://creator.douyin.com`),
      platform(`shipinhao-note`, `视频号(图文)`, `https://channels.weixin.qq.com`),
      platform(`kuaishou-note`, `快手(图文)`, `https://cp.kuaishou.com`),
      platform(`bilibili`, `B站`),
      platform(`instagram`, `Instagram`, `https://www.instagram.com`),
      platform(`pinterest`, `Pinterest`, `https://www.pinterest.com`),
      platform(`facebook`, `Facebook`, `https://www.facebook.com`),
    ],
  },
  {
    id: `community`,
    title: `社区与专栏`,
    platforms: [
      platform(`zhishi`, `知识星球`, `https://wx.zsxq.com`),
      platform(`wechat`, `微信公众号(图文)`),
      platform(`baijiahao`, `百家号`),
      platform(`douban`, `豆瓣`),
      platform(`xiaoheihe`, `小黑盒`, `https://www.xiaoheihe.cn`),
      platform(`dedao`, `得到`, `https://www.dedao.cn`),
      platform(`toutiao-micro`, `微头条`, `https://mp.toutiao.com`),
      platform(`linkedin`, `LinkedIn`, `https://www.linkedin.com`),
      platform(`substack`, `Substack`, `https://substack.com`),
      platform(`reddit`, `Reddit`, `https://www.reddit.com`),
    ],
  },
  {
    id: `private`,
    title: `私域社群`,
    platforms: [
      platform(`feishu-wecom-dingtalk`, `飞书/企微/钉钉社群`, `https://www.feishu.cn`),
    ],
  },
]

export const ARTICLE_PLATFORM_GROUPS: DistributionPlatformGroup[] = [
  {
    id: `media`,
    title: `媒体`,
    platforms: [
      platform(`wechat`, `微信公众号`),
      platform(`zhihu`, `知乎`),
      platform(`wangyihao`, `网易号`),
      platform(`weibo`, `微博头条`),
      platform(`sspai`, `少数派`),
      platform(`douyin`, `抖音文章`),
      platform(`douban`, `豆瓣`),
      platform(`toutiao`, `今日头条`),
      platform(`baijiahao`, `百家号`),
      platform(`sohu`, `搜狐号`),
      platform(`bilibili`, `B站专栏`),
      platform(`x`, `Twitter Articles`),
      platform(`xiaohongshu`, `小红书`),
    ],
  },
  {
    id: `blog`,
    title: `博客`,
    platforms: [
      platform(`csdn`, `CSDN`),
      platform(`juejin`, `掘金`),
      platform(`cto51`, `51CTO`),
      platform(`oschina`, `开源中国`),
      platform(`jianshu`, `简书`),
      platform(`cnblogs`, `博客园`),
      platform(`medium`, `Medium`),
      platform(`segmentfault`, `思否`),
      platform(`infoq`, `InfoQ`),
    ],
  },
  {
    id: `cloud`,
    title: `云与开发者`,
    platforms: [
      platform(`tencentcloud`, `腾讯云开发者社区`),
      platform(`huaweicloud`, `华为云开发者博客`),
      platform(`qianfan`, `百度云千帆`),
      platform(`modelscope`, `ModelScope 魔搭`),
      platform(`aliyun`, `阿里云开发者社区`),
      platform(`huaweidev`, `华为开发者文章`),
      platform(`alipayopen`, `支付宝开放平台`),
      platform(`volcengine`, `火山引擎开发者社区`),
      platform(`elecfans`, `电子发烧友`),
    ],
  },
]

export const PROJECT_PLATFORM_GROUPS: DistributionPlatformGroup[] = [
  {
    id: `launch`,
    title: `开源发布`,
    platforms: [
      platform(`github`, `GitHub`, `https://github.com`),
      platform(`gitee`, `Gitee`, `https://gitee.com`),
      platform(`gitcode`, `GitCode`, `https://gitcode.com`),
      platform(`gitlab`, `GitLab`, `https://gitlab.com`),
      platform(`producthunt`, `Product Hunt`, `https://www.producthunt.com`),
      platform(`hackernews`, `Show HN`, `https://news.ycombinator.com`),
    ],
  },
  {
    id: `developer`,
    title: `开发者社区`,
    platforms: [
      platform(`juejin`, `掘金`),
      platform(`csdn`, `CSDN`),
      platform(`v2ex`, `V2EX`, `https://www.v2ex.com`),
      platform(`oschina`, `开源中国`),
      platform(`segmentfault`, `思否`),
      platform(`infoq`, `InfoQ`),
      platform(`devto`, `DEV`, `https://dev.to`),
      platform(`medium`, `Medium`),
    ],
  },
  {
    id: `social`,
    title: `社交扩散`,
    platforms: [
      platform(`weibo`, `微博`),
      platform(`x`, `X`),
      platform(`jike`, `即刻`, `https://web.okjike.com`),
      platform(`reddit`, `Reddit`, `https://www.reddit.com`),
      platform(`linkedin`, `LinkedIn`, `https://www.linkedin.com`),
      platform(`bsky`, `Bsky`, `https://bsky.app`),
    ],
  },
  {
    id: `cloud`,
    title: `云与技术生态`,
    platforms: [
      platform(`tencentcloud`, `腾讯云开发者社区`),
      platform(`aliyun`, `阿里云开发者社区`),
      platform(`huaweicloud`, `华为云开发者博客`),
      platform(`huaweidev`, `华为开发者文章`),
      platform(`modelscope`, `ModelScope 魔搭`),
      platform(`volcengine`, `火山引擎开发者社区`),
    ],
  },
]

export const EBOOK_PLATFORM_GROUPS: DistributionPlatformGroup[] = [
  {
    id: `paid-knowledge`,
    title: `知识付费 / 小册`,
    platforms: [
      platform(`xiaobot`, `小报童`, `https://xiaobot.net`),
      platform(`zhishi`, `知识星球`, `https://wx.zsxq.com`),
      platform(`juejin-course`, `掘金小册`, `https://juejin.cn/course`),
      platform(`zhihu-salt`, `知乎盐选`, `https://www.zhihu.com`),
      platform(`dedao-course`, `得到`, `https://www.dedao.cn`),
      platform(`geektime`, `极客时间`, `https://time.geekbang.org`),
    ],
  },
  {
    id: `novel`,
    title: `网文小说`,
    platforms: [
      platform(`qidian`, `起点中文网`, `https://www.qidian.com`),
      platform(`fanqie`, `番茄小说`, `https://fanqienovel.com`),
      platform(`qimao`, `七猫小说`, `https://www.qimao.com`),
      platform(`jjwxc`, `晋江文学城`, `https://www.jjwxc.net`),
      platform(`zongheng`, `纵横中文网`, `https://www.zongheng.com`),
      platform(`ciweimao`, `刺猬猫`, `https://www.ciweimao.com`),
    ],
  },
  {
    id: `ebook-longtail`,
    title: `电子书长尾`,
    platforms: [
      platform(`weread`, `微信读书`, `https://weread.qq.com`),
      platform(`publisher`, `传统出版社`, `https://www.nppa.gov.cn`),
    ],
  },
]

export const ALL_DISTRIBUTION_PLATFORM_TYPES = Array.from(new Set([
  ...OPINION_PLATFORM_GROUPS,
  ...ARTICLE_PLATFORM_GROUPS,
  ...EBOOK_PLATFORM_GROUPS,
  ...PROJECT_PLATFORM_GROUPS,
].flatMap(group => group.platforms.map(platform => platform.type))))

export const ALL_DISTRIBUTION_PLATFORM_COUNT = ALL_DISTRIBUTION_PLATFORM_TYPES.length

export function flattenPlatformGroups(groups: DistributionPlatformGroup[]): DistributionPlatformOption[] {
  return groups.flatMap(group => group.platforms)
}
