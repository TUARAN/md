import type { BillingEnv } from './auth/billingRoutes'
import type { AuthEnv } from './auth/routes'
import {
  handleDefaultImgbedRequest,
  resolveDefaultImgbedPathname,
} from '@md/shared/utils/defaultImgbed'
import { WorkerEntrypoint } from 'cloudflare:workers'
import { handleBillingApi } from './auth/billingRoutes'
import { consumeAiQuota } from './auth/quota'
import { consumeRate, getClientIp, rateLimitedResponse } from './auth/rateLimit'
import { handleAuthApi, resolveCurrentUser } from './auth/routes'
import { handleDistributionCheckinsApi } from './distributionCheckins'

const MP_HOST = `https://api.weixin.qq.com`
const DEEPSEEK_HOST = `https://api.deepseek.com`
const ANONYMOUS_AI_DAILY_LIMIT = 3

interface Env extends AuthEnv, BillingEnv {
  ASSETS: { fetch: (request: Request) => Promise<Response> }
  IMGBED_GITHUB_TOKENS?: string
  IMGBED_GITHUB_USERNAME?: string
  IMGBED_GITHUB_BRANCH?: string
  IMGBED_GITHUB_REPO_COUNT?: string
  IMGBED_USE_CDN?: string
  DEEPSEEK_API_KEY?: string
  DEEPSEEK_ACCESS_PASSWORD?: string
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length)
    return false
  let diff = 0
  for (let i = 0; i < a.length; i++)
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export default class extends WorkerEntrypoint<Env> {
  /**
   * Scheduled handler — wired to the daily cron in wrangler.jsonc.
   * Cleans up `rate_limits` rows whose window has long expired so the table
   * doesn't grow unbounded. Cheap: indexed scan + DELETE in a single D1
   * statement; runs once a day.
   */
  async scheduled(): Promise<void> {
    if (!this.env.DB)
      return
    const now = Math.floor(Date.now() / 1000)
    try {
      const res = await this.env.DB
        .prepare(`DELETE FROM rate_limits WHERE expires_at < ?`)
        .bind(now)
        .run()
      console.log(`[rate_limits GC] removed ${res.meta?.changes ?? 0} expired rows`)
    }
    catch (err) {
      console.error(`[rate_limits GC] failed`, err)
    }
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    if (resolveDefaultImgbedPathname(url.pathname))
      return handleDefaultImgbedRequest(request, this.env)

    if (url.pathname.startsWith(`/api/auth/`))
      return handleAuthApi(this.env, request, url)

    if (url.pathname.startsWith(`/api/billing/`))
      return handleBillingApi(this.env, request, url)

    if (url.pathname.startsWith(`/api/deepseek/`))
      return this.handleDeepSeekApi(request, url)

    if (url.pathname === `/api/distribution/checkins`)
      return handleDistributionCheckinsApi(this.env, request, url)

    if (url.pathname.startsWith(`/api/`))
      return this.handleIPReachApi(request, url)

    // 仅代理微信公众号 API；其余请求（含前端静态资源）走 ASSETS
    if (url.pathname.startsWith(`/cgi-bin/`))
      return this.proxyWeixin(request, url)

    if (this.env.ASSETS)
      return this.env.ASSETS.fetch(request)

    return new Response(`Not Found`, { status: 404 })
  }

  private async proxyWeixin(request: Request, url: URL): Promise<Response> {
    const targetUrl = `${MP_HOST}${url.pathname}${url.search}`

    const headers = new Headers(request.headers)
    headers.delete(`host`)
    headers.delete(`content-length`)
    headers.delete(`cf-connecting-ip`)
    headers.delete(`x-forwarded-for`)

    const init: RequestInit = {
      method: request.method,
      headers,
      redirect: `follow`,
    }

    if (request.method !== `GET` && request.method !== `HEAD`)
      init.body = request.body

    try {
      const resp = await fetch(targetUrl, init)
      const respHeaders = new Headers(resp.headers)
      respHeaders.set(`Access-Control-Allow-Origin`, `*`)
      respHeaders.set(`Access-Control-Allow-Headers`, `*`)

      return new Response(resp.body, {
        status: resp.status,
        headers: respHeaders,
      })
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      return Response.json({ error: message }, { status: 500 })
    }
  }

  private async handleDeepSeekApi(request: Request, url: URL): Promise<Response> {
    if (request.method === `OPTIONS`)
      return this.jsonWithCors({})

    if (request.method !== `POST`) {
      return this.jsonWithCors(
        { ok: false, error: `Method Not Allowed` },
        { status: 405 },
      )
    }

    const apiKey = this.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      return this.jsonWithCors(
        { ok: false, error: `DeepSeek 代理未配置（缺少 DEEPSEEK_API_KEY）` },
        { status: 503 },
      )
    }

    const expectedPassword = this.env.DEEPSEEK_ACCESS_PASSWORD

    if (url.pathname === `/api/deepseek/unlock`) {
      // Legacy password gate. Kept while account rollout is in flight; once
      // every active user has logged in via GitHub we can return 410 here.
      if (!expectedPassword) {
        return this.jsonWithCors(
          { ok: false, error: `密码登录已停用，请使用账号登录` },
          { status: 410 },
        )
      }
      let body: { password?: string } = {}
      try {
        body = await request.json()
      }
      catch {}
      const password = body.password ?? ``
      if (!password || !timingSafeEqual(password, expectedPassword))
        return this.jsonWithCors({ ok: false, error: `密码错误` }, { status: 401 })
      return this.jsonWithCors({ ok: true })
    }

    if (url.pathname === `/api/deepseek/chat`) {
      // Defence-in-depth layer 1: per-IP rate limit. Drops abusive bursts
      // before the upstream API key or user quota is involved.
      if (this.env.DB) {
        const rl = await consumeRate(
          this.env.DB,
          `deepseek_chat`,
          getClientIp(request),
          30, // 30 requests / minute / IP
          60,
        )
        if (!rl.allowed)
          return rateLimitedResponse(rl, `deepseek_chat`)
      }

      // Auth precedence: signed session > legacy password header.
      const user = await resolveCurrentUser(this.env, request)

      if (user) {
        if (!this.env.DB) {
          return this.jsonWithCors(
            { ok: false, error: `账号后端未就绪` },
            { status: 503 },
          )
        }
        const snapshot = await consumeAiQuota(this.env.DB, user)
        if (!snapshot) {
          return this.jsonWithCors(
            {
              ok: false,
              error: `今日 AI 配额已用尽，明天 UTC 0 点重置或充值 AI 算力额度（成本价中转）`,
              code: `QUOTA_EXHAUSTED`,
            },
            { status: 429 },
          )
        }
      }
      else {
        if (this.env.DB) {
          const anonQuota = await consumeRate(
            this.env.DB,
            `deepseek_chat_anon_daily`,
            getClientIp(request),
            ANONYMOUS_AI_DAILY_LIMIT,
            24 * 60 * 60,
          )
          if (!anonQuota.allowed) {
            return this.jsonWithCors(
              {
                ok: false,
                error: `今日免费试用次数已用完，登录后可继续免费使用`,
                code: `ANON_QUOTA_EXHAUSTED`,
                limit: ANONYMOUS_AI_DAILY_LIMIT,
                retryAfter: anonQuota.retryAfter,
              },
              { status: 429 },
            )
          }
        }
        else {
          // Legacy fallback for non-D1 deployments.
          if (!expectedPassword) {
            return this.jsonWithCors(
              { ok: false, error: `未登录`, code: `LOGIN_REQUIRED` },
              { status: 401 },
            )
          }
          const password = request.headers.get(`x-deepseek-password`) ?? ``
          if (!password || !timingSafeEqual(password, expectedPassword))
            return this.jsonWithCors({ ok: false, error: `未授权` }, { status: 401 })
        }
      }

      const upstream = await fetch(`${DEEPSEEK_HOST}/v1/chat/completions`, {
        method: `POST`,
        headers: {
          'Content-Type': request.headers.get(`content-type`) ?? `application/json`,
          'Authorization': `Bearer ${apiKey}`,
          'Accept': request.headers.get(`accept`) ?? `text/event-stream`,
        },
        body: request.body,
      })

      const respHeaders = new Headers()
      const passthrough = [`content-type`, `cache-control`, `transfer-encoding`]
      for (const h of passthrough) {
        const v = upstream.headers.get(h)
        if (v)
          respHeaders.set(h, v)
      }
      respHeaders.set(`Access-Control-Allow-Origin`, `*`)
      respHeaders.set(`Access-Control-Allow-Headers`, `*`)

      return new Response(upstream.body, {
        status: upstream.status,
        headers: respHeaders,
      })
    }

    return this.jsonWithCors({ ok: false, error: `Not Found` }, { status: 404 })
  }

  private async handleIPReachApi(request: Request, url: URL): Promise<Response> {
    if (request.method === `OPTIONS`)
      return this.jsonWithCors({})

    if (request.method !== `POST`) {
      return this.jsonWithCors(
        { ok: false, error: `Method Not Allowed` },
        { status: 405 },
      )
    }

    if (url.pathname === `/api/ip`)
      return this.detectWorkerIp()

    if (url.pathname === `/api/visit`) {
      return this.jsonWithCors({
        ok: false,
        error: `Cloudflare Worker 版本不支持通过 HTTP/SOCKS 代理访问目标链接。请连接独立 Node/VPS 后端，或使用 muti-ip 的 local-node 分支。`,
      })
    }

    if (url.pathname === `/api/91http/extract`) {
      return this.jsonWithCors({
        ok: false,
        error: `Cloudflare Worker 版本不建议直接提取 91HTTP 代理；即使能提取，也无法在 Worker 中使用 curl --proxy 消费这些代理。请连接独立 Node/VPS 后端。`,
      })
    }

    if (url.pathname === `/api/91http/extract-visit`) {
      return this.jsonWithCors({
        ok: false,
        attempts: [],
        error: `Cloudflare Worker 版本不支持提取后通过代理访问。完整功能请连接独立 Node/VPS 后端，或使用 muti-ip 的 local-node 分支。`,
      })
    }

    return this.jsonWithCors({ ok: false, error: `Not Found` }, { status: 404 })
  }

  private async detectWorkerIp(): Promise<Response> {
    try {
      const response = await fetch(`https://api.ipify.org?format=json`, {
        headers: { 'user-agent': `md-ip-reach-tool-cloudflare/1.0` },
      })
      const data = await response.json<{ ip?: string }>()

      return this.jsonWithCors({
        ok: true,
        ip: data.ip,
        service: `https://api.ipify.org?format=json`,
        proxy: ``,
        note: `这是 Cloudflare Worker 的出口 IP，不是你的本机出口 IP。`,
      })
    }
    catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      return this.jsonWithCors({ ok: false, error: message }, { status: 500 })
    }
  }

  private jsonWithCors(body: unknown, init: ResponseInit = {}): Response {
    const headers = new Headers(init.headers)
    headers.set(`Access-Control-Allow-Origin`, `*`)
    headers.set(`Access-Control-Allow-Headers`, `*`)
    headers.set(`Access-Control-Allow-Methods`, `POST, OPTIONS`)

    return Response.json(body, {
      ...init,
      headers,
    })
  }
}
