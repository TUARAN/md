<script setup lang="ts">
import type { DistributionPlatformGroup } from '@/constants/distributionPlatforms'
import { BookOpen, Send } from 'lucide-vue-next'
import { Switch } from '@/components/ui/switch'
import { useWorkflowCreatorContext } from '@/composables/useWorkflowCreatorContext'
import { APP_NAME } from '@/constants/branding'
import { EBOOK_PLATFORM_GROUPS, flattenPlatformGroups } from '@/constants/distributionPlatforms'
import { copyPlain } from '@/utils/clipboard'
import { store } from '@/utils/storage'
import { toast } from '@/utils/toast'
import SyncPluginTip from './SyncPluginTip.vue'

const { platformMatrix } = useWorkflowCreatorContext()

const bookletUrl = store.reactive(`booklet_dist_url`, ``)
const directPublish = store.reactive(`booklet_dist_direct_publish`, false)
const selected = store.reactive<string[]>(`booklet_dist_platforms`, [])

const platformGroups = EBOOK_PLATFORM_GROUPS
const EBOOK_PLATFORMS = flattenPlatformGroups(platformGroups)
const platformTypes = EBOOK_PLATFORMS.map(p => p.type)

const selectedInScope = computed(() => selected.value.filter(type => platformTypes.includes(type)))
const allSelected = computed(() => platformTypes.every(type => selected.value.includes(type)))
const someSelected = computed(() => selectedInScope.value.length > 0 && !allSelected.value)

const matrixByType = computed(() => new Map(platformMatrix.value.map(row => [row.type, row])))
const homeByType = new Map(EBOOK_PLATFORMS.map(p => [p.type, p.homeUrl]))
function viewUrl(type: string): string {
  return matrixByType.value.get(type)?.url || homeByType.get(type) || `#`
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

async function startSync() {
  if (!selectedInScope.value.length) {
    toast.error(`至少勾选一个平台`)
    return
  }
  try { await copyPlain(bookletUrl.value || APP_NAME) }
  catch {}
  window.postMessage(
    { source: `ai-distribution-master`, type: `distribute-ebook`, payload: { url: bookletUrl.value, platforms: selectedInScope.value, directPublish: directPublish.value } },
    `*`,
  )
  toast.success(directPublish.value
    ? `已发起电子书分发：${selectedInScope.value.length} 个平台`
    : `正在打开 ${selectedInScope.value.length} 个平台`)
  if (!directPublish.value) {
    for (const type of selectedInScope.value.slice(0, 8))
      window.open(viewUrl(type), `_blank`, `noopener,noreferrer`)
  }
}
</script>

<template>
  <div class="dist-page min-h-0 flex-1 overflow-y-auto">
    <div class="mx-auto w-full max-w-5xl px-4 py-6">
      <header class="mb-5">
        <div class="flex items-center gap-1.5 text-sm text-muted-foreground">
          <p>
            电子书 / 付费小册 / 网文小说，一键分发到知识付费、小说连载和电子书长尾平台
          </p>
          <SyncPluginTip />
        </div>
      </header>

      <!-- 电子书链接 -->
      <div class="import-bar mb-5 flex items-center gap-2 rounded-xl bg-card/60 px-3 py-2.5 ring-1 ring-border/40">
        <BookOpen class="size-4 shrink-0 text-muted-foreground/60" />
        <input
          v-model="bookletUrl"
          type="url"
          placeholder="电子书 / 小册 / 小说链接（可选，已发布地址）"
          class="min-w-0 flex-1 border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/55"
        >
      </div>

      <!-- 同步按钮 + 直接发布 -->
      <div class="mb-5 flex items-center gap-4">
        <button type="button" class="sync-btn" @click="startSync">
          开始同步
          <Send class="size-4" />
        </button>
        <label class="flex cursor-pointer items-center gap-2">
          <Switch v-model:checked="directPublish" />
          <span class="text-sm text-muted-foreground">直接发布</span>
        </label>
      </div>

      <!-- 全选 -->
      <div class="mb-3">
        <label class="flex cursor-pointer items-center gap-2.5 text-sm font-semibold">
          <input type="checkbox" class="platform-check" :checked="allSelected" :indeterminate="someSelected" @change="toggleAll">
          全选
          <span class="text-xs font-normal text-muted-foreground">已选 {{ selectedInScope.length }} / {{ EBOOK_PLATFORMS.length }}</span>
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
              <input type="checkbox" class="platform-check" :checked="selected.includes(p.type)" @change="toggle(p.type)">
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

.import-bar {
  background: hsl(var(--card) / 0.6);
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
