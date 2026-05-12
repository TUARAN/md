/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 可选：构建时注入 GNews API Key，面板中可留空 */
  readonly VITE_GNEWS_API_KEY?: string
}
