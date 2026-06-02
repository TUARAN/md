<script setup lang="ts">
import { BarChart3, Bot, ChevronRight, Database, FileText, Megaphone, Menu, Plug, ScrollText, Settings, Sparkles } from 'lucide-vue-next'
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
import { getDataAcquisitionNavUrl } from '@/constants/branding'
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

const primaryDomains = [
  { id: `distribution` as const, label: `排版分发`, icon: FileText, routeName: `sync`, summary: `素材、创作、排版、发布` },
  { id: `growth` as const, label: `增长运营`, icon: BarChart3, routeName: `stats`, summary: `复盘、策略、运营动作` },
] as const

const distributionSteps = [
  { id: `data` as const, label: `选择素材`, icon: Database, routeName: `data` },
  { id: `creation` as const, label: `AI 创作`, icon: Sparkles, routeName: `creation` },
  { id: `import` as const, label: `外站接入`, icon: Plug, routeName: `import` },
  { id: `sync` as const, label: `排版编辑`, icon: FileText, routeName: `sync` },
] as const

const growthSteps = [
  { id: `distribution` as const, label: `数据策略`, icon: Megaphone, routeName: `distribution` },
  { id: `stats` as const, label: `数据复盘`, icon: BarChart3, routeName: `stats` },
] as const

type DistributionStep = (typeof distributionSteps)[number]
type GrowthStep = (typeof growthSteps)[number]
type RouteStep = DistributionStep | GrowthStep

const activeDomain = computed(() => {
  return workflowAppPage.value === `stats` || workflowAppPage.value === `distribution` ? `growth` : `distribution`
})

const secondarySteps = computed(() => activeDomain.value === `growth` ? growthSteps : distributionSteps)

function openWorkflowStep(stepId: RouteStep['routeName']) {
  if (stepId === `data`) {
    const url = getDataAcquisitionNavUrl()
    if (url) {
      window.open(url, `_blank`, `noopener,noreferrer`)
      return
    }
  }
  router.push({ name: stepId })
}

function isSecondaryStepActive(step: DistributionStep | GrowthStep) {
  return workflowAppPage.value === step.routeName
}

function openSecondaryStep(step: DistributionStep | GrowthStep) {
  openWorkflowStep(step.routeName)
}

function openPrimaryDomain(routeName: (typeof primaryDomains)[number]['routeName']) {
  router.push({ name: routeName })
}

function openChangelog() {
  router.push({ name: `changelog` })
}

function openSettings() {
  router.push({ name: `settings` })
}

function openAIAssistant() {
  uiStore.toggleAIDialog(true)
}
</script>

<template>
  <header class="header-container relative flex h-14 items-center gap-3 px-4 md:gap-4 md:px-5">
    <!-- 桌面：一级"上下文徽章" + 面包屑箭头 + 二级 Tab 主导航 -->
    <div class="hidden min-w-0 flex-1 items-center gap-2 md:flex">
      <div
        class="domain-switcher relative inline-flex shrink-0 items-center gap-0.5 rounded-full p-0.5"
        role="tablist"
        aria-label="业务域切换"
      >
        <button
          v-for="domain in primaryDomains"
          :key="domain.id"
          type="button"
          role="tab"
          :aria-selected="activeDomain === domain.id"
          class="domain-pill relative inline-flex min-h-7 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[12px] transition-all duration-200"
          :class="activeDomain === domain.id ? 'domain-pill--active' : 'text-muted-foreground/80 hover:text-foreground'"
          @click="openPrimaryDomain(domain.routeName)"
        >
          <component :is="domain.icon" class="size-3.5 shrink-0" aria-hidden="true" />
          <span>{{ domain.label }}</span>
        </button>
      </div>

      <ChevronRight class="size-3.5 shrink-0 text-muted-foreground/40" aria-hidden="true" />

      <nav
        class="step-tabs flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto whitespace-nowrap"
        aria-label="工作流步骤"
      >
        <button
          v-for="step in secondarySteps"
          :key="step.id"
          type="button"
          class="step-tab relative inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md px-3 text-sm font-semibold transition-all duration-200"
          :class="isSecondaryStepActive(step) ? 'step-tab--active text-foreground' : 'font-medium text-muted-foreground hover:text-foreground'"
          :aria-current="isSecondaryStepActive(step) ? 'step' : undefined"
          @click="openSecondaryStep(step)"
        >
          <component :is="step.icon" class="size-3.5 shrink-0" aria-hidden="true" />
          <span>{{ step.label }}</span>
        </button>
      </nav>
    </div>

    <!-- 移动端：Pill 切换 + 汉堡 / 第二行步骤滚动 -->
    <div class="flex min-w-0 flex-1 flex-col gap-1.5 md:hidden">
      <div class="flex min-w-0 items-center justify-between gap-2">
        <div
          class="domain-switcher relative inline-flex shrink-0 items-center gap-0.5 rounded-full p-0.5"
          role="tablist"
          aria-label="业务域切换"
        >
          <button
            v-for="domain in primaryDomains"
            :key="domain.id"
            type="button"
            role="tab"
            :aria-selected="activeDomain === domain.id"
            class="domain-pill relative inline-flex min-h-7 shrink-0 items-center gap-1 rounded-full px-2.5 text-[11px] font-medium transition-all duration-200"
            :class="activeDomain === domain.id ? 'domain-pill--active' : 'text-muted-foreground hover:text-foreground'"
            @click="openPrimaryDomain(domain.routeName)"
          >
            <component :is="domain.icon" class="size-3.5 shrink-0" aria-hidden="true" />
            <span>{{ domain.label }}</span>
          </button>
        </div>

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

      <nav
        class="step-tabs flex min-w-0 items-center gap-1 overflow-x-auto whitespace-nowrap"
        aria-label="工作流步骤"
      >
        <button
          v-for="step in secondarySteps"
          :key="step.id"
          type="button"
          class="step-tab relative inline-flex h-8 shrink-0 items-center gap-1 rounded-md px-2.5 text-[12px] font-medium transition-all duration-200"
          :class="isSecondaryStepActive(step) ? 'step-tab--active text-foreground' : 'text-muted-foreground hover:text-foreground'"
          @click="openSecondaryStep(step)"
        >
          <component :is="step.icon" class="size-3 shrink-0" aria-hidden="true" />
          <span>{{ step.label }}</span>
        </button>
      </nav>
    </div>

    <!-- 右侧：辅助入口 -->
    <div class="hidden shrink-0 items-center gap-1 md:flex">
      <TooltipProvider :delay-duration="200">
        <!-- AI 助手：用渐变色与其他灰阶辅助按钮区隔，提示这是 AI 功能 -->
        <Tooltip>
          <TooltipTrigger as-child>
            <button
              type="button"
              class="ai-assistant-pill inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium text-white transition-all"
              aria-label="AI 助手"
              @click="openAIAssistant"
            >
              <Bot class="size-3.5" />
              <span>助手</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" :side-offset="6" class="text-xs">
            打开 AI 助手
          </TooltipContent>
        </Tooltip>

        <div class="mx-1 h-4 w-px bg-border/60" aria-hidden="true" />

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

  background: hsl(var(--background) / 0.95);
  border-bottom: 1px solid hsl(var(--border));
  backdrop-filter: blur(12px);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 50;
}

