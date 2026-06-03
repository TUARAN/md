/**
 * Billing HTTP routes (Phase 5).
 *
 * Surface:
 *   POST /api/billing/intent              发起付款 (登录用户)
 *   POST /api/billing/wechat/callback     微信支付 webhook
 *   POST /api/billing/alipay/callback     支付宝 webhook
 *   POST /api/billing/admin/grant-pro     人工开通 Pro (X-Admin-Secret 头)
 *
 * 商户号未到位前: intent/callback 都 503,但请求会被 payment_events 记录,
 * 方便商户号申请下来后回看历史尝试。admin/grant-pro 立即可用。
 */

import type { Sku } from './billing'
import type { AuthEnv } from './routes'
import type { UserRecord } from './types'
import {
  extendProExpiry,
  grantManualPro,
  isValidSku,
  logPaymentEvent,
  SKU_CATALOG,
} from './billing'
import { toPublicUser } from './quota'
import { consumeRate, getClientIp, rateLimitedResponse } from './rateLimit'
import { resolveCurrentUser } from './routes'
import { getUserById } from './user'

export interface BillingEnv extends AuthEnv {
  /** Admin shared secret for `/api/billing/admin/*` endpoints. */
  ADMIN_SECRET?: string
  /** 微信支付商户号 / V3 API 密钥 / 证书序列号 — 商户号下来后填。 */
  WECHAT_MCH_ID?: string
  WECHAT_API_V3_KEY?: string
  WECHAT_APP_ID?: string
  /** 支付宝应用 id / 私钥 / 公钥 — 同上。 */
  ALIPAY_APP_ID?: string
  ALIPAY_PRIVATE_KEY?: string
  ALIPAY_PUBLIC_KEY?: string
}

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers)
  headers.set(`Content-Type`, `application/json; charset=utf-8`)
  headers.set(`Cache-Control`, `no-store`)
  headers.set(`Access-Control-Allow-Origin`, `*`)
  return new Response(JSON.stringify(body), { ...init, headers })
}

function isWechatConfigured(env: BillingEnv): boolean {
  return !!(env.WECHAT_MCH_ID && env.WECHAT_API_V3_KEY && env.WECHAT_APP_ID)
}

function isAlipayConfigured(env: BillingEnv): boolean {
  return !!(env.ALIPAY_APP_ID && env.ALIPAY_PRIVATE_KEY && env.ALIPAY_PUBLIC_KEY)
}

