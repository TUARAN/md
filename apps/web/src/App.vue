<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ConfirmDialog from '@/components/confirm-dialog/ConfirmDialog.vue'
import { Toaster } from '@/components/ui/sonner'
import { documentTitle } from '@/constants/branding'
import { useEditorStore } from '@/stores/editor'
import { usePostStore } from '@/stores/post'
import { useUIStore } from '@/stores/ui'

const uiStore = useUIStore()
const postStore = usePostStore()
const editorStore = useEditorStore()
const router = useRouter()
const route = useRoute()
const { isDark } = storeToRefs(uiStore)

const isUtools = ref(false)
const importReadyTimer = ref<ReturnType<typeof setInterval> | null>(null)

interface SyncblogImportArticleMessage {
  type: `SYNCBLOG_IMPORT_ARTICLE`
  title?: unknown
  markdown?: unknown
  canonicalUrl?: unknown
  tags?: unknown
}

const TRUSTED_IMPORT_ORIGINS = new Set([
  `https://2aran.com`,
  `https://tuaran.me`,
])

function isTrustedImportOrigin(origin: string) {
  if (TRUSTED_IMPORT_ORIGINS.has(origin))
    return true

  try {
    const url = new URL(origin)
    return url.hostname === `localhost` || url.hostname === `127.0.0.1`
  }
  catch {
    return false
  }
}

function normalizeSyncblogImportPayload(data: unknown) {
  if (!data || typeof data !== `object`)
    return null

  const payload = data as SyncblogImportArticleMessage
  if (payload.type !== `SYNCBLOG_IMPORT_ARTICLE` || typeof payload.markdown !== `string`)
    return null

  return {
    title: typeof payload.title === `string` ? payload.title.trim() : ``,
    markdown: payload.markdown,
    canonicalUrl: typeof payload.canonicalUrl === `string` ? payload.canonicalUrl.trim() : ``,
    tags: Array.isArray(payload.tags) ? payload.tags.filter((tag): tag is string => typeof tag === `string`) : [],
  }
}

function importSyncblogArticle(event: MessageEvent) {
  if (!isTrustedImportOrigin(event.origin))
    return

  const payload = normalizeSyncblogImportPayload(event.data)
  if (!payload)
    return

  // 跨页面导入:确保切到 sync 路由再写入,避免在 creator-profile/offer 页面静默改稿
  if (route.name !== `sync`)
    router.replace({ name: `sync` })

  const currentPost = postStore.currentPost
  if (!currentPost)
    return

  if (payload.title)
    postStore.renamePost(currentPost.id, payload.title)

  postStore.updatePostContent(currentPost.id, payload.markdown)
  editorStore.importContent(payload.markdown)
}

function postImportReady() {
  window.opener?.postMessage({ type: `SYNCBLOG_IMPORT_READY`, app: `syncblog.cn` }, `*`)
}

onMounted(() => {
  if (route.name !== `creator-profile` && route.name !== `creator-offer`)
    document.title = documentTitle

  window.addEventListener(`message`, importSyncblogArticle)
  postImportReady()
  importReadyTimer.value = setInterval(postImportReady, 1000)

  if (route.name === `creator-profile` || route.name === `creator-offer`)
    return

  // 检测是否为 Utools 环境
  isUtools.value = !!(window as any).__MD_UTOOLS__
  if (isUtools.value) {
    document.documentElement.classList.add(`is-utools`)
  }

  // 若 URL 带有 open 参数（Markdown 链接），打开导入对话框并自动导入
  const params = new URLSearchParams(window.location.search)
  const openUrl = params.get(`open`)
  if (openUrl && URL.canParse(openUrl) && /^https?:\/\//i.test(openUrl)) {
    uiStore.importMdOpenUrl = openUrl
    uiStore.isShowImportMdDialog = true
    params.delete(`open`)
    const newSearch = params.toString()
    const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : ``) + window.location.hash
    window.history.replaceState({}, ``, newUrl)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener(`message`, importSyncblogArticle)
  if (importReadyTimer.value) {
    clearInterval(importReadyTimer.value)
    importReadyTimer.value = null
  }
})
</script>

<template>
  <AppSplash />
  <RouterView />

  <ConfirmDialog />

  <Toaster
    rich-colors
    position="top-center"
    :duration="1200"
    :visible-toasts="1"
    :theme="isDark ? 'dark' : 'light'"
  />
</template>

<style lang="less">
html,
body,
#app {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
}

// 抵消下拉菜单开启时带来的样式
body {
  pointer-events: initial !important;
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
  background-color: transparent;
}

::-webkit-scrollbar-track {
  border-radius: 6px;
  background-color: transparent;
}

::-webkit-scrollbar-thumb {
  border-radius: 6px;
  background-color: #dadada;
}

.dark ::-webkit-scrollbar-thumb {
  background-color: #424242;
}

// Utools 模式下隐藏所有滚动条
.is-utools {
  ::-webkit-scrollbar {
    display: none;
  }

  // Firefox
  * {
    scrollbar-width: none;
  }

  // IE and Edge
  * {
    -ms-overflow-style: none;
  }
}

/* CSS-hints */
.CodeMirror-hints {
  position: absolute;
  z-index: 10;
  overflow-y: auto;
  margin: 0;
  padding: 2px;
  border-radius: 4px;
  max-height: 20em;
  min-width: 200px;
  font-size: 12px;
  font-family: monospace;

  color: #333333;
  background-color: #ffffff;
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.12), 0 2px 4px 0 rgba(0, 0, 0, 0.08);
}

.CodeMirror-hint {
  margin-top: 10px;
  padding: 4px 6px;
  border-radius: 2px;
  white-space: pre;
  color: #000000;
  cursor: pointer;

  &:first-of-type {
    margin-top: 0;
  }
  &:hover {
    background: #f0f0f0;
  }
}
.search-match {
  background-color: #ffeb3b; /* 所有匹配项颜色 */
}
.current-match {
  background-color: #ff5722; /* 当前匹配项更鲜艳的颜色 */
}
</style>
