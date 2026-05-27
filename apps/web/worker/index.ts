import {
  handleDefaultImgbedRequest,
  resolveDefaultImgbedPathname,
} from '@md/shared/utils/defaultImgbed'
import { WorkerEntrypoint } from 'cloudflare:workers'

const MP_HOST = `https://api.weixin.qq.com`

interface Env {
  ASSETS: { fetch: (request: Request) => Promise<Response> }
  IMGBED_GITHUB_TOKENS?: string
  IMGBED_GITHUB_USERNAME?: string
  IMGBED_GITHUB_BRANCH?: string
  IMGBED_GITHUB_REPO_COUNT?: string
  IMGBED_USE_CDN?: string
}

export default class extends WorkerEntrypoint<Env> {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    if (resolveDefaultImgbedPathname(url.pathname))
      return handleDefaultImgbedRequest(request, this.env)

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
