import type { GNewsArticle } from '@md/shared/utils/gnews'
import { getNewsSourceLabel, NEWS_SOURCE_OPTIONS } from '@md/shared/utils/gnews'
import { storeToRefs } from 'pinia'
import { computed, nextTick, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { resolveGNewsProxyBase, useGNews } from '@/composables/useGNews'
import useGNewsConfigStore from '@/stores/gnewsConfig'
import { useUIStore } from '@/stores/ui'
import { copyPlain } from '@/utils/clipboard'
import { toast } from '@/utils/toast'

export type GNewsFetchSession = ReturnType<typeof createGNewsFetchSession>

let session: GNewsFetchSession | null = null

function createGNewsFetchSession() {
  const gnewsStore = useGNewsConfigStore()
  const {
    apiKey: storedApiKey,
    provider,
    searchQuery,
    lang,
    country,
    maxArticles,
    sortby,
    configPanelExpanded,
  } = storeToRefs(gnewsStore)

  const uiStore = useUIStore()
  const { setCreationDraftMarkdown } = uiStore
  const router = useRouter()

  const { loading, abort, search } = useGNews()

  const page = ref(1)
  const lastTotalArticles = ref<number | undefined>(undefined)
  const lastPageItemCount = ref(0)

  const formatted = ref(``)
  const articles = ref<GNewsArticle[]>([])
  const lastProviderLabel = ref(``)
  const meta = ref(``)
  const lastError = ref(``)
  const lastRequestUrl = ref(``)

  const resultTab = ref<`preview` | `source`>(`preview`)

  const envKey = (import.meta.env.VITE_GNEWS_API_KEY ?? ``).trim()
  const gnewsProxyUrl = resolveGNewsProxyBase()
  const isGNewsProxyEnabled = computed(() => Boolean(gnewsProxyUrl))

  const effectiveApiKey = computed(() => storedApiKey.value.trim() || envKey)
  const sourceOptions = NEWS_SOURCE_OPTIONS
  const activeSource = computed(() =>
    sourceOptions.find(item => item.value === provider.value) ?? sourceOptions[0],
  )

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
    const source = activeSource.value.label
    const q = searchQuery.value.trim() || `未填关键词`
    if (provider.value === `hackernews` || provider.value === `benzhi`)
      return `${source} · ${q} · 免 Key`
    return `${source} · ${q}`
  })

  function resetPaginationState() {
    page.value = 1
    lastTotalArticles.value = undefined
    lastPageItemCount.value = 0
  }

  watch(searchQuery, () => {
    resetPaginationState()
  })

  watch([provider, lang, country, maxArticles, sortby], () => {
    resetPaginationState()
  })

  async function runFetch() {
    lastError.value = ``
    formatted.value = ``
    articles.value = []
    lastRequestUrl.value = ``

    const result = await search({
      provider: provider.value,
      q: searchQuery.value,
      apikey: effectiveApiKey.value,
      lang: provider.value === `gnews` ? (lang.value || `zh`) : lang.value || undefined,
      country: provider.value === `gnews` ? (country.value.trim().toLowerCase() || `cn`) : country.value.trim().toLowerCase() || undefined,
      max: effectiveMax.value,
      page: page.value,
      sortby: sortby.value,
    })
    lastRequestUrl.value = result.requestUrl ?? ``

    if (result.error) {
      lastError.value = result.error
      lastPageItemCount.value = 0
      if (
        !isGNewsProxyEnabled.value
        && (
          result.error.includes(`GNews API Key`)
          || result.error.includes(`VITE_GNEWS_API_KEY`)
        )
      ) {
        configPanelExpanded.value = true
        nextTick(() => {
          document.getElementById(`gnews-key`)?.focus()
        })
      }
      if (
        result.error.includes(`API Key`)
        || result.error.includes(`请填写`)
      ) {
        toast.error(result.error)
      }
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
    articles.value = result.articles
    lastProviderLabel.value = getNewsSourceLabel(provider.value)
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
    setCreationDraftMarkdown(formatted.value)
    router.push({ name: `creation` })
    toast.success(`已送入 AI 改写`)
  }

  return {
    loading,
    abort,
    storedApiKey,
    provider,
    sourceOptions,
    activeSource,
    searchQuery,
    lang,
    country,
    maxArticles,
    sortby,
    configPanelExpanded,
    page,
    hasNextPage,
    configSummary,
    effectiveApiKey,
    envKey,
    gnewsProxyUrl,
    isGNewsProxyEnabled,
    formatted,
    articles,
    lastProviderLabel,
    meta,
    lastError,
    resultTab,
    fetchCurrentPage,
    fetchNextPage,
    fetchPrevPage,
    goFirstPage,
    copyMarkdownSource,
    goRemixWithAssistant,
  }
}

export function useGNewsFetchSession(): GNewsFetchSession {
  if (!session)
    session = createGNewsFetchSession()
  return session
}
