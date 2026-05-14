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
  requestUrl?: string
}

export const DEFAULT_NEWS_PROXY_URL = `https://md-gnews-proxy.tuaran666.workers.dev/api`
export const DEFAULT_GNEWS_PROXY_URL = DEFAULT_NEWS_PROXY_URL

export function resolveGNewsProxyBase(): string {
  const configured = (import.meta.env.VITE_GNEWS_PROXY_URL ?? ``).trim()
  if (configured)
    return configured

  // 生产环境默认走资讯代理 Worker（统一 CORS、统一上游可达性）。
  // 本地 dev（import.meta.env.DEV）默认直连：很多用户的本地网络到 *.workers.dev
  // 反而比直连上游更糟（CF 边缘不可达），直连 gnews/HN 即可工作；
  // 需要本地经过 Worker 时显式设 VITE_GNEWS_PROXY_URL 即可。
  if (import.meta.env.DEV)
    return ``

  if (typeof window !== `undefined`)
    return DEFAULT_GNEWS_PROXY_URL

  return ``
}

/**
 * 浏览器端统一请求资讯源。
 * 生产环境默认经由 Cloudflare Worker 代理；未配置代理时，GNews、Hacker News、本真 BenZhi 可浏览器直连。
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
    if (!proxyBase && provider !== `gnews` && provider !== `hackernews` && provider !== `benzhi`)
      return { articles: [], formatted: ``, error: `${providerLabel} 需要通过资讯 Worker 请求，请配置 VITE_GNEWS_PROXY_URL` }
    if (!proxyBase && provider !== `hackernews` && provider !== `benzhi` && !key)
      return { articles: [], formatted: ``, error: `请填写 ${providerLabel} API Key，或配置默认 Key` }
    if (!opts.q.trim() && provider !== `benzhi`)
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
          requestUrl: url,
          error: `无法解析响应（HTTP ${res.status}）`,
        }
      }

      if (!res.ok) {
        return {
          articles: [],
          formatted: ``,
          requestUrl: url,
          error: `请求失败 HTTP ${res.status}: ${text.slice(0, 280)}`,
        }
      }

      const parsed = parseGNewsSearchResponse(json)

      if (parsed.errors?.length) {
        return {
          articles: [],
          formatted: ``,
          requestUrl: url,
          error: parsed.errors.join(`；`),
        }
      }

      let articles = parsed.articles
      const qTrim = opts.q.trim()
      if (provider === `benzhi` && qTrim) {
        const needle = qTrim.toLowerCase()
        articles = articles.filter((a) => {
          const blob = [
            a.title,
            a.description,
            a.content,
            a.source?.name,
          ].filter(Boolean).join(`\n`).toLowerCase()
          return blob.includes(needle)
        })
      }

      const formatted = formatGNewsArticlesAsPromptPack(articles, {
        query: qTrim || undefined,
        provider,
      })

      return {
        articles,
        formatted,
        totalArticles: parsed.totalArticles,
        requestUrl: url,
      }
    }
    catch (e) {
      if ((e as Error).name === `AbortError`)
        return { articles: [], formatted: `` }
      const message = (e as Error).message || String(e)
      if (provider === `hackernews`) {
        return {
          articles: [],
          formatted: ``,
          error: `Hacker News 偏海外技术社区，当前网络或中文关键词可能不可用。中文资讯请切回「GNews 中文推荐」。`,
        }
      }
      return {
        articles: [],
        formatted: ``,
        error: message === `Failed to fetch`
          ? proxyBase
            ? `请求未到达资讯 Worker（${proxyBase}），可能是 Worker 离线 / 域名解析失败 / 国内网络到 *.workers.dev 不通。试试切换到 Hacker News / GNews 这类可直连源，或暂时清空 VITE_GNEWS_PROXY_URL。`
            : `直连资讯接口失败，多数为浏览器 CORS、网络拦截或 VPN 抽风。换一个资讯源（GNews / Hacker News 一般 OK），或检查网络后重试。`
          : message,
      }
    }
    finally {
      loading.value = false
      abortController.value = null
    }
  }

  return { loading, abort, search }
}
