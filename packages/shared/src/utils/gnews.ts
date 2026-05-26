/**
 * GNews API v4 — 纯函数工具（无网络）。
 * @see https://gnews.io/docs/v4
 */

export const GNEWS_API_BASE = `https://gnews.io/api/v4`
export const HACKER_NEWS_API_BASE = `https://hn.algolia.com/api/v1`
/** 本真资讯聚合 JSON API（分页列表；关键词由客户端在当前页结果中过滤）。 */
export const BENZHI_NEWS_API_BASE = `https://benzhi.online/api/news`

export type NewsSourceProvider = `gnews` | `hackernews` | `benzhi` | `newsapi` | `mediastack` | `guardian` | `currents`

export interface NewsSourceOption {
  value: NewsSourceProvider
  label: string
  keyLabel: string
  docsUrl: string
  note: string
}

export const NEWS_SOURCE_OPTIONS: NewsSourceOption[] = [
  {
    value: `gnews`,
    label: `GNews 中文推荐`,
    keyLabel: `GNews API Key`,
    docsUrl: `https://gnews.io/`,
    note: `中文资讯主入口，留空用默认 Key；填写则用你的 Key。`,
  },
  {
    value: `hackernews`,
    label: `Hacker News 海外技术`,
    keyLabel: `无需 API Key`,
    docsUrl: `https://hn.algolia.com/api`,
    note: `海外技术社区检索源，无需 Key；中文关键词不作为主入口。`,
  },
  {
    value: `benzhi`,
    label: `本真 BenZhi 聚合`,
    keyLabel: `无需 API Key`,
    docsUrl: `https://benzhi.online/api/news`,
    note: `中文资讯聚合，免 Key；关键词在本页返回条目中筛选，可翻页查看更多。`,
  },
  {
    value: `newsapi`,
    label: `NewsAPI`,
    keyLabel: `NewsAPI Key`,
    docsUrl: `https://newsapi.org/`,
    note: `需填写你的 Key。`,
  },
  {
    value: `mediastack`,
    label: `Mediastack`,
    keyLabel: `Mediastack Access Key`,
    docsUrl: `https://mediastack.com/`,
    note: `需填写你的 Key。`,
  },
  {
    value: `guardian`,
    label: `The Guardian`,
    keyLabel: `Guardian API Key`,
    docsUrl: `https://open-platform.theguardian.com/`,
    note: `需填写你的 Key。`,
  },
  {
    value: `currents`,
    label: `Currents`,
    keyLabel: `Currents API Key`,
    docsUrl: `https://currentsapi.services/`,
    note: `需填写你的 Key。`,
  },
]

export function getNewsSourceLabel(provider: NewsSourceProvider): string {
  return NEWS_SOURCE_OPTIONS.find(item => item.value === provider)?.label ?? provider
}

export interface GNewsArticleSource {
  name: string
  url?: string
}

export interface GNewsArticle {
  title?: string
  description?: string
  content?: string
  url: string
  image?: string | null
  publishedAt?: string
  source?: GNewsArticleSource
}

export interface GNewsSearchResponse {
  totalArticles?: number
  articles: GNewsArticle[]
  errors?: string[]
  /** 本真分页：用于判断末页（与当前页条目是否被关键词过滤无关） */
  benzhi?: { totalPages: number }
}

export interface GNewsSearchParams {
  provider?: NewsSourceProvider
  q: string
  apikey: string
  lang?: string
  country?: string
  max?: number
  page?: number
  sortby?: `publishedAt` | `relevance`
  /** 默认 title,description；可按需包含 content（计费计划需支持） */
  in?: string
}

export interface BuildGNewsSearchUrlOptions {
  /** 默认 `GNEWS_API_BASE`；代理场景传入 Worker 上的 `/api` 前缀，如 `https://xxx.workers.dev/api` */
  apiBase?: string
}

/**
 * 构造 GNews Search GET URL（参数经 URLSearchParams 编码）。
 */
