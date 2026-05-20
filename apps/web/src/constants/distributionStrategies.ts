import { TUARAN_CREATOR_ID } from '@/constants/creatorOffer'
import {
  FAN_GROWTH_MILESTONES,
  getDistributionPlatformRow,
  parseFollowerCount,
  resolveFanGrowthMilestoneId,
} from '@/constants/distributionFocus'

export interface DistributionStrategy {
  platformType: string
  title: string
  badge?: string
  summary: string
  cadence: string
  tactics: string[]
  nextActions: string[]
}

/** 各创作者 × 平台 的宣发策略（无条目时用 default） */
const STRATEGIES_BY_CREATOR: Record<string, Record<string, Omit<DistributionStrategy, 'platformType'>>> = {
  [TUARAN_CREATOR_ID]: {
    csdn: {
      title: `CSDN`,
      badge: `当前重心`,
      summary: `技术长文主阵地：SEO、排行榜与博客访问量；优先做深粉丝与阅读双指标。`,
      cadence: `每周 1–2 篇长文 + 1 次榜单/话题跟进`,
      tactics: [
        `标题含检索词，摘要 120 字内说清价值`,
        `文末固定引流块（微信 / 站点 / 云社区互链）`,
        `同题在掘金、InfoQ 做改写，回链 CSDN 原文`,
      ],
      nextActions: [`核对粉丝阶段是否进入 1k–10k 放量`, `发布后 48h 看访问与收藏`],
    },
    x: {
      title: `X（Twitter）`,
      badge: `建设中`,
      summary: `短文、线程与外链；承接热点与海外开发者，反哺长文站点。`,
      cadence: `每周 3–5 条短文或 1 条线程`,
      tactics: [
        `长文拆 5–8 条线程，首条放结论`,
        `带代码片段图与原文链接`,
        `互动高峰时段发布（工作日欧美上午）`,
      ],
      nextActions: [`补齐 X 主页链接`, `与 CSDN 新文同一天发首条线程`],
    },
    tencentcloud: {
      title: `腾讯云社区`,
      badge: `云社区`,
      summary: `ToB 技术品牌友好；适合教程、最佳实践与活动稿同步。`,
      cadence: `每月 2–4 篇，与大厂节点/产品发布对齐`,
      tactics: [`保留产品中性表述`, `配图与代码块完整`, `专栏标签统一`],
      nextActions: [`检查开发者账号登录态`, `同步 CSDN 最新长文改写版`],
    },
    aliyun: {
      title: `阿里云社区`,
      badge: `云社区`,
      summary: `开发者文章与专题活动入口；偏实战与部署类内容。`,
      cadence: `每月 2–4 篇`,
      tactics: [`标题突出场景（部署、排错、成本）`, `文末附实践检查清单`],
      nextActions: [`更新专栏简介`, `与腾讯云错开发布日`],
    },
    huaweicloud: {
      title: `华为云社区`,
      badge: `云社区`,
      summary: `bbs + 博客双入口；适合系列化技术连载。`,
      cadence: `每月 1–2 篇系列稿`,
      tactics: [`系列命名统一`, `篇末预告下篇`],
      nextActions: [`确认 bbs 专栏链接有效`],
    },
    juejin: {
      title: `掘金`,
      summary: `流量与互动高；适合首发或 24h 内同步，标题可更社区化。`,
      cadence: `每周 1 篇同步或独家短文`,
      tactics: [`标签 3–5 个精准技术词`, `首图统一品牌风格`],
      nextActions: [`对比 CSDN 同题数据`],
    },
    zhihu: {
      title: `知乎`,
      summary: `问答与专栏引流；适合观点段与「为什么」型结构。`,
      cadence: `每 2 周 1 篇`,
      tactics: [`开头 3 行给结论`, `文末引导关注与专栏`],
      nextActions: [`选 1 个高关注问题做回答`],
    },
    weibo: {
      title: `微博`,
      summary: `短讯与链接导流；配合长文发布做预告和摘要。`,
      cadence: `每篇长文配 1–2 条微博`,
      tactics: [`9 图或单图 + 链接`, `@相关账号需克制`],
      nextActions: [`发布后用粉丝 3014 基数看互动率`],
    },
    xiaohongshu: {
      title: `小红书`,
      summary: `图文卡片化；适合工具清单、步骤截图版。`,
      cadence: `每 2 周 1 组图文`,
      tactics: [`封面大字 + 3 要点`, `评论区置顶链接说明`],
      nextActions: [`从长文拆一页一图`],
    },
    toutiao: {
      title: `今日头条`,
      summary: `推荐流标题党要克制；强调技术可信度。`,
      cadence: `与 CSDN 同步或延迟 1 天`,
      tactics: [`标题 25 字内`, `首段埋关键词`],
      nextActions: [`看数据中心 7 日阅读`],
    },
    default: {
      title: `通用分发`,
      summary: `同步排版后的稿件，保持链接与品牌口径一致。`,
      cadence: `随主阵地发布节奏`,
      tactics: [`检查草稿与外链`, `统一作者署名`],
      nextActions: [`发布前走检查清单`],
    },
  },
}

