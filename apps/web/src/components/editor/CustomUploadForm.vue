<script setup lang='ts'>
import { Compartment } from '@codemirror/state'
import { EditorView } from '@codemirror/view'
import { javascriptSetup, theme } from '@md/shared'
import { useUIStore } from '@/stores/ui'
import { removeLeft } from '@/utils'
import { secureStore } from '@/utils/secureStore'

/**
 * 默认上传脚本模板。用户粘贴的 JS 可能含 token / 接口签名等敏感片段,
 * 因此 formCustomConfig 走 secureStore 加密存储(而不是 store.reactive 明文)。
 *
 * 由于解密是异步的,挂载 CodeMirror 前需先 await `secureStore.get`,以免
 * 编辑器先用默认模板渲染、又被用户实际内容覆盖造成闪烁。
 */
const DEFAULT_CODE = removeLeft(`
  const { file, util, okCb, errCb } = CUSTOM_ARG
  param = new FormData()
  param.append('file', file)
  util.axios.post('${window.location.origin}/upload', param, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => {
    okCb(res.url)
  }).catch(err => {
    errCb(err)
  })
`).trim()

const formCustomTextarea = useTemplateRef<HTMLDivElement>(`formCustomTextarea`)

const uiStore = useUIStore()
const { isDark } = storeToRefs(uiStore)

const editor = ref<EditorView | null>(null)

const themeCompartment = new Compartment()

onMounted(async () => {
  // 先把用户保存过的脚本解密出来,再用作 CodeMirror 的初始 doc,
  // 避免"先默认模板渲染、再被异步加载的实际内容覆盖"的闪烁。
  const saved = await secureStore.get(`formCustomConfig`)
  const initialDoc = saved ?? DEFAULT_CODE

  const editorView = new EditorView({
    parent: formCustomTextarea.value!,
    extensions: [javascriptSetup(), themeCompartment.of(theme(isDark.value))],
    doc: initialDoc,
  })

  editor.value = editorView
})

watch(isDark, (dark) => {
  editor.value?.dispatch({
    effects: themeCompartment.reconfigure(theme(dark)),
  })
})

onUnmounted(() => {
  if (editor.value) {
    editor.value.destroy()
  }
})

async function formCustomSave() {
  const str = editor.value!.state.doc.toString()
  try {
    await secureStore.set(`formCustomConfig`, str)
    toast.success(`保存成功`)
  }
  catch (err) {
    console.error(`[formCustomConfig] save failed`, err)
    toast.error(`保存失败`)
  }
}
</script>

<template>
  <div class="flex flex-col flex-1 overflow-hidden">
    <div class="flex-1 overflow-y-auto p-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden space-y-4">
      <div class="h-60 border border-gray-200 dark:border-gray-700 rounded-lg flex flex-col overflow-y-auto">
        <div
          ref="formCustomTextarea"
          class="flex-1 custom-codemirror"
        />
      </div>
      <Button
        variant="link"
        class="p-0 h-auto text-left whitespace-normal"
        as="a"
        href="https://github.com/doocs/md/blob/main/docs/custom-upload.md"
        target="_blank"
      >
        参数详情？
      </Button>
    </div>
    <DialogFooter class="p-1">
      <Button @click="formCustomSave">
        保存配置
      </Button>
    </DialogFooter>
  </div>
</template>

<style scoped>
@media (max-width: 768px) {
  :deep(.CodeMirror) {
    font-size: 12px;
  }
}
</style>
