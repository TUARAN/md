/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 可选：构建时注入 GNews API Key，面板中可留空 */
  readonly VITE_GNEWS_API_KEY?: string
  /** 可选：GNews 代理 Worker 的 API 前缀（与直连相同路径 `/search`，生产默认 `https://md-gnews-proxy.tuaran666.workers.dev/api/v4`） */
  readonly VITE_GNEWS_PROXY_URL?: string
}
