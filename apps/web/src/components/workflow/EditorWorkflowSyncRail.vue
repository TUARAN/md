<script setup lang="ts">
import { Copy, Palette } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { inject } from 'vue'
import EditDropdown from '@/components/editor/editor-header/EditDropdown.vue'
import FileDropdown from '@/components/editor/editor-header/FileDropdown.vue'
import FormatDropdown from '@/components/editor/editor-header/FormatDropdown.vue'
import HelpDropdown from '@/components/editor/editor-header/HelpDropdown.vue'
import InsertDropdown from '@/components/editor/editor-header/InsertDropdown.vue'
import PostInfo from '@/components/editor/editor-header/PostInfo.vue'
import StyleDropdown from '@/components/editor/editor-header/StyleDropdown.vue'
import { Button } from '@/components/ui/button'
import { Menubar } from '@/components/ui/menubar'
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
</script>

<template>
  <div
    class="editor-workflow-sync-rail flex w-full min-w-0 flex-col gap-2.5 lg:max-w-none lg:items-end"
  >
    <!-- 主操作：横向排列，禁止再套 max-w-min 之类会把文字压成竖条的样式 -->
    <div class="flex w-full min-w-0 flex-wrap items-center justify-end gap-2">
      <Button
        variant="outline"
        class="h-9 shrink-0"
        type="button"
        @click="copyToWeChat"
      >
        <Copy class="mr-2 h-4 w-4" />
        <span>复制</span>
      </Button>

      <div class="shrink-0">
        <PostInfo />
      </div>

      <Button
        variant="outline"
        class="h-9 shrink-0"
        type="button"
        :class="{ 'bg-accent text-accent-foreground': isOpenRightSlider }"
        @click="isOpenRightSlider = !isOpenRightSlider"
      >
        <Palette class="mr-2 h-4 w-4" />
        <span>侧栏</span>
      </Button>
    </div>

    <!-- 次级菜单：始终横向，窄屏可横向滚动，避免竖排文字 -->
    <div
      class="sync-rail-menubar w-full min-w-0 lg:flex lg:justify-end"
      aria-label="同步与编辑菜单"
    >
      <div
        class="min-w-0 max-w-full overflow-x-auto overflow-y-hidden pb-0.5 [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border"
      >
        <div
          class="inline-flex w-max min-w-0 rounded-md border border-border/80 bg-background/95 p-0.5 dark:bg-background/80"
        >
          <Menubar
            class="menubar menubar--secondary flex h-auto flex-nowrap items-center gap-1 border-0 bg-transparent p-0 shadow-none"
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
    </div>
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
