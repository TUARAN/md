<script setup lang="ts">
import { BadgeDollarSign, BarChart3, BookOpen, ChevronRight, Code2, Database, Download, FileText, GitBranch, Github, Megaphone, Menu, Repeat2, ScrollText, Settings, Sparkles, Target, TrendingUp } from 'lucide-vue-next'
import { computed, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useEditorHeaderDialogs } from '@/composables/useEditorHeaderDialogs'
import { EDITOR_WECHAT_COPY_KEY } from '@/composables/useEditorWechatCopy'
import { getDataAcquisitionNavUrl, getSyncblogPluginReleaseUrl } from '@/constants/branding'
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

/** 当前 workflow 步骤 id,由路由名派生(代替老的 ui.workflowAppPage 状态) */
const workflowAppPage = computed(() => String(route.name ?? `sync`))
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
 * 顶栏导航分三条线:
 * - 文章线:素材、写作、排版发布、矩阵分发、数据复盘
 * - 小册线:成体系内容产品,从选题到销售运营再到复盘闭环
 * - 仓库线:围绕 GitHub 项目从选题、仓库策划、代码脚手架到运营迭代
 */
const articleWorkflowSteps = [
  { id: `data` as const, label: `找素材`, icon: Database, routeName: `data` },
  { id: `creation` as const, label: `写文章`, icon: Sparkles, routeName: `creation` },
  { id: `sync` as const, label: `排版发布`, icon: FileText, routeName: `sync` },
  { id: `distribution` as const, label: `矩阵管理`, icon: Megaphone, routeName: `distribution` },
  { id: `stats` as const, label: `数据复盘`, icon: BarChart3, routeName: `stats` },
] as const

const bookletWorkflowSteps = [
  { id: `booklet-research` as const, label: `调研选题`, icon: Target, routeName: `booklet-research` },
  { id: `booklet-plan` as const, label: `小册策划`, icon: BadgeDollarSign, routeName: `booklet-plan` },
  { id: `booklet-writing` as const, label: `章节生产`, icon: BookOpen, routeName: `booklet-writing` },
  { id: `booklet-operation` as const, label: `运营层`, icon: TrendingUp, routeName: `booklet-operation` },
  { id: `booklet-loop` as const, label: `闭环层`, icon: Repeat2, routeName: `booklet-loop` },
] as const

const repositoryWorkflowSteps = [
  { id: `repo-idea` as const, label: `项目选题`, icon: GitBranch, routeName: `repo-idea` },
  { id: `repo-plan` as const, label: `仓库策划`, icon: Github, routeName: `repo-plan` },
  { id: `repo-build` as const, label: `代码脚手架`, icon: Code2, routeName: `repo-build` },
  { id: `repo-operation` as const, label: `运营层`, icon: TrendingUp, routeName: `repo-operation` },
  { id: `repo-loop` as const, label: `闭环层`, icon: Repeat2, routeName: `repo-loop` },
] as const

type WorkflowStep = (typeof articleWorkflowSteps)[number] | (typeof bookletWorkflowSteps)[number] | (typeof repositoryWorkflowSteps)[number]

function openWorkflowStep(step: WorkflowStep) {
  const stepId = step.routeName
  if (stepId === `data`) {
    const url = getDataAcquisitionNavUrl()
    if (url) {
      window.open(url, `_blank`, `noopener,noreferrer`)
      return
    }
  }
  router.push({ name: stepId })
}

function isStepActive(step: WorkflowStep) {
  return workflowAppPage.value === step.routeName
}

function openStep(step: WorkflowStep) {
  openWorkflowStep(step)
}

function openChangelog() {
  router.push({ name: `changelog` })
}

function openSettings() {
  router.push({ name: `settings` })
}

/**
 * 「下载发布插件」入口：新开 SyncBlog 发布插件 release 页。
 * 这里不直接 trigger zip 下载——release zip 名带版本号，没有稳定 latest 直链；
 * 用户也常需要看 release notes（兼容性、新平台支持）再决定是否升级。
 */
function openPluginDownload() {
  window.open(getSyncblogPluginReleaseUrl(), `_blank`, `noopener,noreferrer`)
}
</script>

