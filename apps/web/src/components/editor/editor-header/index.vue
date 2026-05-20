<script setup lang="ts">
import { BarChart3, ChevronRight, Database, IdCard, Megaphone, Menu, PenLine, RefreshCw, Users } from 'lucide-vue-next'
import { inject, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { useEditorHeaderDialogs } from '@/composables/useEditorHeaderDialogs'
import { EDITOR_WECHAT_COPY_KEY } from '@/composables/useEditorWechatCopy'
import { APP_HEADER_BRAND_LINE, getDataAcquisitionNavUrl } from '@/constants/branding'
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

const { workflowAppPage } = storeToRefs(uiStore)
const { setWorkflowAppPage } = uiStore
const isContentFactoryExpanded = ref(true)

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
  { id: `matrix` as const, label: `平台矩阵`, icon: Users, phase: `主链路` },
  { id: `distribution` as const, label: `宣发活跃`, icon: Megaphone, phase: `建设中` },
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
  setWorkflowAppPage(stepId)
}

function toggleContentFactory() {
  isContentFactoryExpanded.value = !isContentFactoryExpanded.value
}

function openCreatorCard() {
  window.open(CREATOR_CARD_ROUTE, `_blank`, `noopener,noreferrer`)
}
</script>

<template>
  <header
    class="header-container h-15 flex flex-wrap items-center justify-between px-5 relative"
  >
    <div class="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-2 md:gap-x-4 md:gap-y-2">
      <!-- 工作流导航（桌面）：一级 — 数据获取 → … → 内容同步（当前）→ … -->
      <div
        class="workflow-nav-strip hidden min-w-0 shrink md:flex md:items-center gap-1 rounded-xl bg-muted/30 px-2 py-1"
      >
        <button
          type="button"
          class="inline-flex shrink-0 items-center gap-1 rounded-sm border-0 bg-transparent p-0 text-base font-semibold text-foreground shadow-none transition-colors hover:text-primary"
          :aria-expanded="isContentFactoryExpanded"
          aria-controls="workflow-nav-desktop"
          @click="toggleContentFactory"
        >
          <span>内容工厂</span>
          <ChevronRight
            class="size-4 transition-transform"
            :class="{ 'rotate-180': !isContentFactoryExpanded }"
            aria-hidden="true"
          />
        </button>
        <nav
          v-show="isContentFactoryExpanded"
          id="workflow-nav-desktop"
          class="workflow-nav flex min-w-0 items-center gap-0.5 overflow-x-auto whitespace-nowrap [-ms-overflow-style:none]"
          aria-label="工作流"
        >
          <template v-for="(step, index) in workflowSteps" :key="step.id">
            <span
              v-if="index > 0"
              class="workflow-chevron shrink-0 text-muted-foreground"
              aria-hidden="true"
            >→</span>
            <button
              type="button"
              class="workflow-step inline-flex shrink-0 items-center gap-1 m-0 appearance-none rounded-none border-0 bg-transparent p-0 shadow-none transition-colors" :class="[
                workflowAppPage === step.id
                  ? 'workflow-step--current text-primary underline decoration-primary/45 underline-offset-2'
                  : step.comingSoon
                    ? 'workflow-step--pending text-muted-foreground/60 hover:bg-transparent hover:text-muted-foreground'
                    : 'workflow-step--inactive text-muted-foreground hover:bg-transparent hover:text-foreground',
              ]"
              :title="step.comingSoon ? `${step.label}：后续接入` : `${step.phase}：${step.label}`"
              :aria-current="workflowAppPage === step.id ? 'step' : undefined"
              @click="openWorkflowStep(step.id)"
            >
              <component
                :is="step.icon"
                class="size-4 shrink-0" :class="[
                  workflowAppPage === step.id ? 'text-primary' : 'text-muted-foreground',
                ]"
              />
              <span class="max-w-[5.5rem] truncate sm:max-w-none">{{ step.label }}</span>
              <span
                v-if="step.comingSoon"
                class="workflow-step-badge"
              >后续</span>
            </button>
          </template>
        </nav>
      </div>

      <!-- 移动端：工作流优先，其次汉堡菜单 -->
      <div class="flex min-w-0 flex-1 items-center gap-2 md:hidden">
        <nav
          class="workflow-nav-mobile flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto whitespace-nowrap rounded-xl bg-muted/30 px-2 py-1 [-ms-overflow-style:none]"
          aria-label="工作流"
        >
          <button
            type="button"
            class="inline-flex shrink-0 items-center gap-1 rounded-sm border-0 bg-transparent p-0 text-base font-semibold text-foreground shadow-none transition-colors hover:text-primary"
            :aria-expanded="isContentFactoryExpanded"
            aria-controls="workflow-nav-mobile"
            @click="toggleContentFactory"
          >
            <span>内容工厂</span>
            <ChevronRight
              class="size-4 transition-transform"
              :class="{ 'rotate-180': !isContentFactoryExpanded }"
              aria-hidden="true"
            />
          </button>
          <template v-for="(step, index) in workflowSteps" :key="step.id">
            <span
              v-if="isContentFactoryExpanded && index > 0"
              class="workflow-chevron shrink-0 text-muted-foreground"
              aria-hidden="true"
            >→</span>
            <button
              v-show="isContentFactoryExpanded"
              type="button"
              class="workflow-step inline-flex shrink-0 items-center gap-1 m-0 appearance-none rounded-none border-0 bg-transparent p-0 shadow-none transition-colors" :class="[
                workflowAppPage === step.id
                  ? 'workflow-step--current text-primary underline decoration-primary/45 underline-offset-2'
                  : step.comingSoon
                    ? 'workflow-step--pending text-muted-foreground/60 hover:bg-transparent hover:text-muted-foreground'
                    : 'workflow-step--inactive text-muted-foreground hover:bg-transparent hover:text-foreground',
              ]"
              :title="step.comingSoon ? `${step.label}：后续接入` : `${step.phase}：${step.label}`"
              :aria-current="workflowAppPage === step.id ? 'step' : undefined"
              @click="openWorkflowStep(step.id)"
            >
              <component
                :is="step.icon"
                class="size-4 shrink-0" :class="[
                  workflowAppPage === step.id ? 'text-primary' : 'text-muted-foreground',
                ]"
              />
              <span class="max-w-[3.25rem] truncate">{{ step.label }}</span>
              <span
                v-if="step.comingSoon"
                class="workflow-step-badge hidden sm:inline"
              >后续</span>
            </button>
          </template>
        </nav>
        <Menubar class="menubar shrink-0 border-0 p-0">
          <MenubarMenu>
            <MenubarTrigger
              class="workflow-mobile-menu-trigger inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-border/40 bg-transparent p-0 text-muted-foreground shadow-none ring-offset-background transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=open]:bg-muted/50 data-[state=open]:text-foreground"
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
    </div>

    <div class="ml-auto hidden min-w-0 shrink-0 items-center gap-3 md:flex">
      <Button
        type="button"
        variant="outline"
        size="sm"
        class="h-8 shrink-0"
        @click="openCreatorCard"
      >
        <IdCard class="mr-2 h-4 w-4" />
        创作名片
      </Button>

      <!-- 右上角品牌一行艺术字（非按钮、无衬底；小屏省略） -->
      <p
        class="header-brand-slogan pointer-events-none m-0 max-w-[min(100%,36rem)] shrink truncate text-right"
        :title="`“${APP_HEADER_BRAND_LINE}”`"
      >
        <span class="header-brand-slogan__line">“{{ APP_HEADER_BRAND_LINE }}”</span>
      </p>
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

  @media (max-width: 768px) {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}

