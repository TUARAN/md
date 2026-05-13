<script setup lang="ts">
import { RefreshCw } from 'lucide-vue-next'
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
  WorkflowCreationPage,
  WorkflowDataPage,
  WorkflowDistributionPage,
  WorkflowPageShell,
  WorkflowPageTitle,
  WorkflowStatsPage,
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
  viewMode,
  enableScrollSync,
  workflowAppPage,
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
  <div class="container flex flex-col">
    <Progress v-model="progressValue" class="absolute left-0 right-0 rounded-none" style="height: 2px;" />
    <EditorHeader />

    <main class="container-main bg-muted/40 flex min-h-0 flex-1 flex-col dark:bg-muted/15">
      <div
        v-show="workflowAppPage === 'sync'"
        class="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <WorkflowPageShell :scroll-body="false">
          <template #header>
            <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div class="min-w-0">
                <WorkflowPageTitle>
                  <template #icon>
                    <RefreshCw />
                  </template>
                  内容同步
                </WorkflowPageTitle>
                <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
                  在此编辑正文、查看预览排版，复制到公众号或继续后续分发步骤。
                </p>
              </div>
              <div class="min-w-0 shrink-0 lg:max-w-[70%]">
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
      </div>

      <WorkflowDataPage v-show="workflowAppPage === 'data'" />
      <WorkflowCreationPage v-show="workflowAppPage === 'creation'" />
      <WorkflowDistributionPage v-show="workflowAppPage === 'distribution'" />
      <WorkflowStatsPage v-show="workflowAppPage === 'stats'" />

      <UploadImgDialog @upload-image="handleUploadImage" />

      <InsertFormDialog />

      <InsertMpCardDialog />

      <ImportMarkdownDialog />

      <TemplateDialog />
    </main>

    <Footer />
  </div>
</template>

<style lang="less" scoped>
@import url('../assets/less/app.less');
</style>

<style lang="less" scoped>
.container {
  height: 100vh;
  min-width: 100%;
  padding: 0;
}

.container-main {
  overflow: hidden;
}
</style>
