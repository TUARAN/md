<script setup lang="ts">
import type { ContentTypeId } from '@/constants/contentTypes'
import { Download, Menu, ScrollText, Settings } from 'lucide-vue-next'
import { computed, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import AssistDrawer from '@/components/workflow/AssistDrawer.vue'
import { useEditorHeaderDialogs } from '@/composables/useEditorHeaderDialogs'
import { EDITOR_WECHAT_COPY_KEY } from '@/composables/useEditorWechatCopy'
import { getSyncblogPluginReleaseUrl } from '@/constants/branding'
import { CONTENT_TYPES, contentTypeOfRoute } from '@/constants/contentTypes'
import { useUIStore } from '@/stores/ui'
import EditDropdown from './EditDropdown.vue'
import FileDropdown from './FileDropdown.vue'
import FormatDropdown from './FormatDropdown.vue'
import HelpDropdown from './HelpDropdown.vue'
import InsertDropdown from './InsertDropdown.vue'
import MarkdownHelpDialog from './MarkdownHelpDialog.vue'
import StyleDropdown from './StyleDropdown.vue'

const wechatCopy = inject(EDITOR_WECHAT_COPY_KEY, null)

const uiStore = useUIStore()

const router = useRouter()
const route = useRoute()

const {
  aboutDialogVisible,
  editorStateDialogVisible,
  markdownHelpDialogVisible,
  handleOpenAbout,
  handleOpenEditorState,
  handleOpenMarkdownHelp,
} = useEditorHeaderDialogs()

function handleCopy(mode: string) {
  wechatCopy?.handleCopy(mode)
}

/*
 * 分发优先 IA：顶栏唯一主导航是「内容类型切换」（观点 / 文章 / 小册 / 项目），
 * 每种类型直达它的分发台。过去占顶栏的上游步骤（提炼 / 创作 / 选题 / 复盘）
 * 降级到「助手」（见 AssistDrawer），不再平铺在顶栏。
 */

/** 当前路由所属的内容类型（找不到回退 article，即编辑器分发台） */
const activeContentType = computed<ContentTypeId>(() => contentTypeOfRoute(String(route.name ?? `sync`)))

/** 当前内容类型的一句话定位（桌面端 tab 右侧提示） */
const activeTagline = computed(() => CONTENT_TYPES.find(t => t.id === activeContentType.value)?.tagline ?? ``)

function selectContentType(id: ContentTypeId) {
  const target = CONTENT_TYPES.find(t => t.id === id)
  if (!target || route.name === target.routeName)
    return
  router.push({ name: target.routeName })
}

function openChangelog() {
  router.push({ name: `changelog` })
}

function openSettings() {
  router.push({ name: `settings` })
}

/**
 * 「下载发布插件」入口：新开 Tab 下载站点自托管的 SyncBlog Plugin zip。
 * 部署方可通过 `VITE_SYNCBLOG_PLUGIN_RELEASE_URL` 覆盖为私有/镜像地址。
 */
function openPluginDownload() {
  window.open(getSyncblogPluginReleaseUrl(), `_blank`, `noopener,noreferrer`)
}
</script>

<template>
  <header class="header-container relative flex min-h-[5.25rem] flex-col gap-1.5 px-3 py-2 md:min-h-[3.5rem] md:px-5">
    <!-- 桌面端：分发优先 IA —— 唯一主导航是内容类型切换（观点 / 文章 / 小册 / 项目） -->
    <div class="hidden w-full min-w-0 items-center gap-3 pr-[20rem] md:flex">
      <div class="lane-tabs" role="tablist" aria-label="内容类型">
        <button
          v-for="t in CONTENT_TYPES"
          :key="t.id"
          type="button"
          role="tab"
          class="lane-tab gap-1.5"
          :class="{ 'lane-tab--active': activeContentType === t.id }"
          :aria-selected="activeContentType === t.id"
          @click="selectContentType(t.id)"
        >
          <component :is="t.icon" class="size-3.5 shrink-0" aria-hidden="true" />
          <span>{{ t.label }}</span>
        </button>
      </div>
      <p class="hidden min-w-0 flex-1 truncate text-xs text-muted-foreground lg:block">
        {{ activeTagline }}
      </p>
    </div>

    <!-- 移动端：一行 = 内容类型切换 + 助手 + 编辑器菜单 -->
    <div class="flex w-full min-w-0 items-center justify-between gap-2 md:hidden">
      <div class="lane-tabs min-w-0 overflow-x-auto" role="tablist" aria-label="内容类型">
        <button
          v-for="t in CONTENT_TYPES"
          :key="t.id"
          type="button"
          role="tab"
          class="lane-tab lane-tab--mobile gap-1"
          :class="{ 'lane-tab--active': activeContentType === t.id }"
          :aria-selected="activeContentType === t.id"
          @click="selectContentType(t.id)"
        >
          <component :is="t.icon" class="size-3 shrink-0" aria-hidden="true" />
          <span>{{ t.label }}</span>
        </button>
      </div>

      <div class="flex shrink-0 items-center gap-1">
        <AssistDrawer />
        <Menubar class="shrink-0 border-0 p-0">
          <MenubarMenu>
            <MenubarTrigger
              class="workflow-mobile-menu-trigger inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-border/40 bg-transparent p-0 text-muted-foreground shadow-none transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=open]:bg-muted/50 data-[state=open]:text-foreground"
            >
              <Menu class="size-4 pointer-events-none" />
            </MenubarTrigger>
            <MenubarContent align="start">
              <FileDropdown :as-sub="true" @open-editor-state="handleOpenEditorState" />
              <EditDropdown :as-sub="true" @copy="handleCopy" />
              <FormatDropdown :as-sub="true" />
              <InsertDropdown :as-sub="true" />
              <StyleDropdown :as-sub="true" />
              <HelpDropdown :as-sub="true" @open-about="handleOpenAbout" @open-markdown-help="handleOpenMarkdownHelp" />
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>
    </div>

    <!-- 右侧：辅助入口 -->
    <div class="header-actions hidden shrink-0 items-center gap-1 md:flex">
      <!-- 助手：分发优先 IA 里上游步骤（提炼/创作/选题/复盘）的二级入口 -->
      <AssistDrawer />
      <TooltipProvider :delay-duration="200">
        <!--
          下载发布插件：下载站点自托管的 SyncBlog Plugin zip。
          位置：放在最左（日志、设置之前），新用户第一次使用就需要它。
        -->
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              class="shrink-0 gap-1.5 text-muted-foreground/80 hover:text-foreground"
              aria-label="下载发布插件"
              @click="openPluginDownload"
            >
              <Download class="h-3.5 w-3.5" />
              <span class="text-xs">下载插件</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" :side-offset="6" class="text-xs">
            下载 SyncBlog 发布插件
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              class="shrink-0 gap-1.5 text-muted-foreground/80 hover:text-foreground"
              aria-label="更新日志"
              @click="openChangelog"
            >
              <ScrollText class="h-3.5 w-3.5" />
              <span class="text-xs">更新日志</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" :side-offset="6" class="text-xs">
            更新日志
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              class="shrink-0 gap-1.5 text-muted-foreground/80 hover:text-foreground"
              aria-label="设置"
              @click="openSettings"
            >
              <Settings class="h-3.5 w-3.5" />
              <span class="text-xs">设置</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" :side-offset="6" class="text-xs">
            设置
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  </header>

  <!-- 对话框组件，嵌套菜单无法正常挂载，需要提取层级 -->
  <AboutDialog :visible="aboutDialogVisible" @close="aboutDialogVisible = false" />
  <EditorStateDialog :visible="editorStateDialogVisible" @close="editorStateDialogVisible = false" />
  <MarkdownHelpDialog :visible="markdownHelpDialogVisible" @close="markdownHelpDialogVisible = false" />
  <AIImageGeneratorPanel v-model:open="uiStore.aiImageDialogVisible" />
</template>

<style lang="less" scoped>
.header-container {
  /* Shared with `.menubar--secondary` triggers and workflow steps (parity) */
  --header-tab-size: 0.875rem;
  --header-tab-weight: 500;
  --header-tab-leading: 1.25;

  background: hsl(var(--card) / 0.94);
  border-bottom: 1px solid hsl(var(--border) / 0.85);
  box-shadow: 0 1px 0 hsl(0 0% 100% / 0.65), 0 8px 24px hsl(var(--shadow-soft) / 0.04);
  backdrop-filter: blur(14px) saturate(130%);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 50;
}

/* —— 内容类型切换：中性 segmented control（激活段=抬升的浅色面，不用强调色）—— */
.lane-tabs {
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 0.125rem;
  padding: 0.1875rem;
  border-radius: calc(var(--radius) + 0.125rem);
  border: 1px solid hsl(var(--border) / 0.6);
  background: hsl(var(--muted) / 0.55);
}

.lane-tab {
  display: inline-flex;
  height: 1.625rem;
  flex-shrink: 0;
  align-items: center;
  border-radius: calc(var(--radius) - 0.0625rem);
  padding: 0 0.75rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: hsl(var(--muted-foreground));
  transition: color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    color: hsl(var(--foreground));
  }

  &:focus-visible {
    outline: 2px solid transparent;
    outline-offset: 2px;
    box-shadow: 0 0 0 2px hsl(var(--ring) / 0.5);
  }
}

