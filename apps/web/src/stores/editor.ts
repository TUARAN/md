import type { EditorView } from '@codemirror/view'
import { formatDoc } from '@/utils'

/**
 * 编辑器 Store ——「编辑器实例 + 实时操作」
 *
 * 角色边界(Phase 3.3 明确):
 *   - 持有 CodeMirror EditorView 实例(`editor`)
 *   - 提供对当前编辑缓冲区的**实时**操作:取/写文本、插入、格式化、选区
 *   - **不**持有任何持久化内容,内容生命周期归 `usePostStore` 管
 *
 * 与 `usePostStore` 的关系:
 *   - CodeMirror doc 是**实时编辑状态**,`usePostStore.currentPost.content` 是
 *     **持久化状态**,二者通过 EditorPanel.vue 的双向同步保持一致
 *     (debounce 窗口内可能存在毫秒级偏差)
 *   - 需要立即拿当前编辑内容用 `getContent()`(导出/复制/格式化)
 *   - 需要稳定的、跨组件可见的内容用 `usePostStore.currentPost?.content`
 */
export const useEditorStore = defineStore(`editor`, () => {
  // 内容编辑器实例
  const editor = ref<EditorView | null>(null)

  // 格式化文档
  const formatContent = async () => {
    if (!editor.value)
      return

    const doc = await formatDoc(editor.value.state.doc.toString())
    editor.value.dispatch({
      changes: { from: 0, to: editor.value.state.doc.length, insert: doc },
    })
    return doc
  }

  // 导入默认文档
  const importContent = (content: string) => {
    if (!editor.value)
      return

    editor.value.dispatch({
      changes: { from: 0, to: editor.value.state.doc.length, insert: content },
    })
  }

  // 清空内容
  const clearContent = () => {
    if (!editor.value)
      return

    editor.value.dispatch({
      changes: { from: 0, to: editor.value.state.doc.length, insert: `` },
    })
    toast.success(`内容已清空`)
  }

  /**
   * 取**实时**编辑缓冲区内容。
   *
   * 调用方语义:"我想要用户**此刻**正在编辑的最新文本",通常用于导出、复制、
   * 格式化等立即操作。如果你只是想读"当前选中文章的内容"(可能落后于编辑器
   * 几十毫秒),用 `usePostStore.currentPost?.content` 更合适。
   */
  const getContent = () => {
    return editor.value?.state.doc.toString() ?? ``
  }

  // 获取选中的文本
  const getSelection = () => {
    if (!editor.value)
      return ``

    const selection = editor.value.state.selection.main
    return editor.value.state.doc.sliceString(selection.from, selection.to)
  }

  // 替换选中的文本
  const replaceSelection = (text: string) => {
    if (!editor.value)
      return

    editor.value.dispatch(editor.value.state.replaceSelection(text))
  }

  // 在光标位置插入文本
  const insertAtCursor = (text: string) => {
    if (!editor.value)
      return

    const selection = editor.value.state.selection.main
    editor.value.dispatch({
      changes: { from: selection.from, to: selection.to, insert: text },
      selection: { anchor: selection.from + text.length },
    })
    editor.value.focus()
  }

  return {
    editor,
    formatContent,
    importContent,
    clearContent,
    getContent,
    getSelection,
    replaceSelection,
    insertAtCursor,
  }
})
