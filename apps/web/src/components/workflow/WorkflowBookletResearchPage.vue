<script setup lang="ts">
import {
  ArrowRight,
  Copy,
  FileText,
  Layers,
  Target,
} from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { PanelShell } from '@/components/ui/layout'
import {
  PUBLISH_LAB_CORE_RULES,
  PUBLISH_LAB_JUEJIN_BOOKLETS,
  PUBLISH_LAB_MECHANISMS,
  PUBLISH_LAB_PATHS,
  PUBLISH_LAB_PLATFORMS,
  PUBLISH_LAB_RESEARCH_MARKDOWN,
} from '@/constants/publishlab'
import { useEditorStore } from '@/stores/editor'
import { usePostStore } from '@/stores/post'
import { copyPlain } from '@/utils/clipboard'
import { toast } from '@/utils/toast'
import WorkflowPageShell from './WorkflowPageShell.vue'
import WorkflowPageTitle from './WorkflowPageTitle.vue'
import WorkflowSectionTitle from './WorkflowSectionTitle.vue'

const router = useRouter()
const postStore = usePostStore()
const editorStore = useEditorStore()
const { currentPostId } = storeToRefs(postStore)

async function copyMarkdown(markdown: string, label: string) {
  try {
    await copyPlain(markdown)
    toast.success(`已复制${label}`)
  }
  catch {
    toast.error(`复制失败`)
  }
}

async function createEditorPost(title: string, markdown: string) {
  const content = markdown.trim()
  if (!content) {
    toast.error(`没有可写入的内容`)
    return
  }

  postStore.addPost(title)
  const postId = currentPostId.value
  if (postId)
    postStore.updatePostContent(postId, content)

  await router.push({ name: `sync` })
  await nextTick()
  editorStore.importContent(content)
  toast.success(`已生成编辑器文稿`)
}
</script>

