<script setup lang="ts">
/**
 * ProjectDistribute —— GitHub 项目同步台。
 *
 * 项目线不做正文创作主流程，只负责把项目链接 / 一句话介绍同步到
 * 开源发布站、开发者社区、社交渠道和云生态平台。
 */
import type { DistributionPlatformGroup } from '@/constants/distributionPlatforms'
import { Github, Link, Send } from 'lucide-vue-next'
import { Switch } from '@/components/ui/switch'
import { useWorkflowCreatorContext } from '@/composables/useWorkflowCreatorContext'
import { flattenPlatformGroups, PROJECT_PLATFORM_GROUPS } from '@/constants/distributionPlatforms'
import { copyPlain } from '@/utils/clipboard'
import { buildLinkPostContent, buildTitleFromContent, distributeWithPlugin, postDistributionIntent } from '@/utils/pluginDistribution'
import { store } from '@/utils/storage'
import { toast } from '@/utils/toast'
import SyncPluginTip from './SyncPluginTip.vue'

const { platformMatrix } = useWorkflowCreatorContext()

const repoUrl = store.reactive(`project_dist_repo_url`, ``)
const summary = store.reactive(`project_dist_summary`, ``)
const directPublish = store.reactive(`project_dist_direct_publish`, false)
const selected = store.reactive<string[]>(`project_dist_selected_platforms`, [])
const syncing = ref(false)

const platformGroups = PROJECT_PLATFORM_GROUPS
const PROJECT_PLATFORMS = flattenPlatformGroups(platformGroups)
const platformTypes = PROJECT_PLATFORMS.map(p => p.type)

const selectedInScope = computed(() => selected.value.filter(type => platformTypes.includes(type)))
const allSelected = computed(() => platformTypes.every(type => selected.value.includes(type)))
const someSelected = computed(() => selectedInScope.value.length > 0 && !allSelected.value)

/** 外站接入(MD_IMPORT_PROJECT):页面已挂载时由 App.vue 广播事件实时填入 */
function handleExternalProjectImport(event: Event) {
  const detail = (event as CustomEvent<{ url?: unknown, summary?: unknown }>).detail
  if (typeof detail?.url !== `string` || !detail.url.trim())
    return
  repoUrl.value = detail.url
  summary.value = typeof detail.summary === `string` ? detail.summary : ``
  toast.success(`已接收外站项目信息`)
}

onMounted(() => {
  window.addEventListener(`syncblog:import-project`, handleExternalProjectImport)
})

onBeforeUnmount(() => {
  window.removeEventListener(`syncblog:import-project`, handleExternalProjectImport)
})

const matrixByType = computed(() => new Map(platformMatrix.value.map(row => [row.type, row])))
const homeByType = new Map(PROJECT_PLATFORMS.map(p => [p.type, p.homeUrl]))
const publishByType = new Map(PROJECT_PLATFORMS.map(p => [p.type, p.publishUrl]))

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

/** 从仓库链接提取 `owner/repo` 作为默认标题 */
function repoTitleFromUrl(url: string): string {
  const match = url.match(/(?:github|gitee|gitcode|gitlab)\.com\/([\w.-]+\/[\w.-]+)/i)
  return match ? match[1].replace(/\.git$/, ``) : ``
}

function openSelectedPages() {
  toast.success(`项目信息已复制，正在打开 ${selectedInScope.value.length} 个平台`)
  for (const type of selectedInScope.value.slice(0, 8))
    window.open(publishUrl(type), `_blank`, `noopener,noreferrer`)
}

async function startPromotion() {
  if (syncing.value)
    return
  const url = repoUrl.value.trim()
  if (!url) {
    toast.error(`请先粘贴 GitHub 项目链接`)
    return
  }
  if (!selectedInScope.value.length) {
    toast.error(`至少勾选一个同步平台`)
    return
  }

  const intro = summary.value.trim()
  const payloadText = [intro, url].filter(Boolean).join(`\n`)
  try {
    await copyPlain(payloadText)
  }
  catch {}

  postDistributionIntent(`project`, { url, summary: intro, platforms: selectedInScope.value, directPublish: directPublish.value })

  if (!directPublish.value) {
    openSelectedPages()
    return
  }

  syncing.value = true
  try {
    const { content, markdown } = buildLinkPostContent({ summary: intro, url })
    const result = await distributeWithPlugin({
      contentType: `project`,
      post: {
        title: repoTitleFromUrl(url) || (intro ? buildTitleFromContent(intro) : url),
        content,
        markdown,
        desc: intro,
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
      toast.info(`插件暂未覆盖 ${result.unsupported.length} 个平台（如 GitHub / Product Hunt 等需手动发布），已跳过`)
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
  <div class="project-dist-page min-h-0 flex-1 overflow-y-auto">
    <div class="mx-auto w-full max-w-5xl px-4 py-6">
      <header class="mb-5">
        <div class="flex items-center gap-1.5 text-sm text-muted-foreground">
          <p>
            GitHub 项目同步，一键铺到开源发布站、开发者社区、社交渠道和云生态平台
          </p>
          <SyncPluginTip />
        </div>
      </header>

      <div class="import-bar mb-3 flex items-center gap-2 rounded-xl bg-card/60 px-3 py-2.5 ring-1 ring-border/40">
        <Github class="size-4 shrink-0 text-muted-foreground/60" />
        <input
          v-model="repoUrl"
          type="url"
          placeholder="粘贴 GitHub 项目链接"
          class="min-w-0 flex-1 border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/55"
          @keydown.enter="startPromotion"
        >
      </div>

      <div class="mb-5 rounded-xl bg-card/60 p-3 ring-1 ring-border/40">
        <div class="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Link class="size-3.5" />
          一句话项目简介（可选）
        </div>
        <textarea
          v-model="summary"
          rows="3"
          placeholder="例如：一个面向创作者的多平台内容分发工具，支持观点、文章、电子书、项目一键同步。"
          class="w-full resize-y border-0 bg-transparent text-sm leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/55"
        />
      </div>

      <div class="mb-5 flex items-center gap-4">
        <button type="button" class="sync-btn" :disabled="syncing" @click="startPromotion">
          {{ syncing ? '同步中' : '开始同步' }}
          <Send class="size-4" />
        </button>
        <label class="flex cursor-pointer items-center gap-2">
          <Switch v-model:checked="directPublish" />
          <span class="text-sm text-muted-foreground">直接发布</span>
        </label>
      </div>

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
          <span class="text-xs font-normal text-muted-foreground">已选 {{ selectedInScope.length }} / {{ PROJECT_PLATFORMS.length }}</span>
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
