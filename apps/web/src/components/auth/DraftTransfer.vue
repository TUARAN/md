<script setup lang="ts">
import { ref } from 'vue'
import { Button } from '@/components/ui/button'
import { usePostStore } from '@/stores/post'
import { mergeDrafts, parseDraftBundle } from '@/utils/draftTransfer'

const posts = usePostStore()
const message = ref('')
function download() {
  const blob = new Blob([JSON.stringify({ format: 'syncblog-drafts', version: 1, posts: posts.posts })], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `syncblog-drafts-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
async function upload(event: Event) {
  const element = event.target as HTMLInputElement
  const file = element.files?.[0]
  if (!file)
    return
  try {
    if (file.size > 10 * 1024 * 1024)
      throw new Error('文件不能超过 10 MB')
    const incoming = parseDraftBundle(JSON.parse(await file.text()))
    const before = posts.posts.length
    posts.posts = mergeDrafts(posts.posts, incoming)
    message.value = `已导入 ${posts.posts.length - before} 篇；现有草稿未被覆盖`
  }
  catch (error) { message.value = error instanceof Error ? error.message : '导入失败' }
  finally { element.value = '' }
}
</script>

<template>
  <div class="space-y-2 border-t pt-3">
    <p class="text-xs text-muted-foreground">
      仅迁移文章草稿及历史，不含 API 密钥、密码或登录状态。其他工作流记录仍保留在原站。文件保存在你的设备。
    </p>
    <Button size="sm" variant="outline" @click="download">
      导出文章草稿
    </Button>
    <label class="block text-xs">导入文章草稿（合并，不覆盖）<input type="file" accept=".json,application/json" class="mt-2 block w-full" @change="upload"></label>
    <p v-if="message" role="status" class="text-xs">
      {{ message }}
    </p>
  </div>
</template>