<template>
  <WorkflowPageShell>
    <template #header>
      <div class="min-w-0 space-y-3">
        <div class="inline-flex rounded-full border border-border/70 bg-white/70 px-2.5 py-1 text-xs font-medium text-muted-foreground dark:bg-card">
          PublishLab · 小册线
        </div>
        <WorkflowPageTitle>
          <template #icon>
            <Target />
          </template>
          调研选题
        </WorkflowPageTitle>
        <p class="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          从平台、案例、变现机制里判断哪些主题值得沉淀成小册，避免把单篇文章误当成内容产品。
        </p>
      </div>
    </template>

    <div class="grid gap-4 pb-4 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.7fr)]">
      <section class="space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <WorkflowSectionTitle>
            写作变现调研
          </WorkflowSectionTitle>
          <div class="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="secondary" @click="copyMarkdown(PUBLISH_LAB_RESEARCH_MARKDOWN, '调研 Markdown')">
              <Copy class="mr-1.5 size-3.5" />
              复制 Markdown
            </Button>
            <Button type="button" size="sm" @click="createEditorPost('PublishLab · 写作变现深度调研', PUBLISH_LAB_RESEARCH_MARKDOWN)">
              <FileText class="mr-1.5 size-3.5" />
              生成调研草稿
            </Button>
          </div>
        </div>

        <PanelShell>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[680px] text-left text-sm">
              <thead class="text-xs text-muted-foreground">
                <tr>
                  <th class="border-b border-border/70 px-2 py-2 font-medium">
                    机制
                  </th>
                  <th class="border-b border-border/70 px-2 py-2 font-medium">
                    钱从哪来
                  </th>
                  <th class="border-b border-border/70 px-2 py-2 font-medium">
                    代表平台
                  </th>
                  <th class="border-b border-border/70 px-2 py-2 font-medium">
                    门槛
                  </th>
                  <th class="border-b border-border/70 px-2 py-2 font-medium">
                    天花板
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in PUBLISH_LAB_MECHANISMS" :key="item.type" class="text-foreground">
                  <td class="border-b border-border/40 px-2 py-2 font-medium">
                    {{ item.type }}
                  </td>
                  <td class="border-b border-border/40 px-2 py-2 text-muted-foreground">
                    {{ item.source }}
                  </td>
                  <td class="border-b border-border/40 px-2 py-2 text-muted-foreground">
                    {{ item.platforms }}
                  </td>
                  <td class="border-b border-border/40 px-2 py-2">
                    {{ item.threshold }}
                  </td>
                  <td class="border-b border-border/40 px-2 py-2">
                    {{ item.ceiling }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </PanelShell>

        <div class="grid gap-3 md:grid-cols-2">
          <PanelShell v-for="platform in PUBLISH_LAB_PLATFORMS" :key="platform.name" flat>
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="text-sm font-semibold text-foreground">
                  {{ platform.name }}
                </div>
                <div class="mt-1 text-xs text-muted-foreground">
                  {{ platform.threshold }} · {{ platform.revenue }}
                </div>
              </div>
              <ArrowRight class="mt-0.5 size-4 text-muted-foreground" />
            </div>
            <p class="mt-2 text-xs leading-relaxed text-muted-foreground">
              {{ platform.note }}
            </p>
            <p class="mt-2 text-[11px] text-primary">
              样本：{{ platform.case }}
            </p>
          </PanelShell>
        </div>

        <PanelShell radius="xl">
          <div class="flex flex-wrap items-start justify-between gap-3 border-b border-border/70 pb-3">
            <div>
              <div class="text-sm font-semibold text-foreground">
                完整 Markdown 预览
              </div>
              <p class="mt-1 text-xs leading-relaxed text-muted-foreground">
                来自 publishlab.cc/research 的完整调研文本，可复制或生成小册线的调研草稿。
              </p>
            </div>
            <div class="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
              {{ PUBLISH_LAB_RESEARCH_MARKDOWN.length }} 字符
            </div>
          </div>
          <pre class="mt-4 max-h-[360px] overflow-auto whitespace-pre-wrap break-words rounded-2xl bg-muted/40 p-4 text-sm leading-relaxed text-foreground">{{ PUBLISH_LAB_RESEARCH_MARKDOWN }}</pre>
        </PanelShell>
      </section>

      <aside class="space-y-4">
        <PanelShell tone="success">
          <div class="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Layers class="size-4 text-emerald-600" />
            掘金小册样本
          </div>
          <div class="mt-3 space-y-2">
            <div v-for="item in PUBLISH_LAB_JUEJIN_BOOKLETS" :key="item.title" class="rounded-xl bg-background p-3 text-xs dark:bg-card">
              <div class="font-medium text-foreground">
                {{ item.title }}
              </div>
              <div class="mt-1 text-muted-foreground">
                {{ item.sales }} 份 · {{ item.price }} · {{ item.revenue }}
              </div>
            </div>
          </div>
        </PanelShell>

        <PanelShell tone="warning">
          <div class="text-sm font-semibold text-foreground">
            核心规律
          </div>
          <ol class="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
            <li v-for="(rule, index) in PUBLISH_LAB_CORE_RULES" :key="rule" class="flex gap-2">
              <span class="font-semibold text-foreground">{{ index + 1 }}.</span>
              <span>{{ rule }}</span>
            </li>
          </ol>
        </PanelShell>

        <PanelShell>
          <div class="text-sm font-semibold text-foreground">
            按起点选路径
          </div>
          <div class="mt-3 space-y-3">
            <div v-for="path in PUBLISH_LAB_PATHS" :key="path.title" class="rounded-xl bg-muted/35 p-3">
              <div class="text-sm font-semibold text-foreground">
                {{ path.title }}
              </div>
              <div class="mt-0.5 text-xs text-muted-foreground">
                {{ path.subtitle }} · {{ path.target }}
              </div>
              <ul class="mt-2 space-y-1 text-xs text-muted-foreground">
                <li v-for="step in path.steps" :key="step">
                  {{ step }}
                </li>
              </ul>
            </div>
          </div>
        </PanelShell>
      </aside>
    </div>
  </WorkflowPageShell>
</template>