.lane-tab--mobile {
  height: 1.5rem;
  padding: 0 0.625rem;
  font-size: 0.75rem;
}

/* 激活段：抬升的中性面 + 强字重，靠层次而非颜色区分 */
.lane-tab--active {
  background: hsl(var(--surface-elevated, var(--card)));
  color: hsl(var(--foreground));
  font-weight: 600;
  box-shadow: 0 1px 2px hsl(var(--shadow-soft) / 0.16), 0 0 0 1px hsl(var(--border) / 0.45);

  &:hover {
    color: hsl(var(--foreground));
  }
}

.header-actions {
  position: absolute;
  top: 0.625rem;
  right: 1.25rem;
}

.menubar {
  user-select: none;

  &:not(.menubar--secondary) :deep([data-radix-menubar-trigger]) {
    font-size: 0.75rem;
    font-weight: 500;
    line-height: 1.2;
    min-height: 1.75rem;
    padding: 0.2rem 0.5rem;
    border-radius: 5px;
    transition: background 0.2s cubic-bezier(0.4, 0, 0.2, 1), color 0.2s cubic-bezier(0.4, 0, 0.2, 1),
      box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;

    &:hover {
      background: hsl(var(--accent) / 0.75);
      color: hsl(var(--accent-foreground));
      transform: translateY(-0.5px);
    }

    &[data-state='open'] {
      background: hsl(var(--accent) / 0.95);
      color: hsl(var(--accent-foreground));
      box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.06);
    }

    &:active {
      transform: translateY(0);
    }
  }

  /* 右侧次级菜单：对齐 Button variant=outline size≈sm（h-9） */
  &.menubar--secondary :deep([data-radix-menubar-trigger]) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 2.25rem;
    min-height: 2.25rem;
    padding: 0 0.75rem;
    font-size: var(--header-tab-size);
    font-weight: var(--header-tab-weight);
    line-height: var(--header-tab-leading);
    letter-spacing: normal;
    text-transform: none;
    border-radius: calc(var(--radius) - 2px);
    border: 1px solid hsl(var(--border));
    background: hsl(var(--background));
    color: hsl(var(--foreground));
    box-shadow: none;
    transition: background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1), color 0.2s cubic-bezier(0.4, 0, 0.2, 1),
      border-color 0.2s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      background: hsl(var(--accent));
      color: hsl(var(--accent-foreground));
    }

    &[data-state='open'] {
      background: hsl(var(--accent));
      color: hsl(var(--accent-foreground));
    }

    &:focus-visible {
      outline: 2px solid transparent;
      outline-offset: 2px;
      box-shadow: 0 0 0 2px hsl(var(--background)), 0 0 0 4px hsl(var(--ring));
    }
  }

  :deep([data-radix-menubar-content]) {
    animation: slideDownAndFade 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  :deep([data-radix-menubar-item]) {
    border-radius: 4px;
    transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      background: hsl(var(--accent) / 0.8);
    }
  }

  :deep([data-radix-menubar-sub-trigger]) {
    border-radius: 4px;
    transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      background: hsl(var(--accent) / 0.8);
    }
  }
}

kbd {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  min-width: 1.5rem;
  height: 1.375rem;
  border: 1px solid hsl(var(--border));
  background: linear-gradient(to bottom, hsl(var(--muted)), hsl(var(--muted) / 0.9));
  padding: 0 0.375rem;
  border-radius: 4px;
  font-size: 0.6875rem;
  font-weight: 600;
  line-height: 1;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace;
  box-shadow: 0 1px 0 hsl(var(--border)), inset 0 0.5px 0 hsl(var(--background));
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

@keyframes slideDownAndFade {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Below Tailwind `md` (768px): stack legacy menubar layouts only (desktop secondary uses md:flex parent) */
@media (max-width: 767px) {
  .menubar:not(.shrink-0) {
    flex-direction: column;
    align-items: flex-start;
    width: 100%;

    > * {
      width: 100%;
      justify-content: flex-start;
    }
  }
}
</style>
