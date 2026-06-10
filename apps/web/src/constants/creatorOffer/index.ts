import { TUARAN_CREATOR_ID, TUARAN_OFFER } from '@/constants/creatorOffer/tuaran'

/*
 * 名片内容的结构化形状。站长 TUARAN_OFFER 用 `as const` 保留字面量类型，
 * 用户内容则用下面这些 readonly 接口，避免被站长字面量约束。
 *
 * 通过 `kind` 字段做判别联合：模板里 narrow 后两边都有同名字段可访问。
 */

export interface CreatorReachSummary {
  followers: string
  reads: string
  platformCount: number
  syncCapability: string
}

export interface CreatorPlatformMatrixRow {
  type: string
  url: string
  followers: string
  reads: string
}

export interface CreatorService {
  id: string
  name: string
  summary: string
  deliverables: readonly string[]
  timeline: string
  fit: string
}

export interface CreatorFunnelExposureBasis {
  label: string
  value: string
  note: string
}

export interface CreatorFunnel {
  exposureBasis: readonly CreatorFunnelExposureBasis[]
  ctrRange: string
  leadRateRange: string
  closeRateRange: string
  disclaimer: string
}

export interface CreatorMode {
  name: string
  desc: string
}

export interface CreatorBrandFit {
  good: readonly string[]
  caution: readonly string[]
  bad: readonly string[]
}

/** 站长名片：完整服务档位 + 漏斗 + 品牌适配（保留 as const 字面量类型） */
export type SiteOwnerCreatorOffer = typeof TUARAN_OFFER

/** 普通用户名片：仅展示平台矩阵与基础联系信息，services/funnel/modes 等用占位的空集合，但用通用结构类型 */
export interface UserCreatorOfferContent {
  kind: 'user'
  id: string
  displayName: string
  pageTitle: string
  headline: string
  subheadline: string
  tagline: string
  homepage: string
  contactHint: string
  reachSummary: CreatorReachSummary
  platformMatrix: readonly CreatorPlatformMatrixRow[]
  dataFootnote: string
  // 这些字段保持空数组/空对象占位，便于模板统一访问；但不会被站长分支模板渲染
  services: readonly CreatorService[]
  funnel: CreatorFunnel
  modes: readonly CreatorMode[]
  workflow: readonly string[]
  brandFit: CreatorBrandFit
}

/** 模板渲染的统一 offer 类型 —— 通过 `kind` 字段做判别联合 */
export type CreatorOfferContent = SiteOwnerCreatorOffer | UserCreatorOfferContent

const OFFER_BY_ID: Record<string, SiteOwnerCreatorOffer> = {
  [TUARAN_CREATOR_ID]: TUARAN_OFFER,
}

export function getCreatorOffer(creatorId: string): SiteOwnerCreatorOffer | null {
  return OFFER_BY_ID[creatorId.trim().toLowerCase()] ?? null
}

export function isSiteOwnerOffer(offer: CreatorOfferContent | null | undefined): offer is SiteOwnerCreatorOffer {
  return !!offer && offer.kind === `site-owner`
}

export { TUARAN_CREATOR_ID, TUARAN_OFFER }
