<script setup lang="ts">
import { BarChart3, Database, FileText, IdCard, Megaphone, Menu, Plug, ScrollText, Settings, Sparkles } from 'lucide-vue-next'
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
import { CREATOR_CARD_ROUTE } from '@/stores/socialAccounts'
import { useUIStore } from '@/stores/ui'
import EditDropdown from './EditDropdown.vue'
import FileDropdown from './FileDropdown.vue'
import FormatDropdown from './FormatDropdown.vue'
import HelpDropdown from './HelpDropdown.vue'
import InsertDropdown from './InsertDropdown.vue'
import MarkdownHelpDialog from './MarkdownHelpDialog.vue'
import StyleDropdown from './StyleDropdown.vue'
import WorkflowNavStep from './WorkflowNavStep.vue'

const wechatCopy = inject(EDITOR_WECHAT_COPY_KEY, null)

const uiStore = useUIStore()

const router = useRouter()
const route = useRoute()

/** 当前 workflow 步骤 id,由路由名派生(代替老的 ui.workflowAppPage 状态) */
const workflowAppPage = computed(() => String(route.name ?? `sync`))

const {
  aboutDialogVisible,
  fundDialogVisible,
  editorStateDialogVisible,
  markdownHelpDialogVisible,
  handleOpenAbout,
  handleOpenFund,
  handleOpenEditorState,
  handleOpenMarkdownHelp,
} = useEditorHeaderDialogs()

function handleCopy(mode: string) {
  wechatCopy?.handleCopy(mode)
}

const workflowSteps = [
  { id: `sync` as const, label: `排版分发`, icon: FileText, phase: `核心工作`, comingSoon: false },
  { id: `stats` as const, label: `增长运营`, icon: BarChart3, phase: `Pro 增值`, comingSoon: false },
  { id: `distribution` as const, label: `分发控制台`, icon: Megaphone, phase: `执行面板`, comingSoon: false },
  { id: `creation` as const, label: `AI 改写`, icon: Sparkles, phase: `辅助工具`, comingSoon: false },
  { id: `data` as const, label: `选题素材`, icon: Database, phase: `内容准备`, comingSoon: false },
]

const primarySteps = workflowSteps.slice(0, 2)
const helperSteps = workflowSteps.slice(2)

function openWorkflowStep(stepId: (typeof workflowSteps)[number]['id']) {
  if (stepId === `data`) {
    const url = getDataAcquisitionNavUrl()
    if (url) {
      window.open(url, `_blank`, `noopener,noreferrer`)
      return
    }
  }
  router.push({ name: stepId })
}

function openCreatorCard() {
  window.open(CREATOR_CARD_ROUTE, `_blank`, `noopener,noreferrer`)
}

function openChangelog() {
  router.push({ name: `changelog` })
}

function openSettings() {
  router.push({ name: `settings` })
}
</script>

<template>
  <header
    class="header-container relative flex min-h-14 items-center justify-between gap-3 px-4 md:px-5"
  >
    <div class="brand-lockup hidden min-w-[14rem] shrink-0 flex-col leading-tight xl:flex">
      <span class="text-sm font-semibold text-foreground">Syncblog 创作工作台</span>
      <span class="mt-0.5 text-[11px] text-muted-foreground">排版分发，再做增长运营</span>
    </div>

    <!-- 桌面主导航：用用户成果命名，而不是内部流程词 -->
    <nav
      class="workflow-nav hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto whitespace-nowrap md:flex"
      aria-label="创作工作台"
    >
      <div
        class="workflow-primary inline-flex shrink-0 items-center gap-1 rounded-lg border border-border/70 bg-muted/35 p-1"
        title="排版分发与增长运营"
      >
        <template v-for="step in primarySteps" :key="step.id">
          <WorkflowNavStep
            :label="step.label"
            :icon="step.icon"
            :phase="step.phase"
            :coming-soon="step.comingSoon"
            :current="workflowAppPage === step.id"
            @select="openWorkflowStep(step.id)"
          />
        </template>
      </div>
    </nav>

    <!-- 移动端：工作流横向滚 + 汉堡菜单 -->
    <div class="flex min-w-0 flex-1 items-center gap-2 md:hidden">
      <nav
        class="workflow-nav-mobile flex min-w-0 flex-1 items-center gap-1 overflow-x-auto whitespace-nowrap [-ms-overflow-style:none]"
        aria-label="创作工作台"
      >
        <div class="workflow-group inline-flex shrink-0 items-center gap-0.5 rounded-md border border-border/60 bg-muted/30 px-0.5">
          <template v-for="step in primarySteps" :key="step.id">
            <WorkflowNavStep
              dense
              :label="step.label"
              :icon="step.icon"
              :phase="step.phase"
              :coming-soon="step.comingSoon"
              :current="workflowAppPage === step.id"
              @select="openWorkflowStep(step.id)"
            />
          </template>
        </div>
      </nav>
      <Menubar class="menubar shrink-0 border-0 p-0">
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
            <HelpDropdown :as-sub="true" @open-about="handleOpenAbout" @open-fund="handleOpenFund" @open-markdown-help="handleOpenMarkdownHelp" />
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </div>

    <!-- 右侧：账户 + 次级工具。视觉权重 登录(primary) >> 工具(icon-only ghost) -->
    <div class="hidden shrink-0 items-center gap-1 md:flex">
      <TooltipProvider :delay-duration="200">
        <!-- 次级工具组：icon-only,弱化到几乎只是装饰 -->
        <div class="flex items-center gap-0.5 text-muted-foreground/70">
          <Tooltip v-for="step in helperSteps" :key="step.id">
            <TooltipTrigger as-child>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                class="h-8 w-8 shrink-0 hover:text-foreground"
                :aria-label="step.label"
                @click="openWorkflowStep(step.id)"
              >
                <component :is="step.icon" class="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" :side-offset="6" class="text-xs">
              {{ step.label }}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                class="h-8 w-8 shrink-0 hover:text-foreground"
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
                class="h-8 w-8 shrink-0 hover:text-foreground"
                aria-label="创作名片"
                @click="openCreatorCard"
              >
                <IdCard class="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" :side-offset="6" class="text-xs">
              创作名片
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger as-child>
              <RouterLink
                to="/docs/import"
                target="_blank"
                class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
                aria-label="开发者接入文档"
              >
                <Plug class="h-4 w-4" />
              </RouterLink>
            </TooltipTrigger>
            <TooltipContent side="bottom" :side-offset="6" class="text-xs">
              开发者接入
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              class="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
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
  <FundDialog :visible="fundDialogVisible" @close="fundDialogVisible = false" />
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

.workflow-nav,
.workflow-nav-mobile {
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
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
