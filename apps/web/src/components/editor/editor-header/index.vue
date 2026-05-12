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
const { toggleGNewsDialog } = uiStore

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
const contentCreationDialogVisible = ref(false)
const distributionDialogVisible = ref(false)
const statsDialogVisible = ref(false)

const workflowSteps = [
  { id: `data` as const, label: `数据获取`, icon: Database },
  { id: `creation` as const, label: `风格二创`, icon: PenLine },
  { id: `sync` as const, label: `内容同步`, icon: RefreshCw },
  { id: `distribution` as const, label: `宣发活跃`, icon: Megaphone },
  { id: `stats` as const, label: `闭环汇报`, icon: BarChart3 },
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
  toggleGNewsDialog(true)
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
    <div class="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-2 md:gap-x-4 md:gap-y-2">
      <!-- 工作流导航（桌面）：一级 — 数据获取 → … → 内容同步（当前）→ … -->
      <div
        class="workflow-nav-strip hidden min-w-0 shrink md:flex md:items-center rounded-xl bg-muted/30 px-2 py-1"
      >
        <nav
          class="workflow-nav flex min-w-0 items-center gap-0.5"
          aria-label="工作流"
        >
          <template v-for="(step, index) in workflowSteps" :key="step.id">
            <ChevronRight
              v-if="index > 0"
              class="workflow-chevron size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <button
              v-if="step.id !== 'sync'"
              type="button"
              class="workflow-step workflow-step--inactive inline-flex shrink-0 items-center gap-1 m-0 appearance-none rounded-none border-0 bg-transparent p-0 text-muted-foreground shadow-none transition-colors hover:bg-transparent hover:text-foreground"
              @click="openWorkflowStep(step.id)"
            >
              <component :is="step.icon" class="size-4 shrink-0 text-muted-foreground" />
              <span class="max-w-[5.5rem] truncate sm:max-w-none">{{ step.label }}</span>
            </button>
            <span
              v-else
              class="workflow-step workflow-step--current inline-flex shrink-0 items-center gap-1 bg-transparent text-primary underline decoration-primary/45 underline-offset-2"
              aria-current="step"
            >
              <component :is="step.icon" class="size-4 shrink-0 text-primary" />
              <span class="max-w-[5.5rem] truncate sm:max-w-none">{{ step.label }}</span>
            </span>
          </template>
        </nav>
      </div>

      <!-- 移动端：工作流优先，其次汉堡菜单 -->
      <div class="flex min-w-0 flex-1 items-center gap-2 md:hidden">
        <nav
          class="workflow-nav-mobile flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto rounded-xl bg-muted/30 px-2 py-1 [-ms-overflow-style:none]"
          aria-label="工作流"
        >
          <template v-for="(step, index) in workflowSteps" :key="step.id">
            <ChevronRight
              v-if="index > 0"
              class="workflow-chevron size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <button
              v-if="step.id !== 'sync'"
              type="button"
              class="workflow-step workflow-step--inactive inline-flex shrink-0 items-center gap-1 m-0 appearance-none rounded-none border-0 bg-transparent p-0 text-muted-foreground shadow-none transition-colors hover:bg-transparent hover:text-foreground"
              @click="openWorkflowStep(step.id)"
            >
              <component :is="step.icon" class="size-4 shrink-0 text-muted-foreground" />
              <span class="max-w-[3.25rem] truncate">{{ step.label }}</span>
            </button>
            <span
              v-else
              class="workflow-step workflow-step--current inline-flex shrink-0 items-center gap-1 bg-transparent text-primary underline decoration-primary/45 underline-offset-2"
              aria-current="step"
            >
              <component :is="step.icon" class="size-4 shrink-0 text-primary" />
              <span class="max-w-[3.25rem] truncate">{{ step.label }}</span>
            </span>
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

    <!-- 右侧操作区（桌面：复制 → 文章信息 → 样式面板 → 次级编辑菜单） -->
    <div class="flex min-w-0 flex-wrap items-center justify-end gap-2">
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

      <!-- 样式面板（右侧滑层） -->
      <Button
        variant="outline"
        class="h-9"
        :class="{ 'bg-accent text-accent-foreground': isOpenRightSlider }"
        @click="isOpenRightSlider = !isOpenRightSlider"
      >
        <Palette class="mr-2 h-4 w-4" />
        <span>样式</span>
      </Button>

      <!-- 桌面端：文件 / 编辑 / 格式 / 插入 / 样式(主题菜单) / 帮助 — 与「样式」outline 块视觉一致 -->
      <div
        class="menubar-secondary-desktop hidden min-w-0 md:flex md:items-center"
        aria-label="同步与编辑菜单"
      >
        <div
          class="menubar-secondary-wrap max-w-full rounded-lg border border-border bg-background/80 p-0.5 backdrop-blur-sm"
        >
          <Menubar
            class="menubar menubar--secondary flex h-auto max-w-full min-w-0 flex-nowrap items-center gap-1 border-0 bg-transparent p-0 shadow-none"
          >
            <FileDropdown @open-editor-state="handleOpenEditorState" />
            <EditDropdown @copy="handleCopy" />
            <FormatDropdown />
            <InsertDropdown />
            <StyleDropdown />
            <HelpDropdown @open-about="handleOpenAbout" @open-fund="handleOpenFund" @open-markdown-help="handleOpenMarkdownHelp" />
          </Menubar>
        </div>
      </div>
    </div>
  </header>

  <!-- 对话框组件，嵌套菜单无法正常挂载，需要提取层级 -->
  <AboutDialog :visible="aboutDialogVisible" @close="aboutDialogVisible = false" />
  <FundDialog :visible="fundDialogVisible" @close="fundDialogVisible = false" />
  <EditorStateDialog :visible="editorStateDialogVisible" @close="editorStateDialogVisible = false" />
  <MarkdownHelpDialog :visible="markdownHelpDialogVisible" @close="markdownHelpDialogVisible = false" />
  <ContentCreationDialog :visible="contentCreationDialogVisible" @close="contentCreationDialogVisible = false" />
  <WorkflowPlaceholderDialog
    :visible="distributionDialogVisible"
    title="宣发活跃"
    body="多平台节奏、加热与社群活跃、渠道联动等能力将在后续版本接入；当前步骤仅占位，便于对齐整条工作流。"
    @close="distributionDialogVisible = false"
  />
  <WorkflowPlaceholderDialog
    :visible="statsDialogVisible"
    title="闭环汇报"
    body="曝光、阅读、互动与转化等数据回流与复盘汇报将在后续版本接入；当前步骤仅占位。"
    @close="statsDialogVisible = false"
  />
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

  &--inactive:is(button):focus-visible {
    outline: 2px solid hsl(var(--ring));
    outline-offset: 2px;
  }
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