.step-tabs {
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

/* —— 一级"上下文徽章"：低对比，不与二级 Tab 抢主角 —— */
.domain-switcher {
  background: hsl(var(--muted) / 0.45);
  box-shadow: inset 0 0 0 1px hsl(var(--border) / 0.5);
  backdrop-filter: blur(6px);
}

.domain-pill {
  &:focus-visible {
    outline: 2px solid transparent;
    outline-offset: 2px;
    box-shadow: 0 0 0 2px hsl(var(--ring) / 0.5);
  }
}

.domain-pill--active {
  color: hsl(var(--foreground));
  background: hsl(var(--background));
  box-shadow: 0 1px 2px 0 hsl(var(--foreground) / 0.08), inset 0 0 0 1px hsl(var(--border) / 0.5);
}

/* —— AI 助手按钮：蓝紫渐变 + 软投影，提示这是 AI 功能 —— */
.ai-assistant-pill {
  background: linear-gradient(135deg, hsl(217 91% 60%) 0%, hsl(262 83% 65%) 100%);
  box-shadow: 0 1px 2px 0 hsl(217 91% 50% / 0.25), 0 4px 10px -2px hsl(217 91% 50% / 0.2),
    inset 0 1px 0 0 hsl(0 0% 100% / 0.18);
  transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-0.5px);
    box-shadow: 0 2px 4px 0 hsl(217 91% 50% / 0.3), 0 6px 14px -2px hsl(217 91% 50% / 0.28),
      inset 0 1px 0 0 hsl(0 0% 100% / 0.22);
  }

  &:active {
    transform: translateY(0);
  }

  &:focus-visible {
    outline: 2px solid hsl(var(--ring));
    outline-offset: 2px;
  }
}

/* —— 二级 Tab：玻璃高亮 + 渐变下划线 —— */
.step-tab {
  &:hover {
    background: hsl(var(--accent) / 0.45);
  }

  &:focus-visible {
    outline: 2px solid transparent;
    outline-offset: 2px;
    box-shadow: 0 0 0 2px hsl(var(--ring) / 0.5);
  }
}

.step-tab--active {
  background: linear-gradient(180deg, hsl(var(--accent) / 0.7) 0%, hsl(var(--accent) / 0.25) 100%);
  box-shadow: inset 0 0 0 1px hsl(var(--border) / 0.5), 0 1px 0 0 hsl(var(--background) / 0.4);
  backdrop-filter: blur(6px) saturate(140%);
}

.step-tab--active::after {
  content: '';
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: -1px;
  height: 2px;
  border-radius: 2px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    hsl(var(--foreground) / 0.85) 25%,
    hsl(var(--foreground) / 0.85) 75%,
    transparent 100%
  );
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
