<script setup lang="ts">
/**
 * SyncPage —— workflow 「排版分发」步骤页
 *
 * 双栏编辑器 + 预览 + 资源面板的完整编辑视图。原 `CodemirrorEditor.vue` 整页
 * 的内容主体迁移到这里;EditorHeader / Footer / main 容器由父级 EditorLayout
 * 提供。`<KeepAlive>` 保证用户在 6 个 workflow 路由间切换时编辑器实例不重建,
 * codemirror 内容、光标、滚动位置、面板尺寸全部保留。
 */
import { FileText } from 'lucide-vue-next'
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

const uiStore = useUIStore()

const {
  isMobile,
  isOpenPostSlider,
  isOpenFolderPanel,
  isOpenRightSlider,
  isFocusMode,
  viewMode,
  enableScrollSync,
} = storeToRefs(uiStore)

/**
 * Visibility helpers — focus mode collapses every auxiliary panel so the
 * editor falls back to a clean "left markdown · right preview" canvas.
 * The underlying `is_open_*` flags are untouched; toggling focus off
 * restores the user's previous layout exactly.
 */
const showPostSlider = computed(() => !isFocusMode.value && isOpenPostSlider.value)
const showFolderPanel = computed(() => !isFocusMode.value && isOpenFolderPanel.value)
const showRightSlider = computed(() => !isFocusMode.value && isOpenRightSlider.value)
const showCssEditor = computed(() => !isFocusMode.value && uiStore.isShowCssEditor)

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
const hasSidePanel = computed(() => !isMobile.value && (showRightSlider.value || showCssEditor.value))

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
  const cssTarget = !isMobile.value && showCssEditor.value ? 25 : 0
  const rightTarget = !isMobile.value && showRightSlider.value ? 30 : 0
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

watch(showCssEditor, () => {
  nextTick(redistributePanelSizes)
})

watch(showRightSlider, () => {
  nextTick(redistributePanelSizes)
})

watch(isFocusMode, () => {
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
          class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6"
        >
          <div class="flex min-w-0 flex-col gap-1">
            <WorkflowPageTitle>
              <template #icon>
                <FileText />
              </template>
              排版分发
            </WorkflowPageTitle>
            <p class="max-w-2xl text-xs leading-relaxed text-muted-foreground">
              在左侧写 Markdown，右侧预览公众号排版；需要分发时，用发布插件把文章写入知乎、公众号、掘金等平台草稿。
            </p>
          </div>

          <div class="min-w-0 shrink-0">
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
            :max-size="!isMobile && showPostSlider ? 20 : 0"
            :min-size="!isMobile && showPostSlider ? 10 : 0"
          >
            <PostSlider v-if="showPostSlider" />
          </ResizablePanel>
          <ResizableHandle v-if="showPostSlider" class="hidden md:block" />
          <ResizablePanel
            :default-size="!isMobile && showFolderPanel ? 15 : 0"
            :max-size="!isMobile && showFolderPanel ? 25 : 0"
            :min-size="!isMobile && showFolderPanel ? 10 : 0"
          >
            <FolderSourcePanel v-if="showFolderPanel" />
          </ResizablePanel>
          <ResizableHandle v-if="!isMobile && showFolderPanel" class="hidden md:block" />

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
              <ResizableHandle v-show="!isMobile && showCssEditor" class="hidden md:block" />
              <ResizablePanel
                ref="cssEditorPanelRef"
                :order="3"
                :default-size="0"
                :min-size="!isMobile && showCssEditor ? 10 : 0"
                :max-size="!isMobile && showCssEditor ? 60 : 0"
                collapsible
                :collapsed-size="0"
              >
                <CssEditor v-if="!isMobile && showCssEditor" />
              </ResizablePanel>

              <!-- 样式面板 -->
              <ResizableHandle v-show="!isMobile && showRightSlider" class="hidden md:block" />
              <ResizablePanel
                v-if="showRightSlider"
                ref="rightSliderPanelRef"
                :order="4"
                :default-size="0"
                :min-size="!isMobile && showRightSlider ? 25 : 0"
                :max-size="!isMobile && showRightSlider ? 60 : 0"
                collapsible
                :collapsed-size="0"
              >
                <RightSlider v-if="!isMobile" />
              </ResizablePanel>
            </ResizablePanelGroup>

            <!-- 移动端:CssEditor 和 RightSlider 作为浮层(专注模式下隐藏) -->
            <template v-if="isMobile && !isFocusMode">
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
