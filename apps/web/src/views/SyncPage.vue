<script setup lang="ts">
/**
 * SyncPage —— workflow 「内容同步」步骤页
 *
 * 双栏编辑器 + 预览 + 资源面板的完整编辑视图。原 `CodemirrorEditor.vue` 整页
 * 的内容主体迁移到这里;EditorHeader / Footer / main 容器由父级 EditorLayout
 * 提供。`<KeepAlive>` 保证用户在 6 个 workflow 路由间切换时编辑器实例不重建,
 * codemirror 内容、光标、滚动位置、面板尺寸全部保留。
 */
import { ChevronDown, RefreshCw } from 'lucide-vue-next'
import { provide } from 'vue'
import EditorPanel from '@/components/editor/EditorPanel.vue'
import FolderSourcePanel from '@/components/editor/FolderSourcePanel.vue'
import PreviewPanel from '@/components/editor/PreviewPanel.vue'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import {
  EditorWorkflowSyncRail,
  WorkflowPageShell,
  WorkflowPageTitle,
} from '@/components/workflow'
import { useCursorSync } from '@/composables/useCursorSync'
import { EDITOR_WECHAT_COPY_KEY, useEditorWechatCopy } from '@/composables/useEditorWechatCopy'
import { useScrollSync } from '@/composables/useScrollSync'
import { useUIStore } from '@/stores/ui'
import { downloadCsyncExtensionZip } from '@/utils/downloadCsyncExtension'

const uiStore = useUIStore()

const {
  isMobile,
  isOpenPostSlider,
  isOpenFolderPanel,
  isOpenRightSlider,
  viewMode,
  enableScrollSync,
} = storeToRefs(uiStore)

// --- 子组件引用 ---
const editorPanelCompRef = ref<InstanceType<typeof EditorPanel> | null>(null)
const previewPanelCompRef = ref<InstanceType<typeof PreviewPanel> | null>(null)

// 从子组件获取 codeMirrorView 和 previewRef (使用 getter 避免 DeepReadonly 类型问题)
const getEditorView = () => editorPanelCompRef.value?.codeMirrorView ?? null
const getPreviewContainer = () => previewPanelCompRef.value?.previewRef ?? null

// --- 游标同步 ---
const {
  skipCursorDrivenPreviewSync,
  scheduleSyncPreviewToEditorCursor,
  handlePreviewContentClick,
  cleanup: cleanupCursorSync,
} = useCursorSync(getEditorView, getPreviewContainer)

// --- 滚动同步 ---
useScrollSync(getEditorView, getPreviewContainer, enableScrollSync)

// --- 复制状态 ---
const backLight = ref(false)
const isCoping = ref(false)

function startCopy() {
  backLight.value = true
  isCoping.value = true
}

function endCopy() {
  backLight.value = false
  setTimeout(() => {
    isCoping.value = false
  }, 800)
}

const wechatCopy = useEditorWechatCopy({
  onStartCopy: startCopy,
  onEndCopy: endCopy,
})
provide(EDITOR_WECHAT_COPY_KEY, wechatCopy)

// --- 上传图片透传 ---
function handleUploadImage(file: File, cb?: any, applyUrl?: boolean) {
  editorPanelCompRef.value?.uploadImage(file, cb, applyUrl)
}

// --- 面板尺寸配置 ---
const hasSidePanel = computed(() => !isMobile.value && (isOpenRightSlider.value || uiStore.isShowCssEditor))

const editorPanelConfig = computed(() => {
  const mode = viewMode.value
  if (mode === `preview`) {
    return { min: 0, max: 0 }
  }
  if (mode === `edit`) {
    return hasSidePanel.value ? { min: 30, max: 85 } : { min: 100, max: 100 }
  }
  if (isMobile.value)
    return { min: 30, max: 70 }
  return { min: 15, max: 85 }
})

const previewPanelConfig = computed(() => {
  const mode = viewMode.value
  if (mode === `edit`) {
    return { min: 0, max: 0 }
  }
  if (mode === `preview`) {
    return hasSidePanel.value ? { min: 20, max: 75 } : { min: 100, max: 100 }
  }
  if (isMobile.value)
    return { min: 30, max: 70 }
  return { min: 15, max: 85 }
})

