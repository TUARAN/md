<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AuthDialog from '@/components/auth/AuthDialog.vue'
import PlatformAccountBar from '@/components/auth/PlatformAccountBar.vue'
import ConfirmDialog from '@/components/confirm-dialog/ConfirmDialog.vue'
import { Toaster } from '@/components/ui/sonner'
import { useAppMode } from '@/composables/useAppMode'
import { APP_NAME, APP_SLOGAN, documentTitle } from '@/constants/branding'
import { useAuthStore } from '@/stores/auth'
import { useEditorStore } from '@/stores/editor'
import { usePostStore } from '@/stores/post'
import { useUIStore } from '@/stores/ui'
import { distributeWithPlugin } from '@/utils/pluginDistribution'
import { store } from '@/utils/storage'

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

// 各分发台的持久化字段。store.reactive 每次调用是独立 ref,这里写入只负责
// 落盘 localStorage(目标页未挂载时,挂载后同步读到);目标页已挂载时靠
// 下方 CustomEvent 实时填入。
const importedOpinionContent = store.reactive(`composer_content`, ``)
const importedOpinionDirectPublish = store.reactive(`composer_direct_publish`, false)
const importedOpinionPlatforms = store.reactive<string[]>(`composer_selected_platforms`, [])
const importedBookletUrl = store.reactive(`booklet_dist_url`, ``)
const importedBookletTitle = store.reactive(`booklet_dist_title`, ``)
const importedBookletIntro = store.reactive(`booklet_dist_intro`, ``)
const importedProjectUrl = store.reactive(`project_dist_repo_url`, ``)
const importedProjectSummary = store.reactive(`project_dist_summary`, ``)

/**
 * 站外内容导入协议(postMessage)。详见 `/docs/import` 接入文档。
 * 四种内容类型各有独立消息名,分别落到对应分发台:
 * - MD_IMPORT_ARTICLE → Markdown 编辑器(文章排版)
 * - MD_IMPORT_OPINION → 观点分发台
 * - MD_IMPORT_BOOKLET → 电子书分发台
 * - MD_IMPORT_PROJECT → 项目分发台
 * `SYNCBLOG_IMPORT_*` 为早期 syncblog 集成的兼容别名。
 */
type ImportKind = `article` | `opinion` | `booklet` | `project`
const IMPORT_TYPE_TO_KIND: Record<string, ImportKind> = {
  MD_IMPORT_ARTICLE: `article`,
  SYNCBLOG_IMPORT_ARTICLE: `article`,
  MD_IMPORT_OPINION: `opinion`,
  SYNCBLOG_IMPORT_OPINION: `opinion`,
  MD_IMPORT_BOOKLET: `booklet`,
  SYNCBLOG_IMPORT_BOOKLET: `booklet`,
  MD_IMPORT_PROJECT: `project`,
  SYNCBLOG_IMPORT_PROJECT: `project`,
}

interface ImportMessage {
  type?: unknown
  requestId?: unknown
  title?: unknown
  markdown?: unknown
  opinion?: unknown
  content?: unknown
  url?: unknown
  repoUrl?: unknown
  intro?: unknown
  summary?: unknown
  canonicalUrl?: unknown
  tags?: unknown
  platforms?: unknown
  directPublish?: unknown
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

function pickString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === `string` && value.trim())
      return value
  }
  return ``
}

function normalizeImportPlatform(type: string, kind: ImportKind): string {
  const normalized = type.trim().toLowerCase()
  if (kind === `opinion`) {
    const aliases: Record<string, string> = {
      twitter: `x`,
      juejin: `juejin-pin`,
      zhihu: `zhihu-thought`,
    }
    return aliases[normalized] ?? normalized
  }
  return normalized === `twitter` ? `x` : normalized
}

