import { ref } from 'vue'

const aboutDialogVisible = ref(false)
const editorStateDialogVisible = ref(false)
const markdownHelpDialogVisible = ref(false)

export function useEditorHeaderDialogs() {
  function handleOpenAbout() {
    aboutDialogVisible.value = true
  }

  function handleOpenEditorState() {
    editorStateDialogVisible.value = true
  }

  function handleOpenMarkdownHelp() {
    markdownHelpDialogVisible.value = true
  }

  return {
    aboutDialogVisible,
    editorStateDialogVisible,
    markdownHelpDialogVisible,
    handleOpenAbout,
    handleOpenEditorState,
    handleOpenMarkdownHelp,
  }
}
