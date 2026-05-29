import { TUARAN_CREATOR_ID } from '@/constants/creatorOffer'
import {
  FAN_GROWTH_MILESTONES,
  getDistributionPlatformRow,
  parseFollowerCount,
  resolveFanGrowthMilestoneId,
} from '@/constants/distributionFocus'
import { normalizePlatformType } from '@/constants/platforms'

export interface DistributionStrategy {
  platformType: string
  title: string
  badge?: string
  summary: string
  cadence: string
  tips: string[]
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
      tips: [
        `涨粉妙招 1：文章开启「仅粉丝可阅读」，给关注动作明确回报。`,
        `涨粉妙招 2：配合平台流量包做日常放量，把优质长文持续推给新读者。`,
      ],
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
      tips: [
        `首条推文先抛结论，再在后续线程补上下文与证据，提升转发率。`,
      ],
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
      tips: [
        `优先发布「可复现」教程型内容，标题写清场景与收益，便于社区推荐。`,
      ],
      tactics: [`保留产品中性表述`, `配图与代码块完整`, `专栏标签统一`],
      nextActions: [`检查开发者账号登录态`, `同步 CSDN 最新长文改写版`],
    },
    aliyun: {
      title: `阿里云社区`,
      badge: `云社区`,
      summary: `开发者文章与专题活动入口；偏实战与部署类内容。`,
      cadence: `每月 2–4 篇`,
      tips: [
        `选题尽量绑定真实业务问题（性能、成本、部署），更容易获得收藏与加精。`,
      ],
      tactics: [`标题突出场景（部署、排错、成本）`, `文末附实践检查清单`],
      nextActions: [`更新专栏简介`, `与腾讯云错开发布日`],
    },
    huaweicloud: {
      title: `华为云社区`,
      badge: `云社区`,
      summary: `bbs + 博客双入口；适合系列化技术连载。`,
      cadence: `每月 1–2 篇系列稿`,
      tips: [
        `系列文章保持统一命名与封面风格，便于形成稳定追更习惯。`,
      ],
      tactics: [`系列命名统一`, `篇末预告下篇`],
      nextActions: [`确认 bbs 专栏链接有效`],
    },
    github: {
      title: `GitHub`,
      summary: `开源协作与个人品牌阵地；适合通过项目与自动化互动沉淀长期关注。`,
      cadence: `每周维护 2–3 次仓库动态 + issue/PR 互动`,
      tips: [
        `可使用 github-auto-follow 做冷启动：主动关注相关开发者，通常会带来部分回关。`,
        `把核心内容沉淀到 README / Discussions，确保新访客进入仓库后有明确关注理由。`,
      ],
      tactics: [`仓库置顶与 README 首屏明确价值`, `issue 区保持高质量响应`],
      nextActions: [`筛选 20 位同领域账号做互动`, `补充仓库主页引导关注文案`],
    },
    juejin: {
      title: `掘金`,
      summary: `流量与互动高；适合首发或 24h 内同步，标题可更社区化。`,
      cadence: `每周 1 篇同步或独家短文`,
      tips: [
        `制定固定更文计划（例如每周二/周五更新），让读者形成稳定预期。`,
        `优先写「面试实战」题材，搜索和收藏更稳定。`,
        `持续输出「工具/资源推荐」合集，容易形成系列化关注。`,
      ],
      tactics: [`标签 3–5 个精准技术词`, `首图统一品牌风格`],
      nextActions: [`对比 CSDN 同题数据`],
    },
    zhihu: {
      title: `知乎`,
      summary: `问答与专栏引流；适合观点段与「为什么」型结构。`,
      cadence: `每 2 周 1 篇`,
      tips: [
        `优先回答高关注问题，再引流到专栏长文，能更快拿到早期曝光。`,
      ],
      tactics: [`开头 3 行给结论`, `文末引导关注与专栏`],
      nextActions: [`选 1 个高关注问题做回答`],
    },
    weibo: {
      title: `微博`,
      summary: `短讯与链接导流；配合长文发布做预告和摘要。`,
      cadence: `每篇长文配 1–2 条微博`,
      tips: [
        `热点话题下补充技术角度短评，再挂长文链接，导流效率更高。`,
      ],
      tactics: [`9 图或单图 + 链接`, `@相关账号需克制`],
      nextActions: [`发布后用粉丝 3014 基数看互动率`],
    },
    xiaohongshu: {
      title: `小红书`,
      summary: `图文卡片化；适合工具清单、步骤截图版。`,
      cadence: `每 2 周 1 组图文`,
      tips: [
        `结合「博主联盟」做技术向联动互推，优先覆盖同赛道账号。`,
      ],
      tactics: [`封面大字 + 3 要点`, `评论区置顶链接说明`],
      nextActions: [`从长文拆一页一图`],
    },
    toutiao: {
      title: `今日头条`,
      summary: `推荐流标题党要克制；强调技术可信度。`,
      cadence: `与 CSDN 同步或延迟 1 天`,
      tips: [
        `首段 3 句内讲清问题与结论，提升推荐流中的完读率。`,
      ],
      tactics: [`标题 25 字内`, `首段埋关键词`],
      nextActions: [`看数据中心 7 日阅读`],
    },
    default: {
      title: `通用分发`,
      summary: `同步排版后的稿件，保持链接与品牌口径一致。`,
      cadence: `随主阵地发布节奏`,
      tips: [
        `如果该平台暂时没有明确打法，优先参加平台官方活动获取初始曝光。`,
      ],
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
  const type = normalizePlatformType(platformType)
  const table = STRATEGIES_BY_CREATOR[id] ?? STRATEGIES_BY_CREATOR[TUARAN_CREATOR_ID]
  const row = table[type] ?? table.default
  const platformRow = type === `x`
    ? null
    : getDistributionPlatformRow(type)

  return {
    platformType: type,
    title: row.title ?? (platformRow?.title ?? type),
    badge: row.badge,
    summary: row.summary,
    cadence: row.cadence,
    tips: row.tips ?? [],
    tactics: row.tactics,
    nextActions: row.nextActions,
  }
}

export function getPlatformGrowthSnapshot(_creatorId: string, platformType: string) {
  if (normalizePlatformType(platformType) === `x`) {
    const milestone = FAN_GROWTH_MILESTONES.find(m => m.id === `0-1`)!
    return {
      row: null,
      followers: 0,
      milestoneId: `0-1` as const,
      milestone,
    }
  }
  const row = getDistributionPlatformRow(normalizePlatformType(platformType))
  const followers = parseFollowerCount(row.followers)
  const milestoneId = resolveFanGrowthMilestoneId(followers)
  const milestone = FAN_GROWTH_MILESTONES.find(m => m.id === milestoneId)!
  return { row, followers, milestoneId, milestone }
}