<template>
  <header class="header-container relative flex min-h-[7.75rem] flex-col gap-1 px-3 py-2 md:min-h-[8rem] md:px-5">
    <!-- 桌面端：三条线分行，避免把小册/仓库误接到文章发布流程后面。 -->
    <div class="hidden w-full min-w-0 items-center gap-2 pr-28 md:flex">
      <span class="workflow-lane-label workflow-lane-label--wide">文章线</span>
      <nav
        class="step-tabs flex min-w-0 flex-1 items-center gap-1 overflow-x-auto whitespace-nowrap"
        aria-label="文章创作与分发"
      >
        <template v-for="(step, index) in articleWorkflowSteps" :key="step.id">
          <button
            type="button"
            class="step-tab relative inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md px-3 text-sm font-semibold transition-all duration-150"
            :class="isStepActive(step) ? 'step-tab--active text-foreground' : 'font-medium text-muted-foreground hover:text-foreground'"
            :aria-current="isStepActive(step) ? 'step' : undefined"
            @click="openStep(step)"
          >
            <component :is="step.icon" class="size-3.5 shrink-0" aria-hidden="true" />
            <span>{{ step.label }}</span>
          </button>
          <ChevronRight v-if="index < articleWorkflowSteps.length - 1" class="step-arrow" aria-hidden="true" />
        </template>
      </nav>
    </div>

    <div class="hidden w-full min-w-0 items-center gap-2 pr-28 md:flex">
      <span class="workflow-lane-label workflow-lane-label--wide">小册线</span>
      <nav
        class="step-tabs flex min-w-0 flex-1 items-center gap-1 overflow-x-auto whitespace-nowrap"
        aria-label="小册体系创作与分发"
      >
        <template v-for="(step, index) in bookletWorkflowSteps" :key="step.id">
          <button
            type="button"
            class="step-tab relative inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md px-3 text-sm font-semibold transition-all duration-150"
            :class="isStepActive(step) ? 'step-tab--active text-foreground' : 'font-medium text-muted-foreground hover:text-foreground'"
            :aria-current="isStepActive(step) ? 'step' : undefined"
            @click="openStep(step)"
          >
            <component :is="step.icon" class="size-3.5 shrink-0" aria-hidden="true" />
            <span>{{ step.label }}</span>
          </button>
          <ChevronRight v-if="index < bookletWorkflowSteps.length - 1" class="step-arrow" aria-hidden="true" />
        </template>
      </nav>
    </div>

    <div class="hidden w-full min-w-0 items-center gap-2 pr-28 md:flex">
      <span class="workflow-lane-label workflow-lane-label--wide">仓库线</span>
      <nav
        class="step-tabs flex min-w-0 flex-1 items-center gap-1 overflow-x-auto whitespace-nowrap"
        aria-label="GitHub 仓库创作"
      >
        <template v-for="(step, index) in repositoryWorkflowSteps" :key="step.id">
          <button
            type="button"
            class="step-tab relative inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md px-3 text-sm font-semibold transition-all duration-150"
            :class="isStepActive(step) ? 'step-tab--active text-foreground' : 'font-medium text-muted-foreground hover:text-foreground'"
            :aria-current="isStepActive(step) ? 'step' : undefined"
            @click="openStep(step)"
          >
            <component :is="step.icon" class="size-3.5 shrink-0" aria-hidden="true" />
            <span>{{ step.label }}</span>
          </button>
          <ChevronRight v-if="index < repositoryWorkflowSteps.length - 1" class="step-arrow" aria-hidden="true" />
        </template>
      </nav>
    </div>

    <!-- 移动端：三行横向滚动，右侧保留菜单。 -->
    <div class="flex w-full min-w-0 items-center justify-between gap-2 md:hidden">
      <span class="workflow-lane-label">文章</span>
      <nav
        class="step-tabs flex min-w-0 flex-1 items-center gap-1 overflow-x-auto whitespace-nowrap"
        aria-label="文章创作与分发"
      >
        <template v-for="(step, index) in articleWorkflowSteps" :key="step.id">
          <button
            type="button"
            class="step-tab relative inline-flex h-8 shrink-0 items-center gap-1 rounded-md px-2.5 text-[12px] font-medium transition-all duration-150"
            :class="isStepActive(step) ? 'step-tab--active text-foreground' : 'text-muted-foreground hover:text-foreground'"
            @click="openStep(step)"
          >
            <component :is="step.icon" class="size-3 shrink-0" aria-hidden="true" />
            <span>{{ step.label }}</span>
          </button>
          <ChevronRight v-if="index < articleWorkflowSteps.length - 1" class="step-arrow step-arrow--mobile" aria-hidden="true" />
        </template>
      </nav>

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

    <div class="flex w-full min-w-0 items-center gap-2 md:hidden">
      <span class="workflow-lane-label">小册</span>
      <nav
        class="step-tabs flex min-w-0 flex-1 items-center gap-1 overflow-x-auto whitespace-nowrap"
        aria-label="小册体系创作与分发"
      >
        <template v-for="(step, index) in bookletWorkflowSteps" :key="step.id">
          <button
            type="button"
            class="step-tab relative inline-flex h-8 shrink-0 items-center gap-1 rounded-md px-2.5 text-[12px] font-medium transition-all duration-150"
            :class="isStepActive(step) ? 'step-tab--active text-foreground' : 'text-muted-foreground hover:text-foreground'"
            @click="openStep(step)"
          >
            <component :is="step.icon" class="size-3 shrink-0" aria-hidden="true" />
            <span>{{ step.label }}</span>
          </button>
          <ChevronRight v-if="index < bookletWorkflowSteps.length - 1" class="step-arrow step-arrow--mobile" aria-hidden="true" />
        </template>
      </nav>
    </div>

    <div class="flex w-full min-w-0 items-center gap-2 md:hidden">
      <span class="workflow-lane-label">仓库</span>
      <nav
        class="step-tabs flex min-w-0 flex-1 items-center gap-1 overflow-x-auto whitespace-nowrap"
        aria-label="GitHub 仓库创作"
      >
        <template v-for="(step, index) in repositoryWorkflowSteps" :key="step.id">
          <button
            type="button"
            class="step-tab relative inline-flex h-8 shrink-0 items-center gap-1 rounded-md px-2.5 text-[12px] font-medium transition-all duration-150"
            :class="isStepActive(step) ? 'step-tab--active text-foreground' : 'text-muted-foreground hover:text-foreground'"
            @click="openStep(step)"
          >
            <component :is="step.icon" class="size-3 shrink-0" aria-hidden="true" />
            <span>{{ step.label }}</span>
          </button>
          <ChevronRight v-if="index < repositoryWorkflowSteps.length - 1" class="step-arrow step-arrow--mobile" aria-hidden="true" />
        </template>
      </nav>
    </div>

    <!-- 右侧：辅助入口 -->
    <div class="header-actions hidden shrink-0 items-center gap-1 md:flex">
      <TooltipProvider :delay-duration="200">
        <!--
          下载发布插件：跳到 SyncBlog Plugin GitHub release 页。
          位置：放在最左（日志、设置之前），新用户第一次使用就需要它。
        -->
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              class="h-8 w-8 shrink-0 text-muted-foreground/80 hover:text-foreground"
              aria-label="下载发布插件"
              @click="openPluginDownload"
            >
              <Download class="h-4 w-4" />
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
              size="icon"
              class="h-8 w-8 shrink-0 text-muted-foreground/80 hover:text-foreground"
              aria-label="更新日志"
              @click="openChangelog"
            >
              <ScrollText class="h-4 w-4" />
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
              size="icon"
              class="h-8 w-8 shrink-0 text-muted-foreground/80 hover:text-foreground"
              aria-label="设置"
              @click="openSettings"
            >
              <Settings class="h-4 w-4" />
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

