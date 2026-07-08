<script setup lang="ts">
/**
 * ArticleDistribute —— 文章分发台（分发优先视角）
 *
 * 核心理念：文章在你最熟悉的平台写好，这里只做「分发入口」。
 * 外站接入（URL 导入 / 上传 Word）→ 填标题摘要封面 → 选平台 → 一键同步。
 * Markdown 排版编辑器作为可选的辅助工具（通过助手进入）。
 */
import type { DistributionPlatformGroup } from '@/constants/distributionPlatforms'
import { Link, PenLine, Send, Upload } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { Switch } from '@/components/ui/switch'
import { useWorkflowCreatorContext } from '@/composables/useWorkflowCreatorContext'
import { ARTICLE_PLATFORM_GROUPS, flattenPlatformGroups } from '@/constants/distributionPlatforms'
import { copyPlain } from '@/utils/clipboard'
import { buildLinkPostContent, distributeWithPlugin, postDistributionIntent } from '@/utils/pluginDistribution'
import { store } from '@/utils/storage'
import { toast } from '@/utils/toast'
import SyncPluginTip from './SyncPluginTip.vue'

const router = useRouter()
const { platformMatrix } = useWorkflowCreatorContext()

const urlInput = store.reactive(`article_dist_url`, ``)
const titleInput = store.reactive(`article_dist_title`, ``)
const summaryInput = store.reactive(`article_dist_summary`, ``)
const directPublish = store.reactive(`article_dist_direct_publish`, false)
const selected = store.reactive<string[]>(`article_dist_selected_platforms`, [])
const syncing = ref(false)

const platformGroups = ARTICLE_PLATFORM_GROUPS
const ARTICLE_PLATFORMS = flattenPlatformGroups(platformGroups)
const platformTypes = ARTICLE_PLATFORMS.map(p => p.type)

const selectedInScope = computed(() => selected.value.filter(type => platformTypes.includes(type)))
const allSelected = computed(() => platformTypes.every(type => selected.value.includes(type)))
const someSelected = computed(() => selectedInScope.value.length > 0 && !allSelected.value)

const matrixByType = computed(() => new Map(platformMatrix.value.map(row => [row.type, row])))
const homeByType = new Map(ARTICLE_PLATFORMS.map(p => [p.type, p.homeUrl]))
const publishByType = new Map(ARTICLE_PLATFORMS.map(p => [p.type, p.publishUrl]))

function viewUrl(type: string): string {
  return matrixByType.value.get(type)?.url || homeByType.get(type) || `#`
}

function publishUrl(type: string): string {
  return publishByType.get(type) || homeByType.get(type) || `#`
}

function toggle(type: string) {
  selected.value = selected.value.includes(type)
    ? selected.value.filter(t => t !== type)
    : [...selected.value, type]
}

function toggleAll() {
  selected.value = allSelected.value ? [] : platformTypes
}

function isGroupAllSelected(group: DistributionPlatformGroup): boolean {
  return group.platforms.every(p => selected.value.includes(p.type))
}

function isGroupSomeSelected(group: DistributionPlatformGroup): boolean {
  return group.platforms.some(p => selected.value.includes(p.type)) && !isGroupAllSelected(group)
}

function toggleGroup(group: DistributionPlatformGroup) {
  const groupTypes = group.platforms.map(p => p.type)
  selected.value = isGroupAllSelected(group)
    ? selected.value.filter(type => !groupTypes.includes(type))
    : Array.from(new Set([...selected.value, ...groupTypes]))
}

function handleWordUpload() {
  toast.info(`Word 上传即将支持`)
}

async function importUrl() {
  const url = urlInput.value.trim()
  if (!url) {
    toast.error(`请输入文章链接`)
    return
  }
  // 打开排版编辑器并带上源链接，后续可扩展为自动抓取
  router.push({ name: `sync`, query: { importUrl: url } })
}

function openSelectedPages() {
  toast.success(`链接已复制，正在打开 ${selectedInScope.value.length} 个平台发布页`)
  for (const type of selectedInScope.value.slice(0, 8))
    window.open(publishUrl(type), `_blank`, `noopener,noreferrer`)
}