export async function handleBillingApi(
  env: BillingEnv,
  request: Request,
  url: URL,
): Promise<Response> {
  if (request.method === `OPTIONS`)
    return jsonResponse({}, { status: 204 })

  if (!env.DB)
    return jsonResponse({ ok: false, error: `Billing backend not configured (DB)` }, { status: 503 })

  const path = url.pathname

  // ---------------------------------------------------------------------------
  // POST /api/billing/intent
  // ---------------------------------------------------------------------------
  if (path === `/api/billing/intent` && request.method === `POST`) {
    // 用户身份必须存在
    const user = await resolveCurrentUser(env, request)
    if (!user)
      return jsonResponse({ ok: false, error: `请先登录` }, { status: 401 })

    // 反爆量 / 反爆刷
    const rl = await consumeRate(env.DB, `billing_intent`, getClientIp(request), 20, 60)
    if (!rl.allowed)
      return rateLimitedResponse(rl, `billing_intent`)

    let body: { sku?: string, provider?: string } = {}
    try { body = await request.json() }
    catch {}

    const sku = body.sku ?? ``
    const provider = body.provider ?? ``
    if (!isValidSku(sku))
      return jsonResponse({ ok: false, error: `非法 SKU` }, { status: 400 })
    if (provider !== `wechat` && provider !== `alipay`)
      return jsonResponse({ ok: false, error: `非法支付渠道` }, { status: 400 })

    if (provider === `wechat` && !isWechatConfigured(env)) {
      return jsonResponse({
        ok: false,
        error: `微信支付商户号尚未配置,先用「联系我们」开通 Pro`,
        code: `WECHAT_NOT_CONFIGURED`,
      }, { status: 503 })
    }
    if (provider === `alipay` && !isAlipayConfigured(env)) {
      return jsonResponse({
        ok: false,
        error: `支付宝商户尚未配置,先用「联系我们」开通 Pro`,
        code: `ALIPAY_NOT_CONFIGURED`,
      }, { status: 503 })
    }

    // 真实下单流程要在这里:
    //   - WeChat:  调 v3 native 接口拿 code_url(二维码)
    //   - Alipay:  pagePay 表单 / 自助开放 SDK
    // 商户号下来后用 src/lib/wechat-pay 或类似 SDK 替换下面这段。
    return jsonResponse({
      ok: false,
      error: `支付渠道集成尚未实装`,
      code: `NOT_IMPLEMENTED`,
    }, { status: 501 })
  }

  // ---------------------------------------------------------------------------
  // POST /api/billing/wechat/callback  (webhook 占位 + 审计)
  // ---------------------------------------------------------------------------
  if (path === `/api/billing/wechat/callback` && request.method === `POST`) {
    const raw = await request.text().catch(() => ``)
    await logPaymentEvent(env.DB, {
      provider: `wechat`,
      eventType: `wechat:callback_stub`,
      signatureOk: false,
      rawPayload: raw,
      processedOk: false,
    })
    // 微信要求即使我们尚未实现,返回 { code:"FAIL", message:"..." } 让它重试
    return new Response(
      JSON.stringify({ code: `FAIL`, message: `wechat pay not configured` }),
      { status: 500, headers: { 'Content-Type': `application/json` } },
    )
  }

  // ---------------------------------------------------------------------------
  // POST /api/billing/alipay/callback  (webhook 占位 + 审计)
  // ---------------------------------------------------------------------------
  if (path === `/api/billing/alipay/callback` && request.method === `POST`) {
    const raw = await request.text().catch(() => ``)
    await logPaymentEvent(env.DB, {
      provider: `alipay`,
      eventType: `alipay:callback_stub`,
      signatureOk: false,
      rawPayload: raw,
      processedOk: false,
    })
    // 支付宝期望 "fail" 字符串触发重试
    return new Response(`fail`, { status: 500 })
  }

  // ---------------------------------------------------------------------------
  // POST /api/billing/admin/grant-pro
  // 立即可用的人工开 Pro 通道。商户号期间靠这个。
  // ---------------------------------------------------------------------------
  if (path === `/api/billing/admin/grant-pro` && request.method === `POST`) {
    if (!env.ADMIN_SECRET)
      return jsonResponse({ ok: false, error: `Admin path disabled` }, { status: 503 })

    const headerSecret = request.headers.get(`x-admin-secret`) ?? ``
    if (headerSecret !== env.ADMIN_SECRET)
      return jsonResponse({ ok: false, error: `Unauthorized` }, { status: 401 })

    let body: { userId?: string, email?: string, days?: number, reason?: string } = {}
    try { body = await request.json() }
    catch {}

    const days = typeof body.days === `number` && body.days > 0 ? Math.floor(body.days) : 0
    if (days <= 0 || days > 3660)
      return jsonResponse({ ok: false, error: `days 必须在 1..3660 之间` }, { status: 400 })

    let user = body.userId ? await getUserById(env.DB, body.userId) : null
    if (!user && body.email) {
      user = await env.DB
        .prepare(`SELECT * FROM users WHERE lower(email) = lower(?)`)
        .bind(body.email)
        .first<UserRecord>()
    }
    if (!user)
      return jsonResponse({ ok: false, error: `User not found` }, { status: 404 })

    const result = await grantManualPro(env.DB, user, days, body.reason ?? `admin grant`)
    const refreshed = await getUserById(env.DB, user.id)
    return jsonResponse({
      ok: true,
      subscriptionId: result.subscription.id,
      newExpiresAt: result.newExpiry,
      user: refreshed ? toPublicUser(refreshed) : null,
    })
  }

  return jsonResponse({ ok: false, error: `Not Found` }, { status: 404 })
}

/** Re-exports for the dispatcher. */
export type { Sku }
export { extendProExpiry, SKU_CATALOG }
