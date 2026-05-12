<script setup lang="ts">
import { BarChart3, ChevronRight, Copy, Database, Megaphone, Menu, Palette, PenLine, RefreshCw } from 'lucide-vue-next'
import { getDataAcquisitionNavUrl } from '@/constants/branding'
import { useEditorStore } from '@/stores/editor'
import { useExportStore } from '@/stores/export'
import { useRenderStore } from '@/stores/render'
import { useThemeStore } from '@/stores/theme'
import { useUIStore } from '@/stores/ui'
import { addPrefix, generatePureHTML, processClipboardContent } from '@/utils'
import { store } from '@/utils/storage'
import ContentCreationDialog from './ContentCreationDialog.vue'
import DataAcquisitionDialog from './DataAcquisitionDialog.vue'
import EditDropdown from './EditDropdown.vue'
import FileDropdown from './FileDropdown.vue'
import FormatDropdown from './FormatDropdown.vue'
import HelpDropdown from './HelpDropdown.vue'
import InsertDropdown from './InsertDropdown.vue'
import MarkdownHelpDialog from './MarkdownHelpDialog.vue'
import StyleDropdown from './StyleDropdown.vue'
import WorkflowPlaceholderDialog from './WorkflowPlaceholderDialog.vue'

const emit = defineEmits([`startCopy`, `endCopy`])

const editorStore = useEditorStore()
const themeStore = useThemeStore()
const renderStore = useRenderStore()
const uiStore = useUIStore()
const exportStore = useExportStore()

const { editor } = storeToRefs(editorStore)
const { output } = storeToRefs(renderStore)
const { primaryColor } = storeToRefs(themeStore)
const { isOpenRightSlider } = storeToRefs(uiStore)

// Editor refresh function
function editorRefresh() {
  themeStore.updateCodeTheme()

  const raw = editorStore.getContent()
  renderStore.render(raw)
}

// 对话框状态
const aboutDialogVisible = ref(false)
const fundDialogVisible = ref(false)
const editorStateDialogVisible = ref(false)
const markdownHelpDialogVisible = ref(false)
const dataAcquisitionDialogVisible = ref(false)
const contentCreationDialogVisible = ref(false)
const distributionDialogVisible = ref(false)
const statsDialogVisible = ref(false)

const workflowSteps = [
  { id: `data` as const, label: `数据获取`, icon: Database },
  { id: `creation` as const, label: `内容创作`, icon: PenLine },
  { id: `sync` as const, label: `内容同步`, icon: RefreshCw },
  { id: `distribution` as const, label: `内容宣发`, icon: Megaphone },
  { id: `stats` as const, label: `闭环统计`, icon: BarChart3 },
]

function openWorkflowStep(stepId: (typeof workflowSteps)[number]['id']) {
  if (stepId === `sync`)
    return
  if (stepId === `data`) {
    openDataAcquisition()
    return
  }
  if (stepId === `creation`) {
    contentCreationDialogVisible.value = true
    return
  }
  if (stepId === `distribution`) {
    distributionDialogVisible.value = true
    return
  }
  if (stepId === `stats`) {
    statsDialogVisible.value = true
  }
}

function openDataAcquisition() {
  const url = getDataAcquisitionNavUrl()
  if (url) {
    window.open(url, `_blank`, `noopener,noreferrer`)
    return
  }
  dataAcquisitionDialogVisible.value = true
}

function handleOpenAbout() {
  aboutDialogVisible.value = true
}

function handleOpenFund() {
  fundDialogVisible.value = true
}

function handleOpenEditorState() {
  editorStateDialogVisible.value = true
}

function handleOpenMarkdownHelp() {
  markdownHelpDialogVisible.value = true
}

const copyMode = store.reactive(addPrefix(`copyMode`), `txt`)

const { copy: copyContent } = useClipboard({
  legacy: true,
})

const delay = (ms: number) => new Promise<void>(resolve => window.setTimeout(resolve, ms))

const normalizeErrorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error))

async function writeClipboardItems(items: ClipboardItem[]) {
  if (!navigator.clipboard?.write) {
    throw new Error(`Clipboard API not available.`)
  }

  await delay(0)
  await navigator.clipboard.write(items)
}

function fallbackCopyUsingExecCommand(htmlContent: string) {
  const selection = window.getSelection()

  if (!selection) {
    return false
  }

  const tempContainer = document.createElement(`div`)
  tempContainer.innerHTML = htmlContent
  tempContainer.style.position = `fixed`
  tempContainer.style.left = `-9999px`
  tempContainer.style.top = `0`
  tempContainer.style.opacity = `0`
  tempContainer.style.pointerEvents = `none`
  tempContainer.style.setProperty(`background-color`, `#ffffff`, `important`)
  tempContainer.style.setProperty(`color`, `#000000`, `important`)

  document.body.appendChild(tempContainer)

  const htmlElement = document.documentElement
  const wasDark = htmlElement.classList.contains(`dark`)
  let successful = false

  try {
    if (wasDark) {
      htmlElement.classList.remove(`dark`)
    }

    const range = document.createRange()
    range.selectNodeContents(tempContainer)
    selection.removeAllRanges()
    selection.addRange(range)

    successful = document.execCommand(`copy`)
  }
  catch {
    successful = false
  }
  finally {
    selection.removeAllRanges()
    tempContainer.remove()

    if (wasDark) {
      htmlElement.classList.add(`dark`)
    }
  }

  return successful
}

