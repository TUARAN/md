import type { GNewsArticle } from '@md/shared/utils/gnews'
import {
  buildGNewsSearchUrl,
  formatGNewsArticlesAsPromptPack,
  parseGNewsSearchResponse,
} from '@md/shared/utils/gnews'

export interface GNewsFetchOptions {
  q: string
  apikey?: string
  lang?: string
  country?: string
  max?: number
  page?: number
  sortby?: `publishedAt` | `relevance`
  /** 关键词匹配字段，默认 title,description */
  in?: string
}

export interface GNewsFetchResult {
  articles: GNewsArticle[]
  formatted: string
  totalArticles?: number
  error?: string
}

export const DEFAULT_GNEWS_PROXY_URL = `https://md-gnews-proxy.tuaran666.workers.dev/api/v4`

export function resolveGNewsProxyBase(): string {
  const configured = (import.meta.env.VITE_GNEWS_PROXY_URL ?? ``).trim()
  if (configured)
    return configured

  if (
    typeof window !== `undefined`
    && window.location.hostname === `md.tuaran666.workers.dev`
  ) {
    return DEFAULT_GNEWS_PROXY_URL
  }

  return ``
}

/**
 * 浏览器端请求 GNews GET /api/v4/search。
 * 未配置 `VITE_GNEWS_PROXY_URL` 时直连 gnews.io（免费档一般仅 localhost CORS）。
 * 配置后经由 Cloudflare Worker 等同路径代理（见 `workers/gnews-proxy`）。
 */
export function useGNews() {
  const loading = ref(false)
  const abortController = ref<AbortController | null>(null)

  function abort() {
    abortController.value?.abort()
    abortController.value = null
    loading.value = false
  }

  async function search(opts: GNewsFetchOptions): Promise<GNewsFetchResult> {
    const proxyBase = resolveGNewsProxyBase()
    const key = opts.apikey?.trim() ?? ``
    if (!proxyBase && !key)
      return { articles: [], formatted: ``, error: `请填写 GNews API Key，或在环境变量中配置 VITE_GNEWS_API_KEY` }
    if (!opts.q.trim())
      return { articles: [], formatted: ``, error: `请填写搜索关键词` }

    abort()
    abortController.value = new AbortController()
    loading.value = true

    try {
      const url = buildGNewsSearchUrl(
        {
          q: opts.q,
          apikey: key,
          lang: opts.lang || undefined,
          country: opts.country || undefined,
          max: opts.max ?? 3,
          page: opts.page ?? 1,
          sortby: opts.sortby ?? `publishedAt`,
          in: opts.in ?? `title,description`,
        },
        proxyBase ? { apiBase: proxyBase } : undefined,
      )

      const res = await fetch(url, {
        method: `GET`,
        signal: abortController.value.signal,
      })

      const text = await res.text()
      let json: unknown
      try {
        json = JSON.parse(text)
      }
      catch {
        return {
          articles: [],
          formatted: ``,
          error: `无法解析响应（HTTP ${res.status}）`,
        }
      }

      const parsed = parseGNewsSearchResponse(json)

      if (parsed.errors?.length) {
        return {
          articles: [],
          formatted: ``,
          error: parsed.errors.join(`；`),
        }
      }

      if (!res.ok) {
        return {
          articles: [],
          formatted: ``,
          error: `请求失败 HTTP ${res.status}: ${text.slice(0, 280)}`,
        }
      }

      const formatted = formatGNewsArticlesAsPromptPack(parsed.articles, {
        query: opts.q,
      })

      return {
        articles: parsed.articles,
        formatted,
        totalArticles: parsed.totalArticles,
      }
    }
    catch (e) {
      if ((e as Error).name === `AbortError`)
        return { articles: [], formatted: `` }
      return {
        articles: [],
        formatted: ``,
        error: (e as Error).message || String(e),
      }
    }
    finally {
      loading.value = false
      abortController.value = null
    }
  }

  return { loading, abort, search }
}
