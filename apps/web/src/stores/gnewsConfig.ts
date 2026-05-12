import { DEFAULT_SERVICE_KEY } from '@md/shared/constants'
import { store } from '@/utils/storage'

/**
 * GNews 检索配置（API Key 与常用筛选项持久化到本地）。
 * 亦可配合构建期环境变量 VITE_GNEWS_API_KEY 作为默认 Key。
 */
export const useGNewsConfigStore = defineStore(`GNewsConfig`, () => {
  const searchQuery = store.reactive(`gnews_search_q`, `大模型`)

  /** 不设或空表示不限制语言（GNews 默认 Any） */
  const lang = store.reactive(`gnews_lang`, ``)

  /** 不设或空表示不限制国家 */
  const country = store.reactive(`gnews_country`, ``)

  const maxArticles = store.reactive(`gnews_max`, 3)

  const sortby = store.reactive<`publishedAt` | `relevance`>(`gnews_sortby`, `publishedAt`)

  /** 检索高级配置区是否展开（与表单一起持久化在本地） */
  const configPanelExpanded = store.reactive(`gnews_config_panel_expanded`, false)

  const apiKey = customRef<string>((track, trigger) => {
    let cachedKey = ``

    store.get(`gnews_api_key`).then((value) => {
      cachedKey = value ?? DEFAULT_SERVICE_KEY
      trigger()
    })

    return {
      get() {
        track()
        return cachedKey
      },
      set(val: string) {
        cachedKey = val
        trigger()
        void store.set(`gnews_api_key`, val)
      },
    }
  })

  return {
    apiKey,
    searchQuery,
    lang,
    country,
    maxArticles,
    sortby,
    configPanelExpanded,
  }
})

export default useGNewsConfigStore