async function startSync() {
  if (syncing.value)
    return
  const url = urlInput.value.trim()
  if (!url) {
    toast.error(`请先导入文章链接`)
    return
  }
  if (!selectedInScope.value.length) {
    toast.error(`至少勾选一个平台`)
    return
  }

  const title = titleInput.value.trim()
  const summary = summaryInput.value.trim()
  const shareText = [title, summary, url].filter(Boolean).join(`\n`)

  try {
    await copyPlain(shareText)
  }
  catch {}

  postDistributionIntent(`article`, { url, title, platforms: selectedInScope.value, directPublish: directPublish.value })

  if (!directPublish.value) {
    openSelectedPages()
    return
  }

  syncing.value = true
  try {
    const { content, markdown } = buildLinkPostContent({ summary, url })
    const result = await distributeWithPlugin({
      contentType: `article`,
      post: {
        title: title || url,
        content,
        markdown,
        desc: summary,
        url,
      },
      platformTypes: selectedInScope.value,
      homeUrlOf: viewUrl,
    })

    if (result.status === `no-plugin`) {
      toast.error(`未检测到 SyncBlog 发布插件，改为打开发布页手动粘贴`)
      openSelectedPages()
      return
    }
    if (result.status === `no-accounts`) {
      toast.error(`所选平台当前没有插件处理器，改为打开发布页手动粘贴`)
      openSelectedPages()
      return
    }
    if (result.unsupported.length > 0)
      toast.info(`插件暂未覆盖 ${result.unsupported.length} 个平台，已跳过`)
    if (result.failed.length > 0)
      toast.error(`插件已处理 ${result.total} 个平台，失败 ${result.failed.length} 个：${result.failed.map(a => a.title).slice(0, 3).join(`、`)}`)
    else
      toast.success(`已通过 SyncBlog 插件同步至 ${result.total} 个平台`)
  }
  catch (e) {
    toast.error(e instanceof Error ? `插件同步失败：${e.message}` : `插件同步失败`)
  }
  finally {
    syncing.value = false
  }
}
</script>

