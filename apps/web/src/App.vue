<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AuthDialog from '@/components/auth/AuthDialog.vue'
import ConfirmDialog from '@/components/confirm-dialog/ConfirmDialog.vue'
import { Toaster } from '@/components/ui/sonner'
import { useAppMode } from '@/composables/useAppMode'
import { APP_NAME, APP_SLOGAN, documentTitle } from '@/constants/branding'
import { useAuthStore } from '@/stores/auth'
import { useEditorStore } from '@/stores/editor'
import { usePostStore } from '@/stores/post'
import { useUIStore } from '@/stores/ui'

const uiStore = useUIStore()
const postStore = usePostStore()
const editorStore = useEditorStore()
const authStore = useAuthStore()
const { mode, stepLabel } = useAppMode()
const router = useRouter()
const route = useRoute()
const { isDark } = storeToRefs(uiStore)

const isUtools = ref(false)
const importReadyTimer = ref<ReturnType<typeof setInterval> | null>(null)

/**
 * 站外文章导入协议(postMessage)。详见 `/docs/import` 接入文档。
 * `MD_IMPORT_ARTICLE` 为通用类型名,`SYNCBLOG_IMPORT_ARTICLE` 为早期 syncblog 集成的兼容别名。
 */
const IMPORT_MESSAGE_TYPES = new Set([`MD_IMPORT_ARTICLE`, `SYNCBLOG_IMPORT_ARTICLE`])

interface ImportArticleMessage {
  type?: unknown
  requestId?: unknown
  title?: unknown
  markdown?: unknown
  canonicalUrl?: unknown
  tags?: unknown
}

type NormalizedImportPayload = NonNullable<ReturnType<typeof normalizeImportPayload>>

/**
 * 可信来源白名单:仅这些来源可直接导入,其它来源一律拒绝。
 * 如需加入白名单,联系微信 atar24。
 */
const TRUSTED_IMPORT_ORIGINS = new Set([
  `https://2aran.com`,
  `https://frontendnext.com`,
])

/**
 * 导入去重窗口：
 * - requestId: 更长窗口，避免调用方重试导致重复导入
 * - payload 指纹: 短窗口，兜住无 requestId 或 requestId 每次变化的重复推送
 */
const IMPORT_REQUEST_ID_DEDUP_WINDOW_MS = 5 * 60 * 1000
const IMPORT_PAYLOAD_DEDUP_WINDOW_MS = 15 * 1000
const processedRequestIds = new Map<string, number>()
const processedPayloadFingerprints = new Map<string, number>()

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

function normalizeImportPayload(data: unknown) {
  if (!data || typeof data !== `object`)
    return null

  const payload = data as ImportArticleMessage
  if (typeof payload.type !== `string` || !IMPORT_MESSAGE_TYPES.has(payload.type) || typeof payload.markdown !== `string`)
    return null

  return {
    requestId: typeof payload.requestId === `string` ? payload.requestId : ``,
    title: typeof payload.title === `string` ? payload.title.trim() : ``,
    markdown: payload.markdown,
    canonicalUrl: typeof payload.canonicalUrl === `string` ? payload.canonicalUrl.trim() : ``,
    tags: Array.isArray(payload.tags) ? payload.tags.filter((tag): tag is string => typeof tag === `string`) : [],
  }
}

function hashString(value: string) {
  // FNV-1a 32-bit: 轻量稳定，不引入额外依赖
  let hash = 0x811C9DC5
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16)
}

function getPayloadFingerprint(payload: NormalizedImportPayload) {
  return hashString(`${payload.title}\u0001${payload.markdown}`)
}

function isWithinWindow(now: number, ts: number, windowMs: number) {
  return now - ts <= windowMs
}

function pruneExpiredEntries(map: Map<string, number>, now: number, windowMs: number) {
  map.forEach((ts, key) => {
    if (!isWithinWindow(now, ts, windowMs))
      map.delete(key)
  })
}

