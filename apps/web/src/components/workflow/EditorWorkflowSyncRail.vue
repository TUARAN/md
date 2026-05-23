<script setup lang="ts">
import { Copy, MoreHorizontal, Palette } from 'lucide-vue-next'
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
import { Menubar, MenubarContent, MenubarMenu, MenubarTrigger } from '@/components/ui/menubar'
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
  <!--
    /sync 页面右侧操作区:
    - 主操作:复制 / 发布(PostInfo) / 样式面板切换
    - 次级菜单:6 个 dropdown(文件/编辑/格式/插入/样式/帮助)收进单个「⋯」入口,
      节省顶部纵向空间;键盘和鼠标都能照常逐项展开,只是少一行视觉重量
  -->
  <div
    class="editor-workflow-sync-rail flex w-full min-w-0 flex-wrap items-center justify-end gap-2"
  >
    <Button
      variant="outline"
      size="sm"
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
      size="sm"
      class="h-9 shrink-0"
      :class="{ 'bg-accent text-accent-foreground': isOpenRightSlider }"
      type="button"
      :title="isOpenRightSlider ? '隐藏样式面板' : '显示样式面板'"
      @click="isOpenRightSlider = !isOpenRightSlider"
    >
      <Palette class="mr-2 h-4 w-4" />
      <span>样式</span>
    </Button>

    <Menubar class="menubar menubar--secondary shrink-0 border-0 bg-transparent p-0 shadow-none">
      <MenubarMenu>
        <MenubarTrigger
          class="more-menu-trigger inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[state=open]:bg-accent data-[state=open]:text-accent-foreground"
          aria-label="更多编辑菜单"
        >
          <MoreHorizontal class="size-4" />
          <span>菜单</span>
        </MenubarTrigger>
        <MenubarContent align="end" class="min-w-[10rem]">
          <FileDropdown :as-sub="true" @open-editor-state="handleOpenEditorState" />
          <EditDropdown :as-sub="true" @copy="handleCopy" />
          <FormatDropdown :as-sub="true" />
          <InsertDropdown :as-sub="true" />
          <StyleDropdown :as-sub="true" />
          <HelpDropdown
            :as-sub="true"
            @open-about="handleOpenAbout"
            @open-fund="handleOpenFund"
            @open-markdown-help="handleOpenMarkdownHelp"
          />
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
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