// 复制到微信公众号
async function copy() {
  // 如果是 Markdown 源码，直接复制并返回
  if (copyMode.value === `md`) {
    const mdContent = editor.value?.state.doc.toString() || ``
    await copyContent(mdContent)
    toast.success(`已复制 Markdown 源码到剪贴板。`)
    return
  }

  // 以下处理非 Markdown 的复制流程
  emit(`startCopy`)

  setTimeout(() => {
    nextTick(async () => {
      try {
        await processClipboardContent(primaryColor.value)
      }
      catch (error) {
        toast.error(`处理 HTML 失败，请联系开发者。${normalizeErrorMessage(error)}`)
        editorRefresh()
        emit(`endCopy`)
        return
      }

      const clipboardDiv = document.getElementById(`output`)

      if (!clipboardDiv) {
        toast.error(`未找到复制输出区域，请刷新页面后重试。`)
        editorRefresh()
        emit(`endCopy`)
        return
      }

      clipboardDiv.focus()
      window.getSelection()?.removeAllRanges()

      const temp = clipboardDiv.innerHTML

      if (copyMode.value === `txt`) {
        try {
          if (typeof ClipboardItem === `undefined`) {
            throw new TypeError(`ClipboardItem is not supported in this browser.`)
          }

          const plainText = clipboardDiv.textContent || ``
          const clipboardItem = new ClipboardItem({
            'text/html': new Blob([temp], { type: `text/html` }),
            'text/plain': new Blob([plainText], { type: `text/plain` }),
          })

          await writeClipboardItems([clipboardItem])
        }
        catch (error) {
          const fallbackSucceeded = fallbackCopyUsingExecCommand(temp)
          if (!fallbackSucceeded) {
            clipboardDiv.innerHTML = output.value
            window.getSelection()?.removeAllRanges()
            editorRefresh()
            toast.error(`复制失败，请联系开发者。${normalizeErrorMessage(error)}`)
            emit(`endCopy`)
            return
          }
        }
      }

      clipboardDiv.innerHTML = output.value

      if (copyMode.value === `html`) {
        await copyContent(temp)
      }
      else if (copyMode.value === `html-without-style`) {
        await copyContent(await generatePureHTML(editor.value!.state.doc.toString()))
      }
      else if (copyMode.value === `html-and-style`) {
        await copyContent(exportStore.editorContent2HTML())
      }

      // 输出提示
      toast.success(
        copyMode.value === `html`
          ? `已复制 HTML 源码，请进行下一步操作。`
          : `已复制渲染后的内容到剪贴板，可直接到公众号后台粘贴。`,
      )
      window.dispatchEvent(
        new CustomEvent(`copyToMp`, {
          detail: {
            content: output.value,
          },
        }),
      )
      editorRefresh()
      emit(`endCopy`)
    })
  }, 350)
}

function handleCopy(mode: string) {
  copyMode.value = mode
  copy()
}

function copyToWeChat() {
  copyMode.value = 'txt'
  copy()
}
</script>

