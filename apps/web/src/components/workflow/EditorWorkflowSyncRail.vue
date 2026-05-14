<script setup lang="ts">
import { CheckCircle2, ClipboardCheck, Copy, Palette, RotateCcw } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { computed, inject, ref } from 'vue'
import EditDropdown from '@/components/editor/editor-header/EditDropdown.vue'
import FileDropdown from '@/components/editor/editor-header/FileDropdown.vue'
import FormatDropdown from '@/components/editor/editor-header/FormatDropdown.vue'
import HelpDropdown from '@/components/editor/editor-header/HelpDropdown.vue'
import InsertDropdown from '@/components/editor/editor-header/InsertDropdown.vue'
import StyleDropdown from '@/components/editor/editor-header/StyleDropdown.vue'
import { Button } from '@/components/ui/button'
import { Menubar } from '@/components/ui/menubar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useEditorHeaderDialogs } from '@/composables/useEditorHeaderDialogs'
import { EDITOR_WECHAT_COPY_KEY } from '@/composables/useEditorWechatCopy'
import { useUIStore } from '@/stores/ui'

const wechatCopy = inject(EDITOR_WECHAT_COPY_KEY, null)
const uiStore = useUIStore()
const { isOpenRightSlider } = storeToRefs(uiStore)

const {
  handleOpenAbout,
  handleOpenFund,
  handleOpenEditorState,
  handleOpenMarkdownHelp,
} = useEditorHeaderDialogs()

function handleCopy(mode: string) {
  wechatCopy?.handleCopy(mode)
}

function copyToWeChat() {
  wechatCopy?.copyToWeChat()
}

// ==================== 发布前检查 ====================
const checklistItems = [
  { key: `image`, label: `图片`, hint: `图片已上传到图床、外链可访问；目标平台不会再次压缩。` },
  { key: `link`, label: `外链`, hint: `所有外部链接打开正常，没有 404 或被墙的页面。` },
  { key: `code`, label: `代码块`, hint: `代码语言高亮、行号、换行符在预览里没有错位。` },
  { key: `headings`, label: `标题层级`, hint: `H1-H4 嵌套合理，没有跳级；目录正确折叠。` },
  { key: `source`, label: `来源`, hint: `保留了事实出处与原文链接，方便后续核验。` },
] as const

type ChecklistKey = (typeof checklistItems)[number]['key']
const checklistState = ref<Record<ChecklistKey, boolean>>({
  image: false,
  link: false,
  code: false,
  headings: false,
  source: false,
})

const checklistDoneCount = computed(() =>
  Object.values(checklistState.value).filter(Boolean).length,
)
const checklistAllDone = computed(() => checklistDoneCount.value === checklistItems.length)

function resetChecklist() {
  for (const item of checklistItems)
    checklistState.value[item.key] = false
}
</script>

<template>
  <div class="editor-workflow-sync-rail flex w-full flex-wrap items-center justify-start gap-x-2 gap-y-2 lg:justify-end">
    <Button
      variant="outline"
      class="h-9 shrink-0"
      type="button"
      @click="copyToWeChat"
    >
      <Copy class="mr-2 h-4 w-4" />
      <span>复制</span>
    </Button>

    <Popover>
      <PopoverTrigger as-child>
        <Button
          variant="outline"
          class="h-9 shrink-0"
          type="button"
          :class="{ 'bg-accent text-accent-foreground': checklistAllDone }"
        >
          <ClipboardCheck class="mr-2 h-4 w-4" />
          <span>发布前检查</span>
          <span class="text-muted-foreground ml-1.5 text-[11px] tabular-nums">
            {{ checklistDoneCount }}/{{ checklistItems.length }}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" class="w-80 p-3">
        <div class="flex items-center justify-between gap-2 pb-2">
          <p class="text-xs font-semibold text-foreground">
            发布前 checklist
          </p>
          <button
            class="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-[11px] underline-offset-4 hover:underline"
            type="button"
            @click="resetChecklist"
          >
            <RotateCcw class="size-3" />
            重置
          </button>
        </div>
        <ul class="space-y-1.5">
          <li v-for="item in checklistItems" :key="item.key">
            <label
              class="hover:bg-muted/40 flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 transition-colors"
            >
              <input
                v-model="checklistState[item.key]"
                type="checkbox"
                class="mt-0.5 size-3.5 shrink-0 accent-primary"
              >
              <span class="min-w-0 flex-1">
                <span class="block text-xs font-medium text-foreground">{{ item.label }}</span>
                <span class="text-muted-foreground mt-0.5 block text-[11px] leading-relaxed">
                  {{ item.hint }}
                </span>
              </span>
            </label>
          </li>
        </ul>
        <p
          v-if="checklistAllDone"
          class="text-primary mt-2 inline-flex items-center gap-1 text-[11px] font-medium"
        >
          <CheckCircle2 class="size-3.5" />
          5 项已全部确认，可以放心粘贴到目标平台。
        </p>
      </PopoverContent>
    </Popover>

    <div class="hidden min-w-0 md:block md:max-w-[min(100%,24rem)]">
      <PostInfo class="w-full" />
    </div>

    <Button
      variant="outline"
      class="h-9 shrink-0"
      type="button"
      :class="{ 'bg-accent text-accent-foreground': isOpenRightSlider }"
      @click="isOpenRightSlider = !isOpenRightSlider"
    >
      <Palette class="mr-2 h-4 w-4" />
      <span>样式</span>
    </Button>

    <div
      class="sync-rail-menubar hidden min-w-0 w-full md:block md:w-fit md:max-w-full md:shrink-0"
      aria-label="同步与编辑菜单"
    >
      <div
        class="w-fit max-w-full rounded-lg border border-border bg-background/80 p-0.5 backdrop-blur-sm"
      >
        <Menubar
          class="menubar menubar--secondary flex h-auto max-w-full min-w-0 flex-row flex-wrap items-center gap-1 border-0 bg-transparent p-0 shadow-none"
        >
          <FileDropdown @open-editor-state="handleOpenEditorState" />
          <EditDropdown @copy="handleCopy" />
          <FormatDropdown />
          <InsertDropdown />
          <StyleDropdown />
          <HelpDropdown
            @open-about="handleOpenAbout"
            @open-fund="handleOpenFund"
            @open-markdown-help="handleOpenMarkdownHelp"
          />
        </Menubar>
      </div>
    </div>

    <p class="w-full basis-full text-[11px] leading-relaxed text-muted-foreground md:hidden">
      更多文件 / 编辑 / 格式菜单请使用顶部「菜单」按钮。
    </p>
  </div>
</template>

<style lang="less" scoped>
/* 与 editor-header 中 menubar--secondary 对齐（略收窄以适应侧栏） */
.menubar {
  user-select: none;

  &.menubar--secondary :deep([data-radix-menubar-trigger]) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: auto;
    min-width: 2.25rem;
    height: 2.25rem;
    min-height: 2.25rem;
    padding: 0 0.75rem;
    font-size: 0.875rem;
    font-weight: 500;
    line-height: 1.25;
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
</style>
