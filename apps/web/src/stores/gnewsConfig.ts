import type { NewsSourceProvider } from '@md/shared/utils/gnews'
import { DEFAULT_SERVICE_KEY } from '@md/shared/constants'
import { store } from '@/utils/storage'

/**
 * 资讯检索配置（信息源、API Key 与常用筛选项持久化到本地）。
 * API Key 按信息源分别存储。
 */
export const useGNewsConfigStore = defineStore(`GNewsConfig`, () => {
  const searchQuery = store.reactive(`gnews_search_q`, `大模型`)

  const provider = store.reactive<NewsSourceProvider>(`news_source_provider`, `gnews`)

  /** 不设或空表示不限制语言（GNews 默认 Any） */
  const lang = store.reactive(`gnews_lang`, ``)

  /** 不设或空表示不限制国家 */
  const country = store.reactive(`gnews_country`, ``)

  const maxArticles = store.reactive(`gnews_max`, 3)

  const sortby = store.reactive<`publishedAt` | `relevance`>(`gnews_sortby`, `publishedAt`)

  /** 检索高级配置区是否展开（与表单一起持久化在本地） */
  const configPanelExpanded = store.reactive(`gnews_config_panel_expanded`, false)

  const apiKey = customRef<string>((track, trigger) => {
    const cached = new Map<NewsSourceProvider, string>()

    function storageKey() {
      return `news_api_key_${provider.value}`
    }

    function loadKey() {
      const activeProvider = provider.value
      store.get(storageKey()).then((value) => {
        cached.set(
          activeProvider,
          value ?? (activeProvider === `gnews` ? DEFAULT_SERVICE_KEY : ``),
        )
        trigger()
      })
    }

    loadKey()
    watch(provider, loadKey)

    return {
      get() {
        track()
        return cached.get(provider.value) ?? ``
      },
      set(val: string) {
        cached.set(provider.value, val)
        trigger()
        void store.set(storageKey(), val)
      },
    }
  })

  return {
    apiKey,
    provider,
    searchQuery,
    lang,
    country,
    maxArticles,
    sortby,
    configPanelExpanded,
  }
})

export default useGNewsConfigStore