function isDuplicateImport(payload: NormalizedImportPayload) {
  const now = Date.now()
  pruneExpiredEntries(processedRequestIds, now, IMPORT_REQUEST_ID_DEDUP_WINDOW_MS)
  pruneExpiredEntries(processedPayloadFingerprints, now, IMPORT_PAYLOAD_DEDUP_WINDOW_MS)

  if (payload.requestId) {
    const requestIdTs = processedRequestIds.get(payload.requestId)
    if (requestIdTs && isWithinWindow(now, requestIdTs, IMPORT_REQUEST_ID_DEDUP_WINDOW_MS))
      return true
  }

  const fingerprint = getPayloadFingerprint(payload)
  const payloadTs = processedPayloadFingerprints.get(fingerprint)
  if (payloadTs && isWithinWindow(now, payloadTs, IMPORT_PAYLOAD_DEDUP_WINDOW_MS))
    return true

  return false
}

function markImportProcessed(payload: NormalizedImportPayload) {
  const now = Date.now()
  if (payload.requestId)
    processedRequestIds.set(payload.requestId, now)

  processedPayloadFingerprints.set(getPayloadFingerprint(payload), now)
}

/** 向调用方回传导入结果回执,targetOrigin 锁定为来源 origin */
function replyImportResult(event: MessageEvent, requestId: string, ok: boolean, reason?: string) {
  const target = event.source as WindowProxy | null
  target?.postMessage({ type: `MD_IMPORT_RESULT`, requestId, ok, reason }, event.origin)
}

function applyImport(payload: NormalizedImportPayload): boolean {
  // 跨页面导入:确保切到 sync 路由再写入,避免在 creator-offer 公开页静默改稿
  if (route.name !== `sync`)
    router.replace({ name: `sync` })

  const currentPost = postStore.currentPost
  if (!currentPost)
    return false

  const hasTitleChange = !!payload.title && payload.title !== currentPost.title
  const hasContentChange = payload.markdown !== currentPost.content

  // 幂等写入：内容/标题无变化时，不触发编辑器 dispatch，避免滚动位置被重置
  if (!hasTitleChange && !hasContentChange)
    return true

  if (hasTitleChange)
    postStore.renamePost(currentPost.id, payload.title)

  if (hasContentChange) {
    postStore.updatePostContent(currentPost.id, payload.markdown)
    editorStore.importContent(payload.markdown)
  }
  return true
}

function handleImportMessage(event: MessageEvent) {
  const payload = normalizeImportPayload(event.data)
  if (!payload)
    return

  // 仅白名单来源可写入;其它来源一律拒绝(需联系微信 atar24 申请加白)
  if (!isTrustedImportOrigin(event.origin)) {
    replyImportResult(event, payload.requestId, false, `origin-not-whitelisted`)
    return
  }

  if (isDuplicateImport(payload)) {
    replyImportResult(event, payload.requestId, true)
    return
  }

  const ok = applyImport(payload)
  if (ok)
    markImportProcessed(payload)

  replyImportResult(event, payload.requestId, ok, ok ? undefined : `no-active-post`)
}

function postImportReady() {
  // 通用就绪信号 + syncblog 兼容信号
  window.opener?.postMessage({ type: `MD_IMPORT_READY`, app: `md.doocs.org` }, `*`)
  window.opener?.postMessage({ type: `SYNCBLOG_IMPORT_READY`, app: `syncblog.cn` }, `*`)
}

/**
 * Keep `document.title` in sync with the current app mode + step. CreatorOffer
 * pages own their own title (`{creator} 的创作名片`) so we skip them here.
 */
watch(
  [mode, stepLabel, () => route.name],
  ([currentMode, currentStep, name]) => {
    if (name === `creator-offer`)
      return
    if (currentMode === `editor`)
      document.title = `${APP_NAME} · 编辑器 — ${APP_SLOGAN}`
    else if (currentMode === `workflow` && currentStep)
      document.title = `${APP_NAME} · ${currentStep}`
    else
      document.title = documentTitle
  },
  { immediate: true },
)

onMounted(() => {
  // Best-effort: fetch /api/auth/me on app start. Worker may 503 before secrets
  // land — the auth store treats that as anonymous so the SPA still boots.
  void authStore.refresh()

  window.addEventListener(`message`, handleImportMessage)
  postImportReady()
  importReadyTimer.value = setInterval(postImportReady, 1000)

  if (route.name === `creator-offer`)
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
  window.removeEventListener(`message`, handleImportMessage)
  if (importReadyTimer.value) {
    clearInterval(importReadyTimer.value)
    importReadyTimer.value = null
  }
})
</script>

<template>
  <RouterView />

  <ConfirmDialog />
  <AuthDialog />

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