<template>
  <div class="article-dist-page min-h-0 flex-1 overflow-y-auto">
    <div class="mx-auto w-full max-w-5xl px-4 py-6">
      <header class="mb-5">
        <div class="flex items-center gap-1.5 text-sm text-muted-foreground">
          <p>
            长文章，外站写好后导入链接，一键分发到公众号、知乎、掘金、CSDN 等平台
          </p>
          <SyncPluginTip />
        </div>
      </header>

      <!-- 外站接入输入条 -->
      <div class="import-bar mb-3 flex items-center gap-2 rounded-xl bg-card/60 px-3 py-2.5 ring-1 ring-border/40">
        <Link class="size-4 shrink-0 text-muted-foreground/60" />
        <input
          v-model="urlInput"
          type="url"
          placeholder="粘贴文章链接（已在其他平台发布的文章）"
          class="min-w-0 flex-1 border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/55"
          @keydown.enter="importUrl"
        >
        <button type="button" class="import-btn" @click="importUrl">
          导入
        </button>
        <span class="text-xs text-muted-foreground/40">或</span>
        <button type="button" class="import-btn-outline" @click="handleWordUpload">
          <Upload class="size-3.5" />
          上传 Word
        </button>
      </div>

      <!-- 标题 + 摘要（直接发布时作为各平台草稿的标题与链接帖简介） -->
      <div class="mb-3 rounded-xl bg-card/60 p-3 ring-1 ring-border/40">
        <input
          v-model="titleInput"
          type="text"
          placeholder="文章标题（直接发布时用作各平台草稿标题，留空则用链接）"
          class="w-full border-0 bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/55"
        >
        <textarea
          v-model="summaryInput"
          rows="2"
          placeholder="一句话摘要（可选，将与链接一起填入各平台草稿正文）"
          class="mt-2 w-full resize-y border-0 bg-transparent text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/55"
        />
      </div>

      <!-- 去编辑创作 引导 -->
      <div class="mb-5 flex items-center gap-2">
        <span class="text-xs text-muted-foreground/50">还没写好？</span>
        <button type="button" class="editor-link" @click="router.push({ name: 'sync' })">
          <PenLine class="size-3.5" />
          去 Markdown 编辑器创作
        </button>
        <span class="text-xs text-muted-foreground/40">— 编辑完后可复制链接回填到这里；在编辑器里可整篇正文直接同步</span>
      </div>

      <!-- 同步按钮 + 直接发布开关 -->
      <div class="mb-5 flex items-center gap-4">
        <button type="button" class="sync-btn" :disabled="syncing" @click="startSync">
          {{ syncing ? '同步中' : '开始同步' }}
          <Send class="size-4" />
        </button>
        <label class="flex cursor-pointer items-center gap-2">
          <Switch v-model:checked="directPublish" />
          <span class="text-sm text-muted-foreground">直接发布</span>
        </label>
      </div>

      <!-- 全选 + 平台列表 -->
      <div class="mb-3 flex items-center gap-3">
        <label class="flex cursor-pointer items-center gap-2.5 text-sm font-semibold">
          <input
            type="checkbox"
            class="platform-check"
            :checked="allSelected"
            :indeterminate="someSelected"
            @change="toggleAll"
          >
          全选
          <span class="text-xs font-normal text-muted-foreground">已选 {{ selectedInScope.length }} / {{ ARTICLE_PLATFORMS.length }}</span>
        </label>
      </div>

      <div class="space-y-2">
        <section v-for="group in platformGroups" :key="group.id" class="platform-group">
          <div class="mb-1 flex items-center gap-2">
            <h2 class="text-xs font-semibold text-foreground">
              {{ group.title }}
            </h2>
            <span class="text-xs text-muted-foreground">({{ group.platforms.length }})</span>
            <label class="ml-2 flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
              <input
                type="checkbox"
                class="platform-check platform-check--small"
                :checked="isGroupAllSelected(group)"
                :indeterminate="isGroupSomeSelected(group)"
                @change="toggleGroup(group)"
              >
              全选
            </label>
          </div>

          <div class="grid grid-cols-1 gap-x-6 gap-y-0 sm:grid-cols-2 lg:grid-cols-4">
            <label
              v-for="p in group.platforms"
              :key="p.type"
              class="group flex cursor-pointer items-center gap-1.5 rounded px-1 py-1 transition-colors hover:bg-muted/50"
            >
              <input
                type="checkbox"
                class="platform-check"
                :checked="selected.includes(p.type)"
                @change="toggle(p.type)"
              >
              <img :src="p.iconUrl" :alt="p.title" class="size-4 shrink-0 rounded bg-white p-[1px] object-contain">
              <span class="min-w-0 flex-1 truncate text-[13px] font-medium">{{ p.title }}</span>
              <a
                :href="viewUrl(p.type)"
                target="_blank"
                rel="noopener noreferrer"
                class="shrink-0 text-xs text-muted-foreground opacity-0 transition-opacity hover:text-primary hover:underline group-hover:opacity-100"
                @click.stop
              >查看</a>
            </label>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.import-btn {
  flex-shrink: 0;
  height: 2rem;
  padding: 0 0.875rem;
  border-radius: 0.5rem;
  background: hsl(var(--foreground));
  color: hsl(var(--background));
  font-size: 0.8125rem;
  font-weight: 600;
  transition: opacity 0.15s ease;
}
.import-btn:hover {
  opacity: 0.85;
}

.import-btn-outline {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  flex-shrink: 0;
  height: 2rem;
  padding: 0 0.875rem;
  border-radius: 0.5rem;
  border: 1px solid hsl(var(--border));
  background: transparent;
  color: hsl(var(--muted-foreground));
  font-size: 0.8125rem;
  font-weight: 500;
  transition: background 0.15s ease, color 0.15s ease;
}
.import-btn-outline:hover {
  background: hsl(var(--muted) / 0.5);
  color: hsl(var(--foreground));
}

.editor-link {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: hsl(var(--muted-foreground));
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: color 0.15s ease;
}
.editor-link:hover {
  color: hsl(var(--foreground));
}

.sync-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  height: 2.5rem;
  padding: 0 1.5rem;
  border-radius: 0.75rem;
  background: hsl(var(--foreground));
  color: hsl(var(--background));
  font-size: 0.9375rem;
  font-weight: 600;
  transition: opacity 0.15s ease;
}
.sync-btn:hover {
  opacity: 0.9;
}

.sync-btn:disabled {
  cursor: wait;
  opacity: 0.65;
}

.platform-check {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  accent-color: hsl(var(--primary));
  cursor: pointer;
}

.platform-check--small {
  width: 0.875rem;
  height: 0.875rem;
}

.platform-group + .platform-group {
  padding-top: 0.5rem;
  border-top: 1px solid hsl(var(--border) / 0.45);
}
</style>
