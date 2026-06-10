/**
 * Billing helpers — AI 算力额度 SKU、充值记录、额度开通逻辑。
 *
 * 计费原则：Syncblog 工具永久免费；充值款项仅用于向 DeepSeek 等上游
 * 购买 API 算力并按成本为用户开通更高每日配额，平台不收取差价。
 *
 * 渠道集成（微信支付 / 支付宝）在拿到商户号之前是 stub：`createPaymentIntent`
 * 返回 503，直到 `WECHAT_MCH_ID` / `ALIPAY_APP_ID` 等 secret 配齐。
 * 与此同时 `grantManualPro` 让我们能从 D1 console 或 Worker admin 路由
 * 人工开通额度，商户号下来前不影响有充值意向的用户。
 */

import type { SubscriptionRecord, UserRecord } from './types'

/** 月充 / 年充。价格按分存（避免浮点误差），对应上游 API 成本估算。 */
export const SKU_CATALOG = {
  pro_monthly: {
    label: `AI 算力月充`,
    amountCents: 3900, // ¥39 — 成本价中转，非平台订阅费
    durationDays: 31,
  },
  pro_yearly: {
    label: `AI 算力年充`,
    amountCents: 39900, // ¥399 — 预充一年，仍按成本估算
    durationDays: 366,
  },
} as const

export type Sku = keyof typeof SKU_CATALOG

export function isValidSku(s: string): s is Sku {
  return s in SKU_CATALOG
}

/**
 * 把充值记录写进 D1。`status` 通常先 `pending`，后续 webhook 校验通过再改 active。
 */
export async function insertSubscription(
  db: D1Database,
  params: {
    userId: string
    provider: SubscriptionRecord['provider']
    sku: Sku
    status: SubscriptionRecord['status']
    providerOrderId?: string | null
    providerSubscriptionId?: string | null
    durationDaysOverride?: number
  },
): Promise<SubscriptionRecord> {
  const now = Math.floor(Date.now() / 1000)
  const id = crypto.randomUUID()
  const catalogEntry = SKU_CATALOG[params.sku]
  const durationDays = params.durationDaysOverride ?? catalogEntry.durationDays
  const startedAt = params.status === `active` ? now : 0
  const currentPeriodEnd = params.status === `active` ? now + durationDays * 86400 : 0

  await db
    .prepare(
      `INSERT INTO subscriptions
        (id, user_id, provider, provider_order_id, provider_subscription_id,
         sku, status, amount_cents, currency, started_at, current_period_end,
         cancelled_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'CNY', ?, ?, NULL, ?, ?)`,
    )
    .bind(
      id,
      params.userId,
      params.provider,
      params.providerOrderId ?? null,
      params.providerSubscriptionId ?? null,
      params.sku,
      params.status,
      catalogEntry.amountCents,
      startedAt,
      currentPeriodEnd,
      now,
      now,
    )
    .run()

  return {
    id,
    user_id: params.userId,
    provider: params.provider,
    provider_order_id: params.providerOrderId ?? null,
    provider_subscription_id: params.providerSubscriptionId ?? null,
    sku: params.sku,
    status: params.status,
    amount_cents: catalogEntry.amountCents,
    currency: `CNY`,
    started_at: startedAt,
    current_period_end: currentPeriodEnd,
    cancelled_at: null,
    created_at: now,
    updated_at: now,
  }
}

/**
 * 把用户的 AI 额度有效期往后推 `days` 天。如果用户当前已有额度，从现有的
 * `pro_expires_at` 开始延长（续充场景）；否则从 now 开始。
 *
 * 返回新的 `pro_expires_at`（unix sec）。
 */
export async function extendProExpiry(
  db: D1Database,
  user: UserRecord,
  days: number,
): Promise<number> {
  const now = Math.floor(Date.now() / 1000)
  const baseline = user.pro_expires_at && user.pro_expires_at > now
    ? user.pro_expires_at
    : now
  const newExpiry = baseline + days * 86400

  await db
    .prepare(
      `UPDATE users SET pro_expires_at = ?, plan = 'pro', updated_at = ? WHERE id = ?`,
    )
    .bind(newExpiry, now, user.id)
    .run()

  return newExpiry
}

/**
 * Admin / 商户号未到位期间的「人工开通额度」路径。
 *   - 写一条 provider='manual' 的 active 充值记录
 *   - 延长 pro_expires_at
 *   - 不收钱、不需要回调
 *
 * 调用方负责鉴权（目前在 /api/billing/admin/grant-pro 里用 ADMIN_SECRET）。
 */
export async function grantManualPro(
  db: D1Database,
  user: UserRecord,
  days: number,
  reason: string,
): Promise<{ subscription: SubscriptionRecord, newExpiry: number }> {
  const subscription = await insertSubscription(db, {
    userId: user.id,
    provider: `manual`,
    sku: days >= 180 ? `pro_yearly` : `pro_monthly`,
    status: `active`,
    providerOrderId: `manual:${reason}`,
    durationDaysOverride: days,
  })
  const newExpiry = await extendProExpiry(db, user, days)
  return { subscription, newExpiry }
}

/**
 * 落 webhook 原始 payload + 签名校验结果到 payment_events,留作审计。
 * 不抛错 —— 审计失败不应该阻塞 webhook 200 OK。
 */
export async function logPaymentEvent(
  db: D1Database,
  params: {
    subscriptionId?: string | null
    provider: string
    eventType: string
    signatureOk: boolean
    rawPayload: string
    processedOk: boolean
  },
): Promise<void> {
  const now = Math.floor(Date.now() / 1000)
  try {
    await db
      .prepare(
        `INSERT INTO payment_events
          (id, subscription_id, provider, event_type, signature_ok, raw_payload, processed_ok, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        crypto.randomUUID(),
        params.subscriptionId ?? null,
        params.provider,
        params.eventType,
        params.signatureOk ? 1 : 0,
        params.rawPayload,
        params.processedOk ? 1 : 0,
        now,
      )
      .run()
  }
  catch (err) {
    console.error(`[payment_events] failed to log`, err)
  }
}