.step-tabs {
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.step-arrow {
  width: 0.875rem;
  height: 0.875rem;
  flex-shrink: 0;
  color: hsl(var(--muted-foreground) / 0.48);
}

.step-arrow--mobile {
  width: 0.75rem;
  height: 0.75rem;
}

.workflow-lane-label {
  display: inline-flex;
  height: 1.5rem;
  flex-shrink: 0;
  align-items: center;
  border-radius: 999px;
  border: 1px solid hsl(var(--border) / 0.7);
  background: hsl(var(--muted) / 0.42);
  padding: 0 0.5rem;
  font-size: 0.6875rem;
  font-weight: 600;
  color: hsl(var(--muted-foreground));
}

.workflow-lane-label--wide {
  width: 3.65rem;
  justify-content: center;
}

.header-actions {
  position: absolute;
  top: 0.625rem;
  right: 1.25rem;
}

/* —— 流程步骤 Tab：低噪声活动态 —— */
.step-tab {
  border: 1px solid transparent;

  &:hover {
    border-color: hsl(var(--border) / 0.72);
    background: hsl(var(--muted) / 0.48);
  }

  &:focus-visible {
    outline: 2px solid transparent;
    outline-offset: 2px;
    box-shadow: 0 0 0 2px hsl(var(--ring) / 0.5);
  }
}

.step-tab--active {
  border-color: hsl(var(--primary) / 0.26);
  background: hsl(var(--primary) / 0.1);
  color: hsl(var(--primary));
  box-shadow: inset 0 1px 0 hsl(0 0% 100% / 0.5);
}

.step-tab--active::after {
  content: '';
  position: absolute;
  left: 4px;
  top: 50%;
  width: 2px;
  height: 1rem;
  border-radius: 999px;
  background: hsl(var(--primary));
  transform: translateY(-50%);
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