/** 宣发页优先展示的平台顺序（按创作者） */
const PLATFORM_ORDER_BY_CREATOR: Record<string, string[]> = {
  [TUARAN_CREATOR_ID]: [
    `csdn`,
    `x`,
    `juejin`,
    `zhihu`,
    `weibo`,
    `xiaohongshu`,
    `toutiao`,
    `tencentcloud`,
    `aliyun`,
    `huaweicloud`,
    `segmentfault`,
    `infoq`,
    `oschina`,
    `cto51`,
    `baijiahao`,
  ],
}

export function listDistributionPlatformTypes(creatorId: string, matrixTypes: string[]): string[] {
  const id = creatorId.trim().toLowerCase()
  const preferred = PLATFORM_ORDER_BY_CREATOR[id] ?? []
  const unique = new Set<string>()
  const ordered: string[] = []
  for (const type of preferred) {
    if (matrixTypes.includes(type) && !unique.has(type)) {
      unique.add(type)
      ordered.push(type)
    }
  }
  for (const type of matrixTypes) {
    if (!unique.has(type)) {
      unique.add(type)
      ordered.push(type)
    }
  }
  if (!ordered.includes(`x`) && id === TUARAN_CREATOR_ID)
    ordered.splice(1, 0, `x`)
  return ordered
}

export function getDistributionStrategy(creatorId: string, platformType: string): DistributionStrategy {
  const id = creatorId.trim().toLowerCase()
  const key = platformType === `x` ? `x` : platformType
  const table = STRATEGIES_BY_CREATOR[id] ?? STRATEGIES_BY_CREATOR[TUARAN_CREATOR_ID]
  const row = table[key] ?? table.default
  const platformRow = platformType === `x`
    ? null
    : getDistributionPlatformRow(platformType)

  return {
    platformType: key,
    title: row.title ?? (platformRow?.title ?? platformType),
    badge: row.badge,
    summary: row.summary,
    cadence: row.cadence,
    tactics: row.tactics,
    nextActions: row.nextActions,
  }
}

export function getPlatformGrowthSnapshot(_creatorId: string, platformType: string) {
  if (platformType === `x`) {
    const milestone = FAN_GROWTH_MILESTONES.find(m => m.id === `0-1`)!
    return {
      row: null,
      followers: 0,
      milestoneId: `0-1` as const,
      milestone,
    }
  }
  const row = getDistributionPlatformRow(platformType)
  const followers = parseFollowerCount(row.followers)
  const milestoneId = resolveFanGrowthMilestoneId(followers)
  const milestone = FAN_GROWTH_MILESTONES.find(m => m.id === milestoneId)!
  return { row, followers, milestoneId, milestone }
}
