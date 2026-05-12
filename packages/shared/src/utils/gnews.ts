/**
 * GNews API v4 — 纯函数工具（无网络）。
 * @see https://gnews.io/docs/v4
 */

export const GNEWS_API_BASE = `https://gnews.io/api/v4`

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
}

export interface GNewsSearchParams {
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

/**
 * 构造 GNews Search GET URL（参数经 URLSearchParams 编码）。
 */
export function buildGNewsSearchUrl(params: GNewsSearchParams): string {
  const u = new URL(`${GNEWS_API_BASE}/search`)
  u.searchParams.set(`q`, params.q.trim())
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
  const rawErrors = d.errors
  if (Array.isArray(rawErrors) && rawErrors.length > 0) {
    return {
      articles: [],
      errors: rawErrors.map(e => (typeof e === `string` ? e : JSON.stringify(e))),
    }
  }

  const rawArticles = d.articles
  const articles: GNewsArticle[] = Array.isArray(rawArticles)
    ? rawArticles.filter(
        (a): a is GNewsArticle =>
          !!a
          && typeof a === `object`
          && typeof (a as GNewsArticle).url === `string`,
      )
    : []

  const totalArticles = typeof d.totalArticles === `number` ? d.totalArticles : undefined

  return { totalArticles, articles }
}

/** 去掉 GNews 返回的正文末尾截断提示，如「... [2094 chars]」 */
export function stripGNewsContentTailNote(text: string): string {
  return text.replace(/\s*\[\d+\s*chars\]\s*$/i, ``).trimEnd()
}

function formatArticleDate(iso: string): string {
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
  options?: { query?: string, intro?: string },
): string {
  const intro = options?.intro
    ?? `本素材来自 GNews 检索结果，**写作或二创前请对照下方原文链接核对事实与数据**（摘要/节选可能经过 API 截断）。`
  const q = options?.query?.trim()

  const lines: string[] = [
    `## 📰 GNews 参考资讯包`,
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