/** 顶栏右上角：单行艺术字（渐变 + 衬线气质，无框线、无按钮感） */
.header-brand-slogan {
  line-height: 1.25;
}

.header-brand-slogan__line {
  display: inline;
  /* Two identical halves (0–50% / 50–100%) so background-position can loop without a seam */
  background-image: linear-gradient(
    100deg,
    hsl(var(--primary) / 0.72) 0%,
    hsl(var(--primary)) 11%,
    hsl(var(--foreground) / 0.82) 20%,
    hsl(var(--foreground) / 0.96) 25%,
    hsl(var(--foreground) / 0.82) 30%,
    hsl(var(--primary)) 39%,
    hsl(var(--primary) / 0.72) 50%,
    hsl(var(--primary) / 0.72) 50%,
    hsl(var(--primary)) 61%,
    hsl(var(--foreground) / 0.82) 70%,
    hsl(var(--foreground) / 0.96) 75%,
    hsl(var(--foreground) / 0.82) 80%,
    hsl(var(--primary)) 89%,
    hsl(var(--primary) / 0.72) 100%
  );
  background-size: 200% 100%;
  background-position: 0% 50%;
  background-repeat: no-repeat;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  /* 偏书面/刊头气质的衬线（系统有可则用，无则优雅回退） */
  font-family: 'Songti SC', 'STSong', 'Noto Serif SC', 'Source Han Serif SC', ui-serif, Georgia, serif;
  font-size: clamp(0.8125rem, 0.75rem + 0.5vw, 1rem);
  font-weight: 600;
  letter-spacing: 0.13em;
  font-feature-settings: 'kern' 1;
  filter: drop-shadow(0 0 18px hsl(var(--primary) / 0.18));
  animation: header-brand-sweep 5s linear infinite;
}

@media (prefers-reduced-motion: reduce) {
  .header-brand-slogan__line {
    animation: none;
    background-image: linear-gradient(
      100deg,
      hsl(var(--primary)) 0%,
      hsl(var(--primary) / 0.78) 45%,
      hsl(var(--foreground) / 0.72) 100%
    );
    background-size: 100% 100%;
    background-position: 0% 50%;
  }
}

@keyframes header-brand-sweep {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 100% 50%;
  }
}

.workflow-nav-mobile {
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.workflow-chevron {
  opacity: 0.5;
}

.workflow-step {
  border: 0;
  background: transparent;
  font-size: var(--header-tab-size);
  font-weight: var(--header-tab-weight);
  line-height: var(--header-tab-leading);
  letter-spacing: normal;
  text-transform: none;

  &:is(button) {
    cursor: pointer;
    font-family: inherit;
    font-size: var(--header-tab-size);
    font-weight: var(--header-tab-weight);
    line-height: var(--header-tab-leading);
  }

  &--inactive:is(button):hover {
    background: transparent;
  }

  &--pending {
    opacity: 0.72;
  }

  &--inactive:is(button):focus-visible {
    outline: 2px solid hsl(var(--ring));
    outline-offset: 2px;
  }
}

.workflow-step-badge {
  border-radius: 999px;
  border: 1px solid hsl(var(--border));
  padding: 0 0.25rem;
  font-size: 0.625rem;
  line-height: 1rem;
  color: hsl(var(--muted-foreground));
  background: hsl(var(--muted) / 0.45);
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