export function buildGNewsSearchUrl(
  params: GNewsSearchParams,
  options?: BuildGNewsSearchUrlOptions,
): string {
  const provider = params.provider ?? `gnews`
  const base = (options?.apiBase ?? GNEWS_API_BASE).replace(/\/$/u, ``)

  let path: string
  if (options?.apiBase) {
    path = base.endsWith(`/api/v4`) && provider === `gnews`
      ? `${base}/search`
      : `${base}/${provider}/search`
  }
  else if (provider === `hackernews`) {
    path = `${HACKER_NEWS_API_BASE}/${params.sortby === `relevance` ? `search` : `search_by_date`}`
  }
  else if (provider === `benzhi`) {
    path = BENZHI_NEWS_API_BASE
  }
  else {
    path = `${base}/search`
  }

  const u = new URL(path)
  if (provider === `hackernews`) {
    u.searchParams.set(`query`, params.q.trim())
    u.searchParams.set(`tags`, `story`)
    u.searchParams.set(`hitsPerPage`, String(Math.min(100, Math.max(1, params.max ?? 10))))
    u.searchParams.set(`page`, String(Math.max(0, (params.page ?? 1) - 1)))
    return u.toString()
  }

  if (provider === `benzhi`) {
    const page = params.page ?? 1
    const max = Math.min(100, Math.max(1, params.max ?? 10))
    if (options?.apiBase) {
      const proxy = new URL(`${base.replace(/\/$/u, ``)}/benzhi/search`)
      proxy.searchParams.set(`page`, String(Math.max(1, page)))
      proxy.searchParams.set(`max`, String(max))
      proxy.searchParams.set(`q`, params.q.trim())
      return proxy.toString()
    }
    u.searchParams.set(`page`, String(Math.max(1, page)))
    u.searchParams.set(`limit`, String(max))
    return u.toString()
  }

  u.searchParams.set(`q`, params.q.trim())
  if (params.apikey)
    u.searchParams.set(`apikey`, params.apikey)
  if (params.lang)
    u.searchParams.set(`lang`, params.lang)
  if (params.country)
    u.searchParams.set(`country`, params.country)

  const max = params.max ?? 10
  u.searchParams.set(`max`, String(Math.min(100, Math.max(1, max))))

  const page = params.page ?? 1
  u.searchParams.set(`page`, String(Math.max(1, page)))

  if (params.sortby)
    u.searchParams.set(`sortby`, params.sortby)
  if (params.in)
    u.searchParams.set(`in`, params.in)

  return u.toString()
}

/**
 * 解析 JSON 体；若含 errors 数组则视为失败。
 */
