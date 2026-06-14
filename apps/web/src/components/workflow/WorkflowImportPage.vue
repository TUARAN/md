<script setup lang="ts">
import { Copy, Plug, Radio } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { copyPlain } from '@/utils/clipboard'
import { toast } from '@/utils/toast'
import WorkflowPageShell from './WorkflowPageShell.vue'
import WorkflowPageTitle from './WorkflowPageTitle.vue'
import WorkflowSectionTitle from './WorkflowSectionTitle.vue'

const copied = ref(false)
const editorOrigin = computed(() => (typeof window !== `undefined` ? window.location.origin : `https://md.doocs.org`))

const importExampleCode = computed(() => `// 1. 打开 Syncblog 编辑器
const editor = window.open('${editorOrigin.value}/edit', 'syncblog-editor')

// 2. 等待编辑器就绪后推送 Markdown
function onMessage(event) {
  if (event.origin !== '${editorOrigin.value}')
    return

  if (event.data?.type === 'MD_IMPORT_READY') {
    editor.postMessage({
      type: 'MD_IMPORT_ARTICLE',
      requestId: 'demo-1',
      title: '我的文章标题',
      markdown: '# 标题\\n\\n正文内容……',
      canonicalUrl: 'https://example.com/post/1',
      tags: ['标签A', '标签B'],
    }, '${editorOrigin.value}')
  }

  if (event.data?.type === 'MD_IMPORT_RESULT') {
    console.log('导入', event.data.ok ? '成功' : '失败', event.data.reason)
  }
}

window.addEventListener('message', onMessage)`)

async function copyImportExample() {
  try {
    await copyPlain(importExampleCode.value)
    copied.value = true
    toast.success(`已复制接入示例`)
    setTimeout(() => (copied.value = false), 1600)
  }
  catch {
    toast.error(`复制失败`)
  }
}
</script>

<template>
  <WorkflowPageShell>
    <template #header>
      <div class="mb-3 inline-flex rounded-full border border-border/70 bg-white/70 px-2.5 py-1 text-xs font-medium text-muted-foreground dark:bg-card">
        Syncblog · 文章线
      </div>
      <WorkflowPageTitle>
        <template #icon>
          <Plug />
        </template>
        外站接入
      </WorkflowPageTitle>
      <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
        从你的采集站、博客后台、浏览器插件或自动化脚本，把已经生成的 Markdown 直接送入 Syncblog 编辑器。
      </p>
    </template>

    <div class="grid gap-4 pb-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(24rem,1fr)]">
      <section class="rounded-2xl border border-gray-200 bg-white/90 p-5 shadow-sm dark:border-border dark:bg-background">
        <div class="flex items-center gap-2">
          <span class="inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Plug class="size-4" />
          </span>
          <div>
            <WorkflowSectionTitle>
              从其他站点直接分发
            </WorkflowSectionTitle>
            <p class="mt-1 text-xs leading-relaxed text-muted-foreground">
              适合把站外已经完成的素材、改写稿或成稿接入到排版分发流程，不需要再手动复制粘贴。
            </p>
          </div>
        </div>

        <div class="mt-5 grid gap-3 text-sm">
          <div class="rounded-xl border border-border/70 bg-muted/20 p-3">
            <p class="font-medium text-foreground">
              1. 打开编辑器
            </p>
            <p class="mt-1 text-xs leading-relaxed text-muted-foreground">
              外站通过 <code class="rounded bg-muted px-1 py-0.5">window.open()</code> 打开 Syncblog 编辑器，获得可通信的窗口对象。
            </p>
          </div>
          <div class="rounded-xl border border-border/70 bg-muted/20 p-3">
            <p class="font-medium text-foreground">
              2. 等待就绪信号
            </p>
            <p class="mt-1 text-xs leading-relaxed text-muted-foreground">
              编辑器加载完成后会广播 <code class="rounded bg-muted px-1 py-0.5">MD_IMPORT_READY</code>，外站收到后再推送内容。
            </p>
          </div>
          <div class="rounded-xl border border-border/70 bg-muted/20 p-3">
            <p class="font-medium text-foreground">
              3. 推送文章内容
            </p>
            <p class="mt-1 text-xs leading-relaxed text-muted-foreground">
              发送 <code class="rounded bg-muted px-1 py-0.5">MD_IMPORT_ARTICLE</code>，带上标题、Markdown 正文和来源链接，编辑器会写入当前文稿。
            </p>
          </div>
        </div>
      </section>

      <section class="rounded-2xl border border-gray-200 bg-white/90 p-5 shadow-sm dark:border-border dark:bg-background">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <Radio class="size-4 text-primary" />
            <WorkflowSectionTitle>
              接入示例
            </WorkflowSectionTitle>
          </div>
          <Button
            class="h-8 rounded-lg px-3 text-xs font-semibold"
            type="button"
            variant="secondary"
            @click="copyImportExample"
          >
            <Copy class="mr-1.5 size-3.5" />
            {{ copied ? '已复制' : '复制代码' }}
          </Button>
        </div>
        <pre class="mt-3 max-h-[420px] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-border/70 bg-muted/20 p-4 text-xs leading-relaxed text-muted-foreground">{{ importExampleCode }}</pre>
      </section>
    </div>
  </WorkflowPageShell>
</template>
