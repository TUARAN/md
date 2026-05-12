import type { InjectionKey } from 'vue'
import { useClipboard } from '@vueuse/core'
import { storeToRefs } from 'pinia'
import { nextTick } from 'vue'
import { useEditorStore } from '@/stores/editor'
import { useExportStore } from '@/stores/export'
import { useRenderStore } from '@/stores/render'
import { useThemeStore } from '@/stores/theme'
import { addPrefix, generatePureHTML, processClipboardContent } from '@/utils'
import { store } from '@/utils/storage'
import { toast } from '@/utils/toast'

export interface EditorWechatCopyCallbacks {
  onStartCopy: () => void
  onEndCopy: () => void
}

export interface EditorWechatCopyApi {
  copyMode: { value: string }
  handleCopy: (mode: string) => void
  copyToWeChat: () => void
}

export const EDITOR_WECHAT_COPY_KEY: InjectionKey<EditorWechatCopyApi> = Symbol(`editor-wechat-copy`)

const copyMode = store.reactive(addPrefix(`copyMode`), `txt`)

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

export function useEditorWechatCopy(callbacks: EditorWechatCopyCallbacks): EditorWechatCopyApi {
  const editorStore = useEditorStore()
  const themeStore = useThemeStore()
  const renderStore = useRenderStore()
  const exportStore = useExportStore()

  const { editor } = storeToRefs(editorStore)
  const { output } = storeToRefs(renderStore)
  const { primaryColor } = storeToRefs(themeStore)

  const { copy: copyContent } = useClipboard({
    legacy: true,
  })

  function editorRefresh() {
    themeStore.updateCodeTheme()
    const raw = editorStore.getContent()
    renderStore.render(raw)
  }

  async function copy() {
    if (copyMode.value === `md`) {
      const mdContent = editor.value?.state.doc.toString() || ``
      await copyContent(mdContent)
      toast.success(`已复制 Markdown 源码到剪贴板。`)
      return
    }

    callbacks.onStartCopy()

    setTimeout(() => {
      nextTick(async () => {
        try {
          await processClipboardContent(primaryColor.value)
        }
        catch (error) {
          toast.error(`处理 HTML 失败，请联系开发者。${normalizeErrorMessage(error)}`)
          editorRefresh()
          callbacks.onEndCopy()
          return
        }

        const clipboardDiv = document.getElementById(`output`)

        if (!clipboardDiv) {
          toast.error(`未找到复制输出区域，请刷新页面后重试。`)
          editorRefresh()
          callbacks.onEndCopy()
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
              callbacks.onEndCopy()
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
        callbacks.onEndCopy()
      })
    }, 350)
  }

  function handleCopy(mode: string) {
    copyMode.value = mode
    copy()
  }

  function copyToWeChat() {
    copyMode.value = `txt`
    copy()
  }

  return {
    copyMode,
    handleCopy,
    copyToWeChat,
  }
}