export function parseGNewsSearchResponse(data: unknown): GNewsSearchResponse {
  if (!data || typeof data !== `object`)
    return { articles: [], errors: [`无效的响应体`] }

  const d = data as Record<string, unknown>

  if (typeof d.success === `boolean` && d.success === false && typeof d.message === `string`)
    return { articles: [], errors: [d.message] }

  if (d.success === true && Array.isArray(d.data) && d.pagination && typeof d.pagination === `object`) {
    const pag = d.pagination as Record<string, unknown>
    const rawArticles = d.data as unknown[]
    const articles = Array.isArray(rawArticles)
      ? rawArticles.map(normalizeArticle).filter((a): a is GNewsArticle => Boolean(a))
      : []

    const totalArticles = typeof pag.total === `number` ? pag.total : undefined
    const totalPages = typeof pag.totalPages === `number` ? pag.totalPages : undefined
    const benzhi = totalPages != null ? { totalPages } : undefined

    return { totalArticles, articles, benzhi }
  }

  if (typeof d.message === `string` && (d.status === `error` || d.status === `ERROR`))
    return { articles: [], errors: [d.message] }
  if (typeof d.error === `string`)
    return { articles: [], errors: [d.error] }
  if (typeof d.message === `string` && !Array.isArray(d.articles) && !Array.isArray(d.hits))
    return { articles: [], errors: [d.message] }
  if (d.error && typeof d.error === `object`) {
    const e = d.error as Record<string, unknown>
    const msg = typeof e.message === `string` ? e.message : JSON.stringify(e)
    return { articles: [], errors: [msg] }
  }

  const rawErrors = d.errors
  if (Array.isArray(rawErrors) && rawErrors.length > 0) {
    return {
      articles: [],
      errors: rawErrors.map(e => (typeof e === `string` ? e : JSON.stringify(e))),
    }
  }

  const rawArticles = Array.isArray(d.articles)
    ? d.articles
    : Array.isArray(d.hits)
      ? d.hits
      : Array.isArray(d.data)
        ? d.data
        : Array.isArray(d.news)
          ? d.news
          : Array.isArray((d.response as Record<string, unknown> | undefined)?.results)
            ? (d.response as Record<string, unknown>).results
            : []

  const articles: GNewsArticle[] = Array.isArray(rawArticles)
    ? rawArticles.map(normalizeArticle).filter((a): a is GNewsArticle => Boolean(a))
    : []

  const response = d.response as Record<string, unknown> | undefined
  const pagination = d.pagination as Record<string, unknown> | undefined
  const totalArticles = typeof d.totalArticles === `number`
    ? d.totalArticles
    : typeof d.totalResults === `number`
      ? d.totalResults
      : typeof d.nbHits === `number`
        ? d.nbHits
        : typeof pagination?.total === `number`
          ? pagination.total
          : typeof response?.total === `number`
            ? response.total
            : undefined

  return { totalArticles, articles }
}

function stringValue(value: unknown): string | undefined {
  return typeof value === `string` && value.trim() ? value.trim() : undefined
}

function normalizeArticle(raw: unknown): GNewsArticle | null {
  if (!raw || typeof raw !== `object`)
    return null

  const a = raw as Record<string, unknown>
  const fields = a.fields as Record<string, unknown> | undefined
  const source = a.source as Record<string, unknown> | string | undefined
  const headline = a.headline as Record<string, unknown> | undefined

  const keywordsJoined = Array.isArray(a.keywords)
    ? (a.keywords as unknown[]).filter((x): x is string => typeof x === `string`).map(s => s.trim()).filter(Boolean).join(`、`)
    : ``

  const url = stringValue(a.url)
    ?? stringValue(a.story_url)
    ?? stringValue(a.webUrl)
    ?? stringValue(a.web_url)
  if (!url)
    return null

  const cat = stringValue(a.category)
  const sourceFromBenzhi = cat ? `BenZhi / ${cat}` : `BenZhi`
  const isBenzhiShape = typeof a.newsMarkdown === `string`

  const sourceName = typeof source === `string`
    ? source
    : stringValue(source?.name)
      ?? stringValue(a.source)
      ?? (isBenzhiShape ? sourceFromBenzhi : undefined)
      ?? stringValue(a.domain)
      ?? stringValue(a.sectionName)
      ?? (stringValue(a.author) ? `Hacker News / ${stringValue(a.author)}` : undefined)
      ?? stringValue(a.author)

  const summary = stringValue(a.summary)
    ?? stringValue(a.description)
    ?? stringValue(a.abstract)
    ?? stringValue(a.snippet)
    ?? stringValue(a.lead_paragraph)
    ?? stringValue(fields?.trailText)
  const descriptionWithKeywords = summary && keywordsJoined
    ? `${summary}\n关键词：${keywordsJoined}`
    : summary ?? (keywordsJoined ? `关键词：${keywordsJoined}` : undefined)

  return {
    title: stringValue(a.title)
      ?? stringValue(a.story_title)
      ?? stringValue(a.webTitle)
      ?? stringValue(headline?.main),
    description: descriptionWithKeywords,
    content: stringValue(a.content)
      ?? stringValue(a.newsMarkdown)
      ?? stringValue(fields?.bodyText)
      ?? stringValue(fields?.body),
    url,
    image: stringValue(a.image)
      ?? stringValue(a.urlToImage)
      ?? stringValue(a.socialimage)
      ?? stringValue(fields?.thumbnail)
      ?? null,
    publishedAt: stringValue(a.publishedAt)
      ?? stringValue(a.processedAt)
      ?? stringValue(a.updatedAt)
      ?? stringValue(a.published_at)
      ?? stringValue(a.created_at)
      ?? stringValue(a.published)
      ?? stringValue(a.seendate)
      ?? stringValue(a.webPublicationDate)
      ?? stringValue(a.pub_date),
    source: sourceName ? { name: sourceName } : undefined,
  }
}

