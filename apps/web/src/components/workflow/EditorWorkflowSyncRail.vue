<script setup lang="ts">
import { Copy, Palette } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { inject } from 'vue'
import EditDropdown from '@/components/editor/editor-header/EditDropdown.vue'
import FileDropdown from '@/components/editor/editor-header/FileDropdown.vue'
import FormatDropdown from '@/components/editor/editor-header/FormatDropdown.vue'
import HelpDropdown from '@/components/editor/editor-header/HelpDropdown.vue'
import InsertDropdown from '@/components/editor/editor-header/InsertDropdown.vue'
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
  <div class="editor-workflow-sync-rail flex w-full flex-wrap items-center gap-x-2 gap-y-2">
    <Button
      variant="outline"
      class="h-9 shrink-0"
      type="button"
      @click="copyToWeChat"
    >
      <Copy class="mr-2 h-4 w-4" />
      <span>复制</span>
    </Button>

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
      class="sync-rail-menubar hidden min-w-0 w-full md:block md:w-auto md:flex-1 md:min-w-[12rem]"
      aria-label="同步与编辑菜单"
    >
      <div
        class="max-w-full rounded-lg border border-border bg-background/80 p-0.5 backdrop-blur-sm"
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
