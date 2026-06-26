<script setup lang="ts">
/**
 * DistributionComposer —— 分发优先 IA 的主视角（默认落地页）。
 *
 * 直接把「写什么 + 发到哪些平台」作为主体：一个内容输入框 + 全平台网格
 * 勾选 + 一键同步。Markdown 编辑器、章节装配等都退居二线（顶栏内容类型
 * 切换 / 助手进入）。真正的多平台发布由 SyncBlog 插件承担，本页负责
 * 准备内容、选平台并发起同步。
 */
import { Image as ImageIcon, Send, Smartphone, Video } from 'lucide-vue-next'
import { Switch } from '@/components/ui/switch'
import { useWorkflowCreatorContext } from '@/composables/useWorkflowCreatorContext'
import { APP_SLOGAN } from '@/constants/branding'
import { getPlatformHomeUrl, PLATFORM_REGISTRY } from '@/constants/platforms'
import { copyPlain } from '@/utils/clipboard'
import { store } from '@/utils/storage'
import { toast } from '@/utils/toast'

const { platformMatrix } = useWorkflowCreatorContext()

const content = store.reactive(`composer_content`, ``)
const directPublish = store.reactive(`composer_direct_publish`, false)
const selected = store.reactive<string[]>(`composer_selected_platforms`, [])

const platforms = PLATFORM_REGISTRY

const allSelected = computed(() => selected.value.length === platforms.length)
const someSelected = computed(() => selected.value.length > 0 && !allSelected.value)
const charCount = computed(() => content.value.length)

/** 平台 → 已录入的主页 / 账号（有则「查看」跳该链接，否则跳门户首页） */
const matrixByType = computed(() => new Map(platformMatrix.value.map(row => [row.type, row])))

function viewUrl(type: string): string {
  return matrixByType.value.get(type)?.url || getPlatformHomeUrl(type)
}

function toggle(type: string) {
  selected.value = selected.value.includes(type)
    ? selected.value.filter(t => t !== type)
    : [...selected.value, type]
}

function toggleAll() {
  selected.value = allSelected.value ? [] : platforms.map(p => p.type)
}

function comingSoon(label: string) {
  toast.info(`${label}同步即将支持`)
}

async function startSync() {
  if (!content.value.trim()) {
    toast.error(`先写点内容再同步`)
    return
  }
  if (!selected.value.length) {
    toast.error(`至少勾选一个平台`)
    return
  }

  // 复制内容，便于在各平台发布页粘贴；真正的一键填充 / 直接发布由 SyncBlog 插件完成。
  try {
    await copyPlain(content.value)
  }
  catch {}

  // 尽力把分发意图广播给可能已安装的 SyncBlog 插件（无插件时无副作用）。
  window.postMessage(
    { source: `ai-distribution-master`, type: `distribute`, payload: { content: content.value, platforms: selected.value, directPublish: directPublish.value } },
    `*`,
  )

  toast.success(
    directPublish.value
      ? `已发起同步：${selected.value.length} 个平台（需安装发布插件执行直接发布）`
      : `内容已复制，正在打开 ${selected.value.length} 个平台发布页`,
  )

  // 预览模式：打开所选平台的发布页，便于粘贴。直接发布模式交给插件，不再开页。
  if (!directPublish.value) {
    for (const type of selected.value.slice(0, 8))
      window.open(getPlatformHomeUrl(type), `_blank`, `noopener,noreferrer`)
  }
}
</script>

