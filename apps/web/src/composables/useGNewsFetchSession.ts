import type { RendererAPI } from '@md/shared/types'
import { highlightPendingBlocks, hljs, initRenderer } from '@md/core'
import { storeToRefs } from 'pinia'
import { computed, nextTick, ref, watch } from 'vue'
import { useGNews } from '@/composables/useGNews'
import useGNewsConfigStore from '@/stores/gnewsConfig'
import { useThemeStore } from '@/stores/theme'
import { useUIStore } from '@/stores/ui'
import { postProcessHtml, renderMarkdown } from '@/utils'
import { copyPlain } from '@/utils/clipboard'
import { toast } from '@/utils/toast'

export type GNewsFetchSession = ReturnType<typeof createGNewsFetchSession>

let session: GNewsFetchSession | null = null

function createGNewsFetchSession() {
  const gnewsStore = useGNewsConfigStore()
  const {
    apiKey: storedApiKey,
    searchQuery,
    lang,
    country,
    maxArticles,
    sortby,
    configPanelExpanded,
  } = storeToRefs(gnewsStore)

  const themeStore = useThemeStore()
  const uiStore = useUIStore()
  const { setWorkflowAppPage, toggleAIDialog, queueAiAssistantDraftMarkdown } = uiStore
  const { isCiteStatus, legend, isCountStatus, isMacCodeBlock, isShowLineNumber } = storeToRefs(themeStore)
  const { isDark } = storeToRefs(uiStore)

  const { loading, abort, search } = useGNews()

  const page = ref(1)
  const lastTotalArticles = ref<number | undefined>(undefined)
  const lastPageItemCount = ref(0)

  const formatted = ref(``)
  const meta = ref(``)
  const lastError = ref(``)

  const resultTab = ref<`preview` | `source`>(`preview`)
  const previewHtml = ref(``)

  let panelRenderer: RendererAPI | null = null

  function refreshGNewsPreview() {
    if (!panelRenderer) {
      return
    }
    const md = formatted.value.trim()
    if (!md) {
      previewHtml.value = ``
      return
    }

    panelRenderer.reset({
      citeStatus: isCiteStatus.value,
      legend: legend.value,
      countStatus: isCountStatus.value,
      isMacCodeBlock: isMacCodeBlock.value,
      isShowLineNumber: isShowLineNumber.value,
      themeMode: isDark.value ? `dark` : `light`,
    })

    const { html, readingTime } = renderMarkdown(md, panelRenderer)
    previewHtml.value = postProcessHtml(html, readingTime, panelRenderer)
  }

  watch(
    [formatted, isCiteStatus, legend, isCountStatus, isMacCodeBlock, isShowLineNumber, isDark],
    () => {
      refreshGNewsPreview()
    },
  )

  const envKey = (import.meta.env.VITE_GNEWS_API_KEY ?? ``).trim()

  const effectiveApiKey = computed(() => storedApiKey.value.trim() || envKey)

  const langSelect = computed({
    get: () => lang.value || `_unset`,
    set: (v: string) => {
      lang.value = v === `_unset` ? `` : v
    },
  })

  const effectiveMax = computed(() => Math.min(100, Math.max(1, maxArticles.value)))

  const hasNextPage = computed(() => {
    const n = lastPageItemCount.value
    const max = effectiveMax.value
    if (n <= 0)
      return false
    const total = lastTotalArticles.value
    if (total != null && total >= 0)
      return page.value * max < total
    return n >= max
  })

  const configSummary = computed(() => {
    const q = searchQuery.value.trim() || `未填关键词`
    const langLabel = lang.value ? lang.value.toUpperCase() : `不限语言`
    const cc = country.value.trim().toLowerCase()
    const nation = cc ? cc.toUpperCase() : `不限地区`
    const sortLabel = sortby.value === `publishedAt` ? `发布时间` : `相关度`
    return `${q} · ${langLabel} · ${nation} · 每页 ${maxArticles.value} · ${sortLabel}`
  })

  function resetPaginationState() {
    page.value = 1
    lastTotalArticles.value = undefined
    lastPageItemCount.value = 0
  }

  watch(searchQuery, () => {
    resetPaginationState()
  })

  watch([lang, country, maxArticles, sortby], () => {
    resetPaginationState()
  })

  async function runFetch() {
    lastError.value = ``
    formatted.value = ``

    const result = await search({
      q: searchQuery.value,
      apikey: effectiveApiKey.value,
      lang: lang.value || undefined,
      country: country.value.trim().toLowerCase() || undefined,
      max: effectiveMax.value,
      page: page.value,
      sortby: sortby.value,
    })

    if (result.error) {
      lastError.value = result.error
      lastPageItemCount.value = 0
      if (
        result.error.includes(`GNews API Key`)
        || result.error.includes(`VITE_GNEWS_API_KEY`)
      ) {
        configPanelExpanded.value = true
        nextTick(() => {
          document.getElementById(`gnews-key`)?.focus()
        })
      }
      toast.error(result.error)
      return
    }

    if (!result.formatted.trim()) {
      lastError.value = `本页未返回资讯，可尝试换关键词或翻页`
      lastPageItemCount.value = result.articles.length
      lastTotalArticles.value = result.totalArticles
      toast.warning(lastError.value)
      return
    }

    formatted.value = result.formatted
    lastTotalArticles.value = result.totalArticles
    lastPageItemCount.value = result.articles.length
    const total = result.totalArticles
    meta.value
      = total !== undefined
        ? `第 ${page.value} 页 · 约 ${total} 篇命中 · 本页 ${result.articles.length} 条`
        : `第 ${page.value} 页 · 本页 ${result.articles.length} 条`
    toast.success(`已整理 ${result.articles.length} 条资讯`)
  }

  function fetchCurrentPage() {
    void runFetch()
  }

  function fetchNextPage() {
    if (!hasNextPage.value) {
      toast.warning(`当前已是末页或本页条数未满，没有更多下一页`)
      return
    }
    page.value += 1
    void runFetch()
  }

  function fetchPrevPage() {
    if (page.value <= 1) {
      return
    }
    page.value -= 1
    void runFetch()
  }

  function goFirstPage() {
    if (page.value === 1) {
      void runFetch()
      return
    }
    page.value = 1
    void runFetch()
  }

  async function copyMarkdownSource() {
    if (!formatted.value.trim()) {
      toast.error(`暂无内容可复制`)
      return
    }
    try {
      await copyPlain(formatted.value)
      toast.success(`已复制 Markdown`)
    }
    catch {
      toast.error(`复制失败`)
    }
  }

  function goRemixWithAssistant() {
    if (!formatted.value.trim()) {
      toast.error(`请先获取资讯`)
      return
    }
    queueAiAssistantDraftMarkdown(formatted.value)
    setWorkflowAppPage(`sync`)
    toggleAIDialog(true)
  }

  function onPreviewClick(e: MouseEvent) {
    const a = (e.target as HTMLElement | null)?.closest(`a`)
    const href = a?.getAttribute(`href`)?.trim()
    if (!href || !/^https?:\/\//i.test(href))
      return
    e.preventDefault()
    window.open(href, `_blank`, `noopener,noreferrer`)
  }

  function initPreviewRenderer() {
    panelRenderer = initRenderer({
      isMacCodeBlock: isMacCodeBlock.value,
      isShowLineNumber: isShowLineNumber.value,
    })
    refreshGNewsPreview()
  }

  function disposePreviewRenderer() {
    abort()
    panelRenderer = null
  }

  function runHighlightInPreview(el: HTMLElement | null) {
    if (!el || !previewHtml.value.trim())
      return
    highlightPendingBlocks(hljs, el)
  }

  return {
    loading,
    abort,
    storedApiKey,
    searchQuery,
    lang,
    country,
    maxArticles,
    sortby,
    configPanelExpanded,
    page,
    hasNextPage,
    configSummary,
    langSelect,
    effectiveApiKey,
    envKey,
    formatted,
    meta,
    lastError,
    resultTab,
    previewHtml,
    fetchCurrentPage,
    fetchNextPage,
    fetchPrevPage,
    goFirstPage,
    copyMarkdownSource,
    goRemixWithAssistant,
    onPreviewClick,
    initPreviewRenderer,
    disposePreviewRenderer,
    runHighlightInPreview,
  }
}

export function useGNewsFetchSession(): GNewsFetchSession {
  if (!session)
    session = createGNewsFetchSession()
  return session
}
