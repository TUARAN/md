<script setup lang="ts">
import { Image as ImageIcon, MoreHorizontal } from 'lucide-vue-next'
import { inject } from 'vue'
import EditDropdown from '@/components/editor/editor-header/EditDropdown.vue'
import FileDropdown from '@/components/editor/editor-header/FileDropdown.vue'
import FormatDropdown from '@/components/editor/editor-header/FormatDropdown.vue'
import HelpDropdown from '@/components/editor/editor-header/HelpDropdown.vue'
import InsertDropdown from '@/components/editor/editor-header/InsertDropdown.vue'
import PostInfo from '@/components/editor/editor-header/PostInfo.vue'
import StyleDropdown from '@/components/editor/editor-header/StyleDropdown.vue'
import { Menubar, MenubarContent, MenubarMenu, MenubarTrigger } from '@/components/ui/menubar'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useEditorHeaderDialogs } from '@/composables/useEditorHeaderDialogs'
import { EDITOR_WECHAT_COPY_KEY } from '@/composables/useEditorWechatCopy'
import { useUIStore } from '@/stores/ui'

const wechatCopy = inject(EDITOR_WECHAT_COPY_KEY, null)
const uiStore = useUIStore()

function openAIImage() {
  uiStore.toggleAIImageDialog(true)
}

const {
  handleOpenAbout,
  handleOpenEditorState,
  handleOpenMarkdownHelp,
} = useEditorHeaderDialogs()

// 「复制到微信」CTA 已移除，但编辑菜单内的复制子项仍透传 mode
function handleCopy(mode: string) {
  wechatCopy?.handleCopy(mode)
}
</script>

<template>
  <!--
    /sync 操作区：「玻璃 Dock」
    - 玻璃胶囊容器，悬浮感
    - 内部装：发布（次 CTA chip）/ 样式 / 专注 / 菜单（图标按钮）
  -->
  <TooltipProvider :delay-duration="180">
    <div class="rail-wrap flex w-full min-w-0 flex-wrap items-center justify-end gap-2">
      <!-- 工具 Dock：玻璃质感容器 + 内部图标按钮 -->
      <div class="rail-dock shrink-0">
        <!-- 发布：第二动作，作为 dock 内首位且着色 -->
        <div class="dock-publish">
          <PostInfo />
        </div>

        <div class="dock-divider" aria-hidden="true" />

        <Tooltip>
          <TooltipTrigger as-child>
            <button
              class="dock-icon-btn"
              type="button"
              aria-label="AI 文生图"
              @click="openAIImage"
            >
              <ImageIcon class="size-[15px]" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" :side-offset="8" class="text-xs">
            AI 文生图
          </TooltipContent>
        </Tooltip>

        <Menubar class="menubar shrink-0 border-0 bg-transparent p-0 shadow-none">
          <MenubarMenu>
            <MenubarTrigger
              class="dock-icon-btn dock-icon-btn--menu"
              aria-label="更多编辑菜单"
            >
              <MoreHorizontal class="size-[15px]" />
            </MenubarTrigger>
            <MenubarContent align="end" :side-offset="8" class="min-w-[10rem]">
              <FileDropdown :as-sub="true" @open-editor-state="handleOpenEditorState" />
              <EditDropdown :as-sub="true" @copy="handleCopy" />
              <FormatDropdown :as-sub="true" />
              <InsertDropdown :as-sub="true" />
              <StyleDropdown :as-sub="true" />
              <HelpDropdown
                :as-sub="true"
                @open-about="handleOpenAbout"
                @open-markdown-help="handleOpenMarkdownHelp"
              />
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>
    </div>
  </TooltipProvider>
</template>

<style lang="less" scoped>
/* ====================================================================
   工具 Dock：玻璃胶囊容器
   ==================================================================== */
.rail-dock {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
  border-radius: 9999px;
  background: hsl(var(--background) / 0.7);
  box-shadow: 0 1px 2px 0 hsl(var(--foreground) / 0.04), 0 8px 28px -10px hsl(var(--foreground) / 0.14),
    inset 0 0 0 1px hsl(var(--border) / 0.55), inset 0 1px 0 0 hsl(var(--background) / 0.6);
  backdrop-filter: blur(16px) saturate(160%);
}

.dock-divider {
  width: 1px;
  height: 18px;
  margin: 0 4px;
  background: hsl(var(--border) / 0.7);
  flex-shrink: 0;
}

/* —— Dock 内的「发布」按钮：覆盖 PostInfo 里的 Button outline 样式，使其融入 dock —— */
.dock-publish :deep(button) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 500;
  color: hsl(var(--foreground));
  background: hsl(var(--foreground) / 0.06);
  border: none;
  box-shadow: none;
  transition: background 0.15s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: hsl(var(--foreground) / 0.1);
    color: hsl(var(--foreground));
  }

  & > svg {
    width: 15px;
    height: 15px;
  }
}

/* —— 图标按钮：32×32 圆形，ghost 风格 —— */
.dock-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 9999px;
  color: hsl(var(--muted-foreground));
  background: transparent;
  border: 0;
  cursor: pointer;
  transition: background 0.15s cubic-bezier(0.4, 0, 0.2, 1), color 0.15s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    background: hsl(var(--foreground) / 0.06);
    color: hsl(var(--foreground));
  }

  &:focus-visible {
    outline: 2px solid hsl(var(--ring));
    outline-offset: 2px;
  }
}

.dock-icon-btn--menu[data-state='open'] {
  background: hsl(var(--foreground) / 0.1);
  color: hsl(var(--foreground));
}

/* —— Menubar 内容入场动画保留 —— */
.menubar {
  user-select: none;

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