<template>
  <header
    class="header-container h-15 flex flex-wrap items-center justify-between px-5 relative"
  >
    <div class="flex min-w-0 flex-1 items-center gap-2">
      <!-- 桌面端左侧菜单 -->
      <div class="space-x-1 hidden md:flex">
        <Menubar class="menubar border-0">
          <FileDropdown @open-editor-state="handleOpenEditorState" />
          <EditDropdown @copy="handleCopy" />
          <FormatDropdown />
          <InsertDropdown />
          <StyleDropdown />
          <HelpDropdown @open-about="handleOpenAbout" @open-fund="handleOpenFund" @open-markdown-help="handleOpenMarkdownHelp" />
        </Menubar>
      </div>

      <!-- 工作流导航：数据获取 → … → 内容同步（当前）→ … -->
      <nav
        class="workflow-nav hidden min-w-0 shrink items-center gap-0.5 border-l border-border pl-2 md:flex"
        aria-label="工作流"
      >
        <template v-for="(step, index) in workflowSteps" :key="step.id">
          <ChevronRight
            v-if="index > 0"
            class="size-3.5 shrink-0 text-muted-foreground/70"
            aria-hidden="true"
          />
          <Button
            v-if="step.id !== 'sync'"
            variant="ghost"
            size="sm"
            class="h-8 shrink-0 gap-1 px-2 text-xs font-medium text-muted-foreground hover:text-foreground"
            @click="openWorkflowStep(step.id)"
          >
            <component :is="step.icon" class="size-3.5 opacity-80" />
            <span class="max-w-[5.5rem] truncate sm:max-w-none">{{ step.label }}</span>
          </Button>
          <span
            v-else
            class="inline-flex h-8 shrink-0 items-center gap-1 rounded-md bg-primary/12 px-2 text-xs font-medium text-primary"
          >
            <component :is="step.icon" class="size-3.5 opacity-90" />
            <span class="max-w-[5.5rem] truncate sm:max-w-none">{{ step.label }}</span>
          </span>
        </template>
      </nav>

      <!-- 移动端：菜单 + 横向工作流（可滑动） -->
      <div class="flex min-w-0 flex-1 items-center gap-2 md:hidden">
        <Menubar class="menubar shrink-0 border-0 p-0">
          <MenubarMenu>
            <MenubarTrigger class="p-0">
              <Button variant="outline" size="icon">
                <Menu class="size-4" />
              </Button>
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
        <nav
          class="workflow-nav-mobile flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto"
          aria-label="工作流"
        >
          <template v-for="(step, index) in workflowSteps" :key="step.id">
            <ChevronRight
              v-if="index > 0"
              class="size-3 shrink-0 text-muted-foreground/60"
              aria-hidden="true"
            />
            <Button
              v-if="step.id !== 'sync'"
              variant="outline"
              size="sm"
              class="h-8 shrink-0 gap-0.5 px-1.5 text-[11px]"
              @click="openWorkflowStep(step.id)"
            >
              <component :is="step.icon" class="size-3" />
              <span class="max-w-[3.25rem] truncate">{{ step.label }}</span>
            </Button>
            <span
              v-else
              class="inline-flex h-8 shrink-0 items-center gap-0.5 rounded-md bg-primary/12 px-1.5 text-[11px] font-medium text-primary"
            >
              <component :is="step.icon" class="size-3" />
              <span class="max-w-[3.25rem] truncate">{{ step.label }}</span>
            </span>
          </template>
        </nav>
      </div>
    </div>

    <!-- 右侧操作区 -->
    <div class="flex flex-wrap items-center gap-2">
      <!-- 复制按钮 -->
      <Button
        variant="outline"
        class="h-9"
        @click="copyToWeChat"
      >
        <Copy class="mr-2 h-4 w-4" />
        <span>复制</span>
      </Button>

      <!-- 文章信息（移动端隐藏） -->
      <PostInfo class="hidden md:inline-flex" />

      <!-- 样式面板 -->
      <Button
        variant="outline"
        class="h-9"
        :class="{ 'bg-accent text-accent-foreground': isOpenRightSlider }"
        @click="isOpenRightSlider = !isOpenRightSlider"
      >
        <Palette class="mr-2 h-4 w-4" />
        <span>样式</span>
      </Button>
    </div>
  </header>

  <!-- 对话框组件，嵌套菜单无法正常挂载，需要提取层级 -->
  <AboutDialog :visible="aboutDialogVisible" @close="aboutDialogVisible = false" />
  <FundDialog :visible="fundDialogVisible" @close="fundDialogVisible = false" />
  <EditorStateDialog :visible="editorStateDialogVisible" @close="editorStateDialogVisible = false" />
  <MarkdownHelpDialog :visible="markdownHelpDialogVisible" @close="markdownHelpDialogVisible = false" />
  <DataAcquisitionDialog :visible="dataAcquisitionDialogVisible" @close="dataAcquisitionDialogVisible = false" />
  <ContentCreationDialog :visible="contentCreationDialogVisible" @close="contentCreationDialogVisible = false" />
  <WorkflowPlaceholderDialog
    :visible="distributionDialogVisible"
    title="内容宣发"
    body="多平台投放节奏、加热与社媒联动等能力将在后续版本接入；当前步骤仅占位，便于对齐整条工作流。"
    @close="distributionDialogVisible = false"
  />
  <WorkflowPlaceholderDialog
    :visible="statsDialogVisible"
    title="闭环统计"
    body="曝光、阅读、互动与转化等数据回流与复盘看板将在后续版本接入；当前步骤仅占位。"
    @close="statsDialogVisible = false"
  />
  <AIImageGeneratorPanel v-model:open="uiStore.aiImageDialogVisible" />
</template>

<style lang="less" scoped>
.header-container {
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

.workflow-nav-mobile {
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.menubar {
  user-select: none;

  :deep([data-radix-menubar-trigger]) {
    font-size: 0.875rem;
    font-weight: 500;
    padding: 0.5rem 0.875rem;
    border-radius: 6px;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;

    &:hover {
      background: hsl(var(--accent) / 0.8);
      color: hsl(var(--accent-foreground));
      transform: translateY(-1px);
    }

    &[data-state='open'] {
      background: hsl(var(--accent));
      color: hsl(var(--accent-foreground));
      box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
    }

    &:active {
      transform: translateY(0);
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

@media (max-width: 768px) {
  .menubar {
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
