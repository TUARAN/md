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
}