const editorResizablePanelRef = ref<InstanceType<typeof ResizablePanel> | null>(null)
const previewResizablePanelRef = ref<InstanceType<typeof ResizablePanel> | null>(null)
const cssEditorPanelRef = ref<InstanceType<typeof ResizablePanel> | null>(null)
const rightSliderPanelRef = ref<InstanceType<typeof ResizablePanel> | null>(null)

function redistributePanelSizes() {
  const cssTarget = !isMobile.value && uiStore.isShowCssEditor ? 25 : 0
  const rightTarget = !isMobile.value && isOpenRightSlider.value ? 30 : 0
  const contentSpace = 100 - cssTarget - rightTarget

  const mode = viewMode.value
  if (mode === `edit`) {
    editorResizablePanelRef.value?.resize(contentSpace)
    previewResizablePanelRef.value?.resize(0)
  }
  else if (mode === `preview`) {
    editorResizablePanelRef.value?.resize(0)
    previewResizablePanelRef.value?.resize(contentSpace)
  }
  else {
    const half = contentSpace / 2
    editorResizablePanelRef.value?.resize(half)
    previewResizablePanelRef.value?.resize(half)
  }

  cssEditorPanelRef.value?.resize(cssTarget)
  rightSliderPanelRef.value?.resize(rightTarget)
}

watch(viewMode, () => {
  nextTick(redistributePanelSizes)
})

watch(() => uiStore.isShowCssEditor, () => {
  nextTick(redistributePanelSizes)
})

watch(isOpenRightSlider, () => {
  nextTick(redistributePanelSizes)
})

onMounted(() => {
  nextTick(redistributePanelSizes)
})

// --- 进度条 ---
const progressValue = computed(() => editorPanelCompRef.value?.progressValue ?? 0)

// --- 清理 ---
onUnmounted(() => {
  cleanupCursorSync()
})
</script>

