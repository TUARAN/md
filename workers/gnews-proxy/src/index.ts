/**
 * Minimal proxy: GET/HEAD /api/v4/search → https://gnews.io/api/v4/search
 */

export interface Env {
  /** Optional; used only when the client does not provide an `apikey` query param */
  GNEWS_API_KEY?: string
  /** Comma-separated origins, or "*" */
  ALLOWED_ORIGINS?: string
}

const UPSTREAM_SEARCH = `https://gnews.io/api/v4/search`

function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith(`/`))
    return pathname.slice(0, -1)
  return pathname
}

function resolveAllowOrigin(request: Request, env: Env): string | null {
  const raw = env.ALLOWED_ORIGINS?.trim()
  if (!raw || raw === `*`)
    return `*`

  const origins = raw.split(`,`).map(s => s.trim()).filter(Boolean)
  const origin = request.headers.get(`Origin`)
  if (origin && origins.includes(origin))
    return origin

  return null
}

function corsHeaders(request: Request, env: Env): Headers {
  const h = new Headers()
  const allowOrigin = resolveAllowOrigin(request, env)
  if (allowOrigin)
    h.set(`Access-Control-Allow-Origin`, allowOrigin)

  h.set(`Access-Control-Allow-Methods`, `GET, HEAD, OPTIONS`)

  const reqHdrs = request.headers.get(`Access-Control-Request-Headers`)
  h.set(`Access-Control-Allow-Headers`, reqHdrs ?? `Content-Type, Accept`)

  h.set(`Access-Control-Max-Age`, `86400`)
  return h
}

function mergeResponseCors(
  upstream: Response,
  request: Request,
  env: Env,
): Response {
  const headers = new Headers(upstream.headers)
  const cors = corsHeaders(request, env)
  cors.forEach((value, key) => {
    headers.set(key, value)
  })
  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  })
}

function jsonResponse(
  data: unknown,
  status: number,
  request: Request,
  env: Env,
): Response {
  const h = corsHeaders(request, env)
  h.set(`Content-Type`, `application/json; charset=utf-8`)
  return new Response(JSON.stringify(data), { status, headers: h })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const path = normalizePath(url.pathname)

    if (path !== `/api/v4/search`) {
      const h = corsHeaders(request, env)
      h.set(`Content-Type`, `text/plain; charset=utf-8`)
      return new Response(`Not Found`, { status: 404, headers: h })
    }

    if (request.method === `OPTIONS`) {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(request, env),
      })
    }

    if (request.method !== `GET` && request.method !== `HEAD`) {
      const h = corsHeaders(request, env)
      h.set(`Content-Type`, `text/plain; charset=utf-8`)
      return new Response(`Method Not Allowed`, { status: 405, headers: h })
    }

    const upstreamUrl = new URL(UPSTREAM_SEARCH)
    url.searchParams.forEach((value, key) => {
      upstreamUrl.searchParams.set(key, value)
    })

    const secret = env.GNEWS_API_KEY?.trim()
    if (!upstreamUrl.searchParams.get(`apikey`)?.trim() && secret)
      upstreamUrl.searchParams.set(`apikey`, secret)

    if (!upstreamUrl.searchParams.get(`apikey`)?.trim()) {
      return jsonResponse(
        { errors: [`GNEWS_API_KEY is not configured on the proxy worker`] },
        400,
        request,
        env,
      )
    }

    const upstream = await fetch(upstreamUrl.toString(), {
      method: request.method,
      headers: {
        Accept: request.headers.get(`Accept`) ?? `application/json`,
      },
    })

    return mergeResponseCors(upstream, request, env)
  },
}
