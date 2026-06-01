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
  growthPlan?: {
    title: string
    target: string
    estimate: string
    rationale: string
    dailyScore: Array<{
      label: string
      value: string
      detail: string
    }>
    checklist: string[]
    checkinItems?: Array<{
      id: string
      label: string
      detail: string
    }>
    guardrails: string[]
  }
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
      badge: `Lv 冲刺`,
      summary: `以 Lv 成长为目标的保守冲刺渠道：掘金普通文章流量偏弱，不按爆文估算，靠 2 篇/天、真实互动、专题长尾和每日打卡稳步推进。`,
      cadence: `连续 9–12 个月：每天 2 篇专栏，日均目标 90–120 掘力值`,
      tips: [
        `当前 108534 掘力值，距离下一等级约 31466；按日均 110 估算约 286 天，按波动预留后是 9–12 个月。`,
        `不再假设两篇文章能拿到 10000 阅读；日常模型按 1500–4000 阅读、少量赞藏评计算，爆文只作为缩短周期的额外收益。`,
        `优先追求收藏和评论：1 收藏/1 赞/1 个一级评论用户都 +1，阅读需要 500 才 +1，不能只看浏览量。`,
        `每篇文章都按「可收藏清单 + 真实项目复盘 + 可复现代码」设计，提升高质量 +15 的概率。`,
      ],
      tactics: [`标签 3–5 个精准技术词`, `首图统一品牌风格`],
      nextActions: [`建立 30 天掘力值台账`, `准备 8 篇专题库存`, `发布后 24h 内完成两轮真实宣发与评论回复`],
      growthPlan: {
        title: `掘金 Lv 冲刺模型`,
        target: `日均 90–120 掘力值`,
        estimate: `31466 / 110 ≈ 286 天；按平台流量波动、内容审核和断更风险，执行周期按 9–12 个月规划。`,
        rationale: `这个模型不把爆文当常态：50 左右来自 2 篇文章和质量分，30–45 来自新文真实互动，10–20 来自历史文章长尾。出现爆文时只会提前，不影响日常计划成立。`,
        dailyScore: [
          {
            label: `创作行为`,
            value: `+20`,
            detail: `每天 2 篇文章，吃满每日计分上限。`,
          },
          {
            label: `质量判定`,
            value: `+15–30`,
            detail: `至少 1 篇命中高质量，理想状态 2 篇各 +15。`,
          },
          {
            label: `新文互动`,
            value: `+30–45`,
            detail: `两篇合计约 8–15 赞、5–10 收藏、3–8 个一级评论用户、1500–4000 阅读。`,
          },
          {
            label: `长尾回流`,
            value: `+10–20`,
            detail: `专题互链、外部分发和旧文推荐带来的持续真实互动。`,
          },
        ],
        checklist: [
          `上午发主文：深度教程、工程实践或真实踩坑复盘。`,
          `下午发副文：清单、工具链、源码笔记或专题续篇。`,
          `发布后 30 分钟内完成第一轮宣发，晚上二次分发并回复评论。`,
          `每天记录新增掘力值、赞、收藏、评论、阅读和是否高质量。`,
        ],
        checkinItems: [
          {
            id: `main-post`,
            label: `主文已发布`,
            detail: `深度教程、工程实践或真实踩坑复盘，优先争取高质量。`,
          },
          {
            id: `side-post`,
            label: `副文已发布`,
            detail: `清单、工具链、源码笔记或专题续篇，吃满每日 2 篇行为分。`,
          },
          {
            id: `first-share`,
            label: `首轮宣发已完成`,
            detail: `发布后 30 分钟内分发到真实社群、朋友圈、X 或技术群。`,
          },
          {
            id: `reply-comments`,
            label: `评论已回复`,
            detail: `当天回复所有一级评论，尽量形成真实讨论。`,
          },
          {
            id: `ledger`,
            label: `掘力值台账已记录`,
            detail: `记录新增掘力值、阅读、赞、收藏、评论和高质量判定。`,
          },
        ],
        guardrails: [
          `不使用机器刷赞、刷阅读、刷评论；违规扣分会抵消全部增长。`,
          `不同平台同步时改写标题和导语，避免低质量搬运感。`,
          `连续 7 天低于 70/天时，优先调整选题和标题，而不是增加发布量。`,
        ],
      },
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
    growthPlan: row.growthPlan,
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
