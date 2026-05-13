import type { GNewsArticle, NewsSourceProvider } from '@md/shared/utils/gnews'
import {
  buildGNewsSearchUrl,
  formatGNewsArticlesAsPromptPack,
  getNewsSourceLabel,
  parseGNewsSearchResponse,
} from '@md/shared/utils/gnews'

export interface GNewsFetchOptions {
  provider?: NewsSourceProvider
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

export const DEFAULT_NEWS_PROXY_URL = `https://md-gnews-proxy.tuaran666.workers.dev/api`
export const DEFAULT_GNEWS_PROXY_URL = DEFAULT_NEWS_PROXY_URL

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
 * 浏览器端统一请求资讯源。
 * 生产环境默认经由 Cloudflare Worker 代理；本地未配置代理时仅 GNews 支持直连。
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
    const provider = opts.provider ?? `gnews`
    const proxyBase = resolveGNewsProxyBase()
    const key = opts.apikey?.trim() ?? ``
    const providerLabel = getNewsSourceLabel(provider)
    if (!proxyBase && provider !== `gnews`)
      return { articles: [], formatted: ``, error: `${providerLabel} 需要通过资讯 Worker 请求，请配置 VITE_GNEWS_PROXY_URL` }
    if (!proxyBase && !key)
      return { articles: [], formatted: ``, error: `请填写 ${providerLabel} API Key，或配置默认 Key` }
    if (!opts.q.trim())
      return { articles: [], formatted: ``, error: `请填写搜索关键词` }

    abort()
    abortController.value = new AbortController()
    loading.value = true

    try {
      const url = buildGNewsSearchUrl(
        {
          provider,
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
        provider,
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