function normalizeImportPayload(data: unknown) {
  if (!data || typeof data !== `object`)
    return null

  const payload = data as ImportMessage
  const kind = typeof payload.type === `string` ? IMPORT_TYPE_TO_KIND[payload.type] : undefined
  if (!kind)
    return null

  const markdown = typeof payload.markdown === `string` ? payload.markdown : ``
  // 观点正文:opinion 为主,content / markdown 依次降级
  const opinion = pickString(payload.opinion, payload.content, markdown)
  // 电子书 / 项目链接:url 为主,项目兼容 repoUrl,再降级 canonicalUrl
  const url = pickString(payload.url, payload.repoUrl, payload.canonicalUrl).trim()
  // 电子书简介 / 项目简介:intro 与 summary 互为别名,content 兜底
  const summary = pickString(payload.intro, payload.summary, payload.content).trim()
  const title = typeof payload.title === `string` ? payload.title.trim() : ``

  // 每种类型有自己的必填字段,缺了直接拒收
  if (kind === `article` && !markdown)
    return null
  if (kind === `opinion` && !opinion.trim())
    return null
  if (kind === `booklet` && !title && !url)
    return null
  if (kind === `project` && !url)
    return null

  return {
    kind,
    requestId: typeof payload.requestId === `string` ? payload.requestId : ``,
    title,
    markdown,
    opinion,
    url,
    summary,
    canonicalUrl: typeof payload.canonicalUrl === `string` ? payload.canonicalUrl.trim() : ``,
    tags: Array.isArray(payload.tags) ? payload.tags.filter((tag): tag is string => typeof tag === `string`) : [],
    platforms: Array.isArray(payload.platforms)
      ? Array.from(new Set(payload.platforms
          .filter((platform): platform is string => typeof platform === `string` && platform.trim().length > 0)
          .map(platform => normalizeImportPlatform(platform, kind))))
      : [],
    directPublish: payload.directPublish === true,
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
  return hashString(`${payload.kind}\u0001${payload.title}\u0001${payload.markdown || payload.opinion || payload.url}\u0001${payload.summary}`)
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
  if (payload.kind === `booklet`) {
    if (route.name !== `distribute-booklet`)
      router.replace({ name: `distribute-booklet` })

    // 一次导入 = 一本书的完整信息,三个字段整体覆盖,避免残留上一本的简介 / 链接
    importedBookletTitle.value = payload.title
    importedBookletUrl.value = payload.url
    importedBookletIntro.value = payload.summary
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent(`syncblog:import-booklet`, {
        detail: { title: payload.title, url: payload.url, intro: payload.summary, tags: payload.tags },
      }))
    }, 0)
    return true
  }

  if (payload.kind === `project`) {
    if (route.name !== `distribute-project`)
      router.replace({ name: `distribute-project` })

    importedProjectUrl.value = payload.url
    importedProjectSummary.value = payload.summary
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent(`syncblog:import-project`, {
        detail: { url: payload.url, summary: payload.summary, title: payload.title, tags: payload.tags },
      }))
    }, 0)
    return true
  }

  if (payload.kind === `opinion`) {
    if (route.name !== `distribute-compose`)
      router.replace({ name: `distribute-compose` })

    importedOpinionContent.value = payload.opinion
    importedOpinionDirectPublish.value = true
    if (payload.platforms.length > 0)
      importedOpinionPlatforms.value = payload.platforms
    window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent(`syncblog:import-opinion`, {
        detail: {
          content: payload.opinion,
          title: payload.title,
          canonicalUrl: payload.canonicalUrl,
          tags: payload.tags,
          platforms: payload.platforms,
          directPublish: true,
        },
      }))
    }, 0)
    return true
  }

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

async function distributeImportedArticle(payload: NormalizedImportPayload) {
  const result = await distributeWithPlugin({
    contentType: `article`,
    post: {
      title: payload.title || `未命名文章`,
      content: payload.markdown,
      markdown: payload.markdown,
      desc: payload.summary,
      url: payload.canonicalUrl,
    },
    platformTypes: payload.platforms,
  })

  if (result.status === `no-plugin`)
    return { ok: false, reason: `syncblog-plugin-not-installed` }
  if (result.status === `no-accounts`)
    return { ok: false, reason: `platform-not-supported` }
  if (result.failed.length > 0)
    return { ok: false, reason: result.failed.map(account => account.title).join(`, `) || `platform-sync-failed` }
  return { ok: true }
}

async function handleImportMessage(event: MessageEvent) {
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
  if (!ok) {
    replyImportResult(event, payload.requestId, false, `no-active-post`)
    return
  }

  if (payload.kind === `article` && payload.directPublish && payload.platforms.length > 0) {
    try {
      const distribution = await distributeImportedArticle(payload)
      if (!distribution.ok) {
        replyImportResult(event, payload.requestId, false, distribution.reason)
        return
      }
    }
    catch (error) {
      replyImportResult(
        event,
        payload.requestId,
        false,
        error instanceof Error ? error.message : `platform-sync-failed`,
      )
      return
    }
  }

  markImportProcessed(payload)
  replyImportResult(event, payload.requestId, true)
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
  <PlatformAccountBar />

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
  background-color: hsl(var(--muted-foreground) / 0.28);
  border: 1px solid hsl(var(--background) / 0.7);
}

.dark ::-webkit-scrollbar-thumb {
  background-color: hsl(var(--muted-foreground) / 0.35);
  border-color: hsl(var(--background) / 0.55);
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
  border: 1px solid hsl(var(--border) / 0.8);
  border-radius: 8px;
  max-height: 20em;
  min-width: 200px;
  font-size: 12px;
  font-family: monospace;

  color: hsl(var(--popover-foreground));
  background-color: hsl(var(--popover));
  box-shadow: 0 14px 34px hsl(var(--shadow-soft) / 0.16), 0 2px 8px hsl(var(--shadow-soft) / 0.08);
}

.CodeMirror-hint {
  margin-top: 10px;
  padding: 4px 6px;
  border-radius: 5px;
  white-space: pre;
  color: hsl(var(--popover-foreground));
  cursor: pointer;

  &:first-of-type {
    margin-top: 0;
  }
  &:hover {
    background: hsl(var(--accent) / 0.75);
  }
}
.search-match {
  background-color: #ffeb3b; /* 所有匹配项颜色 */
}
.current-match {
  background-color: #ff5722; /* 当前匹配项更鲜艳的颜色 */
}
</style>
