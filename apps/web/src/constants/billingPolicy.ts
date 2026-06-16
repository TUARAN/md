/**
 * 计费与额度政策 — 用户可见声明集中处。
 *
 * 原则：内容同步智能体工具本身永久免费；登录用于身份与免费额度；
 * 充值仅为向大模型服务商中转购买 API 算力，平台不收取差价。
 */

/** 额度包（内部 plan=pro）在用户界面上的名称 */
export const QUOTA_PACK_LABEL = `AI 算力额度`

/** 免费每日 AI 调用次数（与 worker/auth/quota.ts 中 free 档一致） */
export const FREE_DAILY_AI_QUOTA = 10

/** 充值后每日 AI 调用次数（与 worker/auth/quota.ts 中 pro 档一致） */
export const TOPUP_DAILY_AI_QUOTA = 1000

/** 平台免费声明（短） */
export const PLATFORM_FREE_STATEMENT
  = `内容同步智能体的编辑器、主题、导出与多平台同步等核心功能永久免费，不收取使用费。`

/** 登录用途声明 */
export const LOGIN_PURPOSE_STATEMENT
  = `登录仅用于保存账号身份、同步偏好，以及领取每日免费 AI 试用额度；登录本身不收费。`

/** 充值中转声明（核心） */
export const PAYMENT_PASS_THROUGH_STATEMENT
  = `充值款项仅用于向 DeepSeek 等上游大模型服务商购买 API 调用算力，并按成本为你开通更高的每日额度。平台不从中收取差价或服务费。`

/** 完整计费政策（用于定价页等） */
export const BILLING_POLICY_BULLETS = [
  PLATFORM_FREE_STATEMENT,
  LOGIN_PURPOSE_STATEMENT,
  PAYMENT_PASS_THROUGH_STATEMENT,
  `额度包价格为上游 API 成本的估算中转价，会随服务商调价而更新；未用完的每日额度不结转。`,
  `充值不等于订阅付费产品，仅提升 AI 调用配额；工具能力与后续功能迭代对所有人免费开放。`,
] as const

/** SKU 展示（金额仍与 worker/auth/billing.ts 保持一致，按分存储） */
export const QUOTA_PACK_PRICING = {
  monthly: {
    label: `月充`,
    amount: 39,
    suffix: `/ 月`,
    note: `约 ¥1.3/天，对应 DeepSeek API 成本估算`,
  },
  yearly: {
    label: `年充`,
    amount: 399,
    suffix: `/ 年`,
    note: `预充一年，单价略低于月充（仍按成本估算，无平台加价）`,
  },
} as const
