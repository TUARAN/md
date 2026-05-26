<script setup lang="ts">
import { BarChart3, Database, IdCard, Megaphone, Menu, PenLine, RefreshCw } from 'lucide-vue-next'
import { computed, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
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
  { id: `data` as const, label: `数据获取`, icon: Database, phase: `主链路` },
  { id: `creation` as const, label: `风格二创`, icon: PenLine, phase: `主链路` },
  { id: `sync` as const, label: `内容同步`, icon: RefreshCw, phase: `主链路` },
  { id: `distribution` as const, label: `宣发活跃`, icon: Megaphone, phase: `主链路` },
  { id: `stats` as const, label: `闭环汇报`, icon: BarChart3, phase: `后续`, comingSoon: true },
]

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
</script>

<template>
  <header
    class="header-container h-12 flex items-center justify-between gap-3 px-4 md:px-5 relative"
  >
    <!-- 桌面工作流导航：直接 6 个 step,无前缀,无装饰 -->
    <nav
      class="workflow-nav hidden min-w-0 flex-1 md:flex items-center gap-1 overflow-x-auto whitespace-nowrap"
      aria-label="工作流"
    >
      <button
        v-for="step in workflowSteps"
        :key="step.id"
        type="button"
        class="workflow-step inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors"
        :class="[
          workflowAppPage === step.id
            ? 'workflow-step--current bg-primary/10 text-primary'
            : step.comingSoon
              ? 'workflow-step--pending text-muted-foreground/55 hover:bg-muted/40'
              : 'workflow-step--inactive text-muted-foreground hover:bg-muted/60 hover:text-foreground',
        ]"
        :title="step.comingSoon ? `${step.label}：后续接入` : `${step.phase}：${step.label}`"
        :aria-current="workflowAppPage === step.id ? 'step' : undefined"
        @click="openWorkflowStep(step.id)"
      >
        <component
          :is="step.icon"
          class="size-4 shrink-0"
          aria-hidden="true"
        />
        <span class="truncate">{{ step.label }}</span>
        <span
          v-if="step.comingSoon"
          class="workflow-step-badge"
        >后续</span>
      </button>
    </nav>

    <!-- 移动端：工作流横向滚 + 汉堡菜单 -->
    <div class="flex min-w-0 flex-1 items-center gap-2 md:hidden">
      <nav
        class="workflow-nav-mobile flex min-w-0 flex-1 items-center gap-1 overflow-x-auto whitespace-nowrap [-ms-overflow-style:none]"
        aria-label="工作流"
      >
        <button
          v-for="step in workflowSteps"
          :key="step.id"
          type="button"
          class="workflow-step inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors"
          :class="[
            workflowAppPage === step.id
              ? 'workflow-step--current bg-primary/10 text-primary'
              : step.comingSoon
                ? 'workflow-step--pending text-muted-foreground/55'
                : 'workflow-step--inactive text-muted-foreground',
          ]"
          :title="step.comingSoon ? `${step.label}：后续接入` : `${step.phase}：${step.label}`"
          :aria-current="workflowAppPage === step.id ? 'step' : undefined"
          @click="openWorkflowStep(step.id)"
        >
          <component
            :is="step.icon"
            class="size-3.5 shrink-0"
            aria-hidden="true"
          />
          <span class="max-w-[3.25rem] truncate">{{ step.label }}</span>
        </button>
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

    <div class="hidden shrink-0 items-center gap-2 md:flex">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        class="h-8 shrink-0 text-muted-foreground hover:text-foreground"
        @click="openCreatorCard"
      >
        <IdCard class="mr-1.5 h-4 w-4" />
        创作名片
      </Button>
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

.workflow-step {
  border: 0;
  cursor: pointer;
  font-family: inherit;
  letter-spacing: normal;
  text-transform: none;

  &:focus-visible {
    outline: 2px solid hsl(var(--ring));
    outline-offset: 2px;
  }
}

.workflow-step-badge {
  border-radius: 999px;
  padding: 0 0.375rem;
  font-size: 0.625rem;
  line-height: 1rem;
  color: hsl(var(--muted-foreground));
  background: hsl(var(--muted) / 0.6);
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
