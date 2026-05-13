/**
 * News proxy: GET/HEAD /api/:provider/search → upstream news APIs.
 * Legacy GET/HEAD /api/v4/search still maps to GNews.
 */

export interface Env {
  /** Optional; used only when the client does not provide an `apikey` query param */
  GNEWS_API_KEY?: string
  NEWSAPI_API_KEY?: string
  MEDIASTACK_API_KEY?: string
  GUARDIAN_API_KEY?: string
  CURRENTS_API_KEY?: string
  /** Comma-separated origins, or "*" */
  ALLOWED_ORIGINS?: string
}

type Provider = `gnews` | `hackernews` | `newsapi` | `mediastack` | `guardian` | `currents`

const PROVIDERS = new Set<Provider>([`gnews`, `hackernews`, `newsapi`, `mediastack`, `guardian`, `currents`])

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

function clampInt(value: string | null, fallback: number, min: number, max: number): number {
  const n = Number(value)
  if (!Number.isFinite(n))
    return fallback
  return Math.min(max, Math.max(min, Math.trunc(n)))
}

function resolveProvider(path: string): Provider | null {
  if (path === `/api/v4/search`)
    return `gnews`

  const match = /^\/api\/([^/]+)\/search$/u.exec(path)
  const candidate = match?.[1] as Provider | undefined
  if (candidate && PROVIDERS.has(candidate))
    return candidate
  return null
}

function resolveApiKey(provider: Provider, params: URLSearchParams, env: Env): string {
  const clientKey = params.get(`apikey`)?.trim()
  if (clientKey)
    return clientKey

  const secrets: Record<Provider, string | undefined> = {
    gnews: env.GNEWS_API_KEY,
    hackernews: undefined,
    newsapi: env.NEWSAPI_API_KEY,
    mediastack: env.MEDIASTACK_API_KEY,
    guardian: env.GUARDIAN_API_KEY,
    currents: env.CURRENTS_API_KEY,
  }
  return secrets[provider]?.trim() ?? ``
}

function buildUpstreamUrl(provider: Provider, requestUrl: URL, apiKey: string): URL {
  const p = requestUrl.searchParams
  const q = p.get(`q`)?.trim() ?? ``
  const max = clampInt(p.get(`max`), 10, 1, 100)
  const page = clampInt(p.get(`page`), 1, 1, 100)
  const lang = p.get(`lang`)?.trim()
  const country = p.get(`country`)?.trim()
  const sortby = p.get(`sortby`) === `relevance` ? `relevance` : `publishedAt`

  if (provider === `hackernews`) {
    const u = new URL(`https://hn.algolia.com/api/v1/${sortby === `relevance` ? `search` : `search_by_date`}`)
    u.searchParams.set(`query`, q)
    u.searchParams.set(`tags`, `story`)
    u.searchParams.set(`hitsPerPage`, String(max))
    u.searchParams.set(`page`, String(page - 1))
    return u
  }

  if (provider === `gnews`) {
    const u = new URL(`https://gnews.io/api/v4/search`)
    u.searchParams.set(`q`, q)
    u.searchParams.set(`apikey`, apiKey)
    u.searchParams.set(`max`, String(max))
    u.searchParams.set(`page`, String(page))
    u.searchParams.set(`sortby`, sortby)
    u.searchParams.set(`in`, p.get(`in`)?.trim() || `title,description`)
    if (lang)
      u.searchParams.set(`lang`, lang)
    if (country)
      u.searchParams.set(`country`, country.toLowerCase())
    return u
  }

  if (provider === `newsapi`) {
    const u = new URL(`https://newsapi.org/v2/everything`)
    u.searchParams.set(`q`, q)
    u.searchParams.set(`apiKey`, apiKey)
    u.searchParams.set(`pageSize`, String(max))
    u.searchParams.set(`page`, String(page))
    u.searchParams.set(`sortBy`, sortby === `relevance` ? `relevancy` : `publishedAt`)
    if (lang)
      u.searchParams.set(`language`, lang)
    return u
  }

  if (provider === `mediastack`) {
    const u = new URL(`http://api.mediastack.com/v1/news`)
    u.searchParams.set(`access_key`, apiKey)
    u.searchParams.set(`keywords`, q)
    u.searchParams.set(`limit`, String(max))
    u.searchParams.set(`offset`, String((page - 1) * max))
    u.searchParams.set(`sort`, sortby === `relevance` ? `popularity` : `published_desc`)
    if (lang)
      u.searchParams.set(`languages`, lang)
    if (country)
      u.searchParams.set(`countries`, country.toLowerCase())
    return u
  }

  if (provider === `guardian`) {
    const u = new URL(`https://content.guardianapis.com/search`)
    u.searchParams.set(`q`, q)
    u.searchParams.set(`api-key`, apiKey)
    u.searchParams.set(`page-size`, String(Math.min(50, max)))
    u.searchParams.set(`page`, String(page))
    u.searchParams.set(`order-by`, sortby === `relevance` ? `relevance` : `newest`)
    u.searchParams.set(`show-fields`, `trailText,bodyText,thumbnail`)
    return u
  }

  const u = new URL(`https://api.currentsapi.services/v1/search`)
  u.searchParams.set(`keywords`, q)
  u.searchParams.set(`apiKey`, apiKey)
  u.searchParams.set(`page_size`, String(Math.min(200, max)))
  u.searchParams.set(`page_number`, String(page))
  if (lang)
    u.searchParams.set(`language`, lang)
  if (country)
    u.searchParams.set(`country`, country.toUpperCase())
  return u
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const path = normalizePath(url.pathname)
    const provider = resolveProvider(path)

    if (!provider) {
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

    const apiKey = resolveApiKey(provider, url.searchParams, env)
    if (provider !== `hackernews` && !apiKey) {
      return jsonResponse(
        { errors: [`${provider.toUpperCase()} API key is not configured`] },
        400,
        request,
        env,
      )
    }

    const upstreamUrl = buildUpstreamUrl(provider, url, apiKey)
    const upstream = await fetch(upstreamUrl.toString(), {
      method: request.method,
      headers: {
        Accept: request.headers.get(`Accept`) ?? `application/json`,
      },
    })

    return mergeResponseCors(upstream, request, env)
  },
}