<template>
  <div id="content-sync" class="flex min-h-0 flex-1 flex-col overflow-hidden">
    <Progress v-model="progressValue" class="absolute left-0 right-0 rounded-none" style="height: 2px;" />

    <WorkflowPageShell :scroll-body="false">
      <template #header>
        <div
          class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6"
        >
          <div class="min-w-0 max-w-xl">
            <WorkflowPageTitle>
              <template #icon>
                <RefreshCw />
              </template>
              内容同步
            </WorkflowPageTitle>
            <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
              左栏定稿 Markdown，右栏核对图文；分发时点「发布」写各站草稿。
            </p>
            <details
              class="group mt-2 w-full overflow-hidden rounded-md border border-border/50 bg-muted/10 dark:bg-muted/5"
            >
              <summary
                class="flex cursor-pointer list-none items-center gap-2 px-2.5 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground [&::-webkit-details-marker]:hidden"
              >
                <ChevronDown
                  class="h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-open:rotate-180"
                  aria-hidden="true"
                />
                COSE / CSYNC 说明（可选）
              </summary>
              <div
                class="space-y-2 border-t border-border/40 px-2.5 py-2.5 text-xs leading-relaxed text-muted-foreground"
              >
                <p>
                  各站编辑页差异大，编辑器用双扩展：多数平台走
                  <a
                    href="https://github.com/doocs/cose"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="font-medium text-foreground underline underline-offset-2"
                  >COSE</a>
                  （商店「cose 文章同步助手」）；知乎 / 公众号 / 微博可优先走
                  <span class="font-medium text-foreground">CSYNC</span>
                  （页面桥接为 <code class="rounded bg-muted px-1 py-px text-[10px]">$pluginSyncer</code>）。
                  CSYNC 请
                  <a
                    href="#"
                    class="font-medium text-foreground underline underline-offset-2"
                    @click.prevent="downloadCsyncExtensionZip()"
                  >从本站下载 .zip</a>
                  解压后在 <code class="rounded bg-muted px-1 py-px text-[10px]">chrome://extensions</code> 加载（与「发布」对话框一致）。
                </p>
                <p class="text-[11px] leading-relaxed">
                  「发布」里带 CSYNC 角标的由 CSYNC 写入，其余由 COSE 处理。
                </p>
              </div>
            </details>
          </div>
          <div
            class="min-w-0 w-full shrink-0 lg:w-auto lg:max-w-[42rem]"
          >
            <EditorWorkflowSyncRail />
          </div>
        </div>
      </template>

      <div
        class="container-main-section border-radius-10 relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-x border-b"
      >
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel
            :default-size="isMobile ? 0 : 15"
            :max-size="!isMobile && isOpenPostSlider ? 20 : 0"
            :min-size="!isMobile && isOpenPostSlider ? 10 : 0"
          >
            <PostSlider />
          </ResizablePanel>
          <ResizableHandle class="hidden md:block" />
          <ResizablePanel
            :default-size="!isMobile && isOpenFolderPanel ? 15 : 0"
            :max-size="!isMobile && isOpenFolderPanel ? 25 : 0"
            :min-size="!isMobile && isOpenFolderPanel ? 10 : 0"
          >
            <FolderSourcePanel />
          </ResizablePanel>
          <ResizableHandle v-if="!isMobile && isOpenFolderPanel" class="hidden md:block" />

          <!-- 主内容区域 (嵌套灵动布局) -->
          <ResizablePanel :min-size="30">
            <ResizablePanelGroup direction="horizontal">
              <!-- Markdown 编辑器 -->
              <ResizablePanel
                ref="editorResizablePanelRef"
                :order="1"
                :default-size="viewMode === 'preview' ? 0 : viewMode === 'edit' ? 100 : 50"
                :min-size="editorPanelConfig.min"
                :max-size="editorPanelConfig.max"
                collapsible
                :collapsed-size="0"
              >
                <EditorPanel
                  ref="editorPanelCompRef"
                  :skip-cursor-driven-preview-sync="skipCursorDrivenPreviewSync"
                  :on-cursor-activity="scheduleSyncPreviewToEditorCursor"
                />
              </ResizablePanel>
              <ResizableHandle v-show="viewMode === 'split'" />

              <!-- 预览区 -->
              <ResizablePanel
                ref="previewResizablePanelRef"
                :order="2"
                :default-size="viewMode === 'edit' ? 0 : viewMode === 'preview' ? 100 : 50"
                :min-size="previewPanelConfig.min"
                :max-size="previewPanelConfig.max"
                collapsible
                :collapsed-size="0"
              >
                <PreviewPanel
                  ref="previewPanelCompRef"
                  :back-light="backLight"
                  :is-coping="isCoping"
                  :on-content-click="handlePreviewContentClick"
                />
              </ResizablePanel>

              <!-- CSS 编辑器面板 -->
              <ResizableHandle v-show="!isMobile && uiStore.isShowCssEditor" class="hidden md:block" />
              <ResizablePanel
                ref="cssEditorPanelRef"
                :order="3"
                :default-size="0"
                :min-size="!isMobile && uiStore.isShowCssEditor ? 10 : 0"
                :max-size="!isMobile && uiStore.isShowCssEditor ? 60 : 0"
                collapsible
                :collapsed-size="0"
              >
                <CssEditor v-if="!isMobile" />
              </ResizablePanel>

              <!-- 样式面板 -->
              <ResizableHandle v-show="!isMobile && isOpenRightSlider" class="hidden md:block" />
              <ResizablePanel
                v-if="isOpenRightSlider"
                ref="rightSliderPanelRef"
                :order="4"
                :default-size="0"
                :min-size="!isMobile && isOpenRightSlider ? 25 : 0"
                :max-size="!isMobile && isOpenRightSlider ? 60 : 0"
                collapsible
                :collapsed-size="0"
              >
                <RightSlider v-if="!isMobile" />
              </ResizablePanel>
            </ResizablePanelGroup>

            <!-- 移动端：CssEditor 和 RightSlider 作为浮层 -->
            <template v-if="isMobile">
              <CssEditor />
              <RightSlider />
            </template>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </WorkflowPageShell>

    <UploadImgDialog @upload-image="handleUploadImage" />
    <InsertFormDialog />
    <InsertMpCardDialog />
    <ImportMarkdownDialog />
    <TemplateDialog />

    <Footer />
  </div>
</template>

<style lang="less" scoped>
@import url('../assets/less/app.less');
</style>
