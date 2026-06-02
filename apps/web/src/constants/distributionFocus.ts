import {
  PLATFORM_DEFAULT_PROFILE_STATS,
  PLATFORM_DEFAULT_PROFILE_URLS,
  PLATFORM_PROFILE_TITLES,
} from '@/utils/socialAccounts'

/** 粉丝量成长阶段（数据策略规划用） */
export const FAN_GROWTH_MILESTONES = [
  {
    id: `0-1`,
    range: `0 → 1`,
    title: `冷启动`,
    summary: `账号存在、首条内容、可被检索与收藏。`,
  },
  {
    id: `1-100`,
    range: `1 → 100`,
    title: `种子期`,
    summary: `固定更新节奏，验证选题与标题，积累首批互动。`,
  },
  {
    id: `100-1000`,
    range: `100 → 1,000`,
    title: `爬坡期`,
    summary: `单篇数据可复盘，开始跨平台改写与互链。`,
  },
  {
    id: `1000-10000`,
    range: `1,000 → 10,000`,
    title: `放量期`,
    summary: `重心渠道做深，配合云社区与社交号引流。`,
  },
  {
    id: `10000+`,
    range: `10,000+`,
    title: `稳定期`,
    summary: `矩阵协同、活动节点与转化复盘常态化。`,
  },
] as const

/** 当前宣发重心渠道分组 */
export const DISTRIBUTION_FOCUS_GROUPS = [
  {
    id: `csdn`,
    title: `CSDN`,
    badge: `当前重心`,
    summary: `技术长文主阵地：SEO、排行榜与博客访问量；当前处于 1,000 → 10,000 粉丝放量阶段。`,
    platformTypes: [`csdn`] as const,
    anchorMetricType: `csdn` as const,
  },
  {
    id: `x`,
    title: `X（Twitter）`,
    badge: `建设中`,
    summary: `短文、线程与外链引流；与长文平台互补，承接海外开发者与热点讨论。`,
    platformTypes: [] as const,
    externalUrl: null as string | null,
  },
  {
    id: `cloud`,
    title: `大厂云社区`,
    badge: `分发矩阵`,
    summary: `腾讯云、阿里云、华为云等开发者社区同步首发或改写，放大 ToB 技术品牌触达。`,
    platformTypes: [`tencentcloud`, `aliyun`, `huaweicloud`] as const,
  },
] as const

export function parseFollowerCount(raw: string): number {
  const normalized = raw.replace(/,/g, ``).trim()
  if (!normalized || normalized === `—`)
    return 0
  if (normalized.endsWith(`万`)) {
    const n = Number.parseFloat(normalized.slice(0, -1))
    return Number.isFinite(n) ? Math.round(n * 10_000) : 0
  }
  const n = Number.parseInt(normalized, 10)
  return Number.isFinite(n) ? n : 0
}

/** 根据粉丝数判断所处成长阶段 id */
export function resolveFanGrowthMilestoneId(followers: number): (typeof FAN_GROWTH_MILESTONES)[number]['id'] {
  if (followers >= 10_000)
    return `10000+`
  if (followers >= 1_000)
    return `1000-10000`
  if (followers >= 100)
    return `100-1000`
  if (followers >= 1)
    return `1-100`
  return `0-1`
}

export interface DistributionPlatformRow {
  type: string
  title: string
  url: string | null
  followers: string
  reads: string
}

export function getDistributionPlatformRow(type: string): DistributionPlatformRow {
  const stats = PLATFORM_DEFAULT_PROFILE_STATS[type]
  return {
    type,
    title: PLATFORM_PROFILE_TITLES[type] ?? type,
    url: PLATFORM_DEFAULT_PROFILE_URLS[type] ?? null,
    followers: stats?.followers ?? `—`,
    reads: stats?.reads ?? `—`,
  }
}

export function getCsdnGrowthSnapshot() {
  const row = getDistributionPlatformRow(`csdn`)
  const followers = parseFollowerCount(row.followers)
  const milestoneId = resolveFanGrowthMilestoneId(followers)
  const milestone = FAN_GROWTH_MILESTONES.find(m => m.id === milestoneId)!
  return { row, followers, milestoneId, milestone }
}
