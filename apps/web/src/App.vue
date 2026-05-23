<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import ConfirmDialog from '@/components/confirm-dialog/ConfirmDialog.vue'
import { Toaster } from '@/components/ui/sonner'
import { documentTitle } from '@/constants/branding'
import { useEditorStore } from '@/stores/editor'
import { usePostStore } from '@/stores/post'
import { SOCIAL_ACCOUNTS_ROUTE } from '@/stores/socialAccounts'
import { useUIStore } from '@/stores/ui'
import { getAppBasePath, isCreatorOfferPath, parseCreatorOfferId } from '@/utils/creatorRoutes'
import CodemirrorEditor from '@/views/CodemirrorEditor.vue'
import CreatorOfferPage from '@/views/CreatorOfferPage.vue'
import CreatorProfilePage from '@/views/CreatorProfilePage.vue'

const uiStore = useUIStore()
const postStore = usePostStore()
const editorStore = useEditorStore()
const { isDark } = storeToRefs(uiStore)

const isUtools = ref(false)
const currentPath = ref(window.location.pathname)
const isCreatorProfilePage = computed(() => currentPath.value === SOCIAL_ACCOUNTS_ROUTE)
const creatorOfferId = computed(() => parseCreatorOfferId(currentPath.value))
const isCreatorOfferPage = computed(() => isCreatorOfferPath(currentPath.value))
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

function updateCurrentPath() {
  currentPath.value = window.location.pathname
}

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

  const appPath = `${getAppBasePath() || `/`}`
  if (window.location.pathname !== appPath) {
    window.history.replaceState({}, ``, `${appPath}#content-sync`)
    updateCurrentPath()
  }
  uiStore.setWorkflowAppPage(`sync`)

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
  if (!isCreatorProfilePage.value && !isCreatorOfferPage.value)
    document.title = documentTitle
  window.addEventListener(`popstate`, updateCurrentPath)
  window.addEventListener(`message`, importSyncblogArticle)
  postImportReady()
  importReadyTimer.value = setInterval(postImportReady, 1000)

  if (isCreatorProfilePage.value || isCreatorOfferPage.value)
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
  window.removeEventListener(`popstate`, updateCurrentPath)
  window.removeEventListener(`message`, importSyncblogArticle)
  if (importReadyTimer.value) {
    clearInterval(importReadyTimer.value)
    importReadyTimer.value = null
  }
})
</script>

<template>
  <AppSplash />
  <CreatorProfilePage v-if="isCreatorProfilePage" />
  <CreatorOfferPage v-else-if="isCreatorOfferPage && creatorOfferId" :creator-id="creatorOfferId" />
  <CodemirrorEditor v-else />

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