/** 去掉 GNews 返回的正文末尾截断提示，如「... [2094 chars]」 */
export function stripGNewsContentTailNote(text: string): string {
  return text.replace(/\s*\[\d+\s*chars\]\s*$/i, ``).trimEnd()
}

export function formatArticleDate(iso: string): string {
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime()))
      return iso
    return d.toLocaleString(`zh-CN`, {
      year: `numeric`,
      month: `2-digit`,
      day: `2-digit`,
      hour: `2-digit`,
      minute: `2-digit`,
    })
  }
  catch {
    return iso
  }
}

function quoteBlock(text: string): string[] {
  const t = text.replace(/\r?\n+/g, `\n`).trim()
  if (!t)
    return []
  return t.split(`\n`).map(line => `> ${line}`)
}

/**
 * 将多条资讯整理为适合丢给大模型的「参考材料」文本（Markdown 结构，便于预览扫读）。
 */
export function formatGNewsArticlesAsPromptPack(
  articles: GNewsArticle[],
  options?: { query?: string, intro?: string, provider?: NewsSourceProvider },
): string {
  const providerLabel = getNewsSourceLabel(options?.provider ?? `gnews`)
  const intro = options?.intro
    ?? `本素材来自 ${providerLabel} 检索结果，**写作或二创前请对照下方原文链接核对事实与数据**（摘要/节选可能经过 API 截断）。`
  const q = options?.query?.trim()

  const lines: string[] = [
    `## 📰 ${providerLabel} 参考资讯包`,
    ``,
    `> ${intro}`,
    ``,
  ]

  if (q) {
    lines.push(
      `| 检索关键词 | 本批条数 |`,
      `| --- | ---: |`,
      `| \`${q.replace(/`/g, ``)}\` | **${articles.length}** |`,
      ``,
    )
  }
  else {
    lines.push(`**本批条数：** ${articles.length}`, ``)
  }

  for (let i = 0; i < articles.length; i++) {
    const a = articles[i]
    const n = i + 1
    const src = a.source?.name?.trim() || `未知来源`
    const title = a.title?.trim() || `(无标题)`
    const circleNum = [`①`, `②`, `③`, `④`, `⑤`, `⑥`, `⑦`, `⑧`, `⑨`, `⑩`][n - 1] ?? `${n}.`

    if (i > 0)
      lines.push(`---`, ``)

    lines.push(`#### ${circleNum} ${title}`, ``)
    lines.push(
      `| 维度 | 内容 |`,
      `| --- | --- |`,
      `| 来源 | **${src}** |`,
    )

    if (a.publishedAt) {
      lines.push(
        `| 发布时间 | ${formatArticleDate(a.publishedAt)} |`,
      )
    }

    lines.push(
      `| 原文 | [打开链接 ↗](${a.url}) |`,
      ``,
    )

    const desc = a.description?.trim()
    if (desc) {
      lines.push(`**摘要**`, ...quoteBlock(desc), ``)
    }

    const bodyRaw = a.content?.trim()
    if (bodyRaw) {
      const body = stripGNewsContentTailNote(bodyRaw)
      lines.push(`**正文节选**`, ...quoteBlock(body), ``)
    }
  }

  return lines.join(`\n`).trimEnd()
}