<template>
  <div class="composer-page min-h-0 flex-1 overflow-y-auto">
    <div class="mx-auto w-full max-w-5xl px-4 py-6">
      <header class="mb-5 text-center">
        <h1 class="text-2xl font-bold tracking-tight">
          内容同步 · 一键分发
        </h1>
        <p class="mt-1.5 text-sm text-muted-foreground">
          {{ APP_SLOGAN }}
        </p>
      </header>

      <!-- 输入卡片 -->
      <div class="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
        <textarea
          v-model="content"
          rows="5"
          placeholder="分享新鲜事，或粘贴要分发的内容…"
          class="w-full resize-y border-0 bg-transparent text-[15px] leading-relaxed text-foreground outline-none placeholder:text-muted-foreground/70"
        />
        <div class="mt-2 flex items-end justify-between">
          <div class="flex items-center gap-1.5">
            <button type="button" class="composer-media" title="图片" @click="comingSoon('图片')">
              <ImageIcon class="size-[18px]" />
            </button>
            <button type="button" class="composer-media" title="视频" @click="comingSoon('视频')">
              <Video class="size-[18px]" />
            </button>
            <button type="button" class="composer-media" title="小程序卡片" @click="comingSoon('卡片')">
              <Smartphone class="size-[18px]" />
            </button>
          </div>
          <span class="text-xs tabular-nums text-muted-foreground/70">{{ charCount }}</span>
        </div>
      </div>

      <!-- 直接发布开关 -->
      <label class="mt-4 flex cursor-pointer items-center gap-2.5">
        <Switch v-model:checked="directPublish" />
        <span class="text-sm font-medium">开启直接发布</span>
        <span class="text-xs text-muted-foreground">（否则仅打开发布页 / 填充预览，需手动点击发布）</span>
      </label>

      <!-- 全选 + 同步 -->
      <div class="mt-4 flex items-center justify-between gap-3">
        <label class="flex cursor-pointer items-center gap-2.5 text-sm font-semibold">
          <input
            type="checkbox"
            class="composer-check"
            :checked="allSelected"
            :indeterminate="someSelected"
            @change="toggleAll"
          >
          全选
          <span class="text-xs font-normal text-muted-foreground">已选 {{ selected.length }} / {{ platforms.length }}</span>
        </label>
        <button type="button" class="composer-sync" @click="startSync">
          开始同步
          <Send class="size-4" />
        </button>
      </div>

      <!-- 平台网格 -->
      <div class="mt-3 grid grid-cols-1 gap-x-8 gap-y-0.5 sm:grid-cols-2 lg:grid-cols-3">
        <label
          v-for="p in platforms"
          :key="p.type"
          class="group flex cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-2 transition-colors hover:bg-muted/50"
        >
          <input
            type="checkbox"
            class="composer-check"
            :checked="selected.includes(p.type)"
            @change="toggle(p.type)"
          >
          <span class="flex size-7 shrink-0 items-center justify-center rounded-md border border-border/70 bg-background text-xs font-semibold text-muted-foreground">
            {{ p.title.slice(0, 1) }}
          </span>
          <span class="min-w-0 flex-1 truncate text-sm font-medium">{{ p.title }}</span>
          <a
            :href="viewUrl(p.type)"
            target="_blank"
            rel="noopener noreferrer"
            class="shrink-0 text-xs text-muted-foreground opacity-0 transition-opacity hover:text-primary hover:underline group-hover:opacity-100"
            @click.stop
          >查看</a>
        </label>
      </div>
    </div>
  </div>
</template>

<style scoped>
.composer-media {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.625rem;
  border: 1px solid hsl(var(--border) / 0.8);
  color: hsl(var(--muted-foreground));
  transition: color 0.15s ease, background 0.15s ease;
}
.composer-media:hover {
  color: hsl(var(--foreground));
  background: hsl(var(--muted) / 0.5);
}

.composer-check {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  accent-color: hsl(var(--primary));
  cursor: pointer;
}

.composer-sync {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  height: 2.5rem;
  padding: 0 1.25rem;
  border-radius: 0.75rem;
  background: hsl(var(--foreground));
  color: hsl(var(--background));
  font-size: 0.9375rem;
  font-weight: 600;
  transition: opacity 0.15s ease;
}
.composer-sync:hover {
  opacity: 0.9;
}
</style>
