import type { CreatorOfferContent, UserCreatorOfferContent } from '@/constants/creatorOffer'
import type { PublicCreatorProfileView, UserCreatorProfile } from '@/types/creatorProfile'
import { getCreatorOffer } from '@/constants/creatorOffer'
import { isSiteOwnerCreatorId, isSiteOwnerEmail } from '@/constants/siteOwner'

type ProfileLike = UserCreatorProfile | PublicCreatorProfileView

function sumNumericLabels(values: string[]): string {
  let total = 0
  let hasValue = false
  for (const raw of values) {
    const normalized = raw.replace(/[,，]/g, ``).trim()
    if (!normalized || normalized === `—`)
      continue
    const wan = normalized.match(/^([\d.]+)\s*万$/)
    if (wan) {
      total += Number.parseFloat(wan[1]!) * 10_000
      hasValue = true
      continue
    }
    const num = Number.parseFloat(normalized.replace(/[^\d.]/g, ``))
    if (Number.isFinite(num)) {
      total += num
      hasValue = true
    }
  }
  if (!hasValue)
    return `—`
  if (total >= 10_000)
    return `约 ${(total / 10_000).toFixed(1).replace(/\.0$/, ``)} 万`
  return `约 ${Math.round(total).toLocaleString(`zh-CN`)}`
}

function buildPlatformMatrix(profile: ProfileLike) {
  return profile.socialAccounts
    .filter(account => account.url)
    .map(account => ({
      type: account.type,
      url: account.url,
      followers: account.followers ?? `—`,
      reads: account.reads ?? `—`,
    }))
}

export function buildUserCreatorOffer(profile: ProfileLike): UserCreatorOfferContent {
  const matrix = buildPlatformMatrix(profile)
  const followerValues = matrix.map(row => row.followers)
  const readValues = matrix.map(row => row.reads)

  return {
    kind: `user`,
    id: profile.creatorId,
    displayName: profile.displayName,
    pageTitle: `${profile.displayName} · 创作名片`,
    headline: profile.displayName,
    subheadline: `个人 IP 的内容与分发说明`,
    tagline: profile.tagline || `多平台内容创作与同步`,
    homepage: profile.homepage ?? ``,
    contactHint: profile.contactHint ?? `如需合作，请通过主页或各平台私信联系`,
    reachSummary: {
      followers: sumNumericLabels(followerValues),
      reads: sumNumericLabels(readValues),
      platformCount: matrix.length,
      syncCapability: `${matrix.length || 0}`,
    },
    // 普通用户不展示站长 services / funnel / modes 等定制内容；保留空结构便于模板统一访问
    services: [],
    funnel: {
      exposureBasis: [
        { label: `展示平台`, value: `${matrix.length} 个`, note: `已录入或检测到的发声渠道` },
      ],
      ctrRange: `—`,
      leadRateRange: `—`,
      closeRateRange: `—`,
      disclaimer: `以上为各平台已录入数据的简单汇总，仅供个人运营参考。`,
    },
    modes: [],
    workflow: [`录入平台账号`, `整理内容`, `多平台同步`, `数据复盘`],
    brandFit: {
      good: [`持续输出的个人或团队 IP`],
      caution: [`需额外合规审稿的行业内容`],
      bad: [`与账号调性严重冲突的营销需求`],
    },
    dataFootnote: `粉丝 / 阅读来自发布插件检测或手动录入，各平台口径不一致，仅作展示参考。`,
    platformMatrix: matrix,
  }
}

export interface CreatorOfferResolverOptions {
  email?: string | null
  profile?: UserCreatorProfile | null
  publicProfile?: PublicCreatorProfileView | null
  shareAccess?: boolean
}

export function resolveCreatorOffer(
  creatorId: string,
  options: CreatorOfferResolverOptions,
): CreatorOfferContent | null {
  const id = creatorId.trim().toLowerCase()
  if (!id)
    return null
  if (isSiteOwnerCreatorId(id)) {
    if (options.shareAccess)
      return getCreatorOffer(id)
    if (isSiteOwnerEmail(options.email))
      return getCreatorOffer(id)
    return null
  }

  const publicProfile = options.publicProfile?.creatorId === id
    ? options.publicProfile
    : null
  const ownerProfile = options.profile?.creatorId === id ? options.profile : null
  const profile = publicProfile ?? ownerProfile

  if (profile)
    return buildUserCreatorOffer(profile)
  return null
}

export function canViewCreatorOffer(
  creatorId: string,
  options: CreatorOfferResolverOptions,
): boolean {
  return resolveCreatorOffer(creatorId, options) !== null
}

export function listWorkflowCreatorOptions(
  options: {
    email?: string | null
    profile?: UserCreatorProfile | null
  },
) {
  const current = options.profile
  if (!current)
    return []
  return [{
    id: current.creatorId,
    displayName: current.displayName,
    subtitle: isSiteOwnerEmail(options.email) ? `站长 · 个人 IP` : `我的创作名片`,
  }]
}

export function getCreatorPlatformMatrixForUser(
  creatorId: string,
  options: CreatorOfferResolverOptions,
) {
  const offer = resolveCreatorOffer(creatorId, options)
  if (!offer)
    return []
  return offer.platformMatrix.map(row => ({ ...row }))
}

export function getPlatformMatrixRow(
  creatorId: string,
  platformType: string,
  options: CreatorOfferResolverOptions,
) {
  return getCreatorPlatformMatrixForUser(creatorId, options)
    .find(row => row.type === platformType) ?? null
}
