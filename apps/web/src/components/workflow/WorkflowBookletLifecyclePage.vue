<script setup lang="ts">
import type { Component } from 'vue'
import { Copy, FileText, Repeat2, TrendingUp } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { PanelShell } from '@/components/ui/layout'
import { useEditorStore } from '@/stores/editor'
import { usePostStore } from '@/stores/post'
import { copyPlain } from '@/utils/clipboard'
import { toast } from '@/utils/toast'
import WorkflowPageShell from './WorkflowPageShell.vue'
import WorkflowPageTitle from './WorkflowPageTitle.vue'
import WorkflowSectionTitle from './WorkflowSectionTitle.vue'

type BookletLifecycleStageId = `booklet-operation` | `booklet-loop`

interface BookletLifecycleStage {
  id: BookletLifecycleStageId
  title: string
  badge: string
  icon: Component
  summary: string
  outputs: string[]
  playbook: string[]
}

const route = useRoute()
const router = useRouter()
const postStore = usePostStore()
const editorStore = useEditorStore()
const { currentPostId } = storeToRefs(postStore)

const lifecycleStages: BookletLifecycleStage[] = [
  {
    id: `booklet-operation`,
    title: `矩阵运营`,
    badge: `内容同步智能体 · 小册线`,
    icon: TrendingUp,
    summary: `把小册从“写完”推进到“有人看到、有人购买、有人反馈”，设计预热、转化、交付和复购动作。`,
    outputs: [`首发预热节奏`, `销售页文案`, `样章分发计划`, `社群交付 SOP`],
    playbook: [`拆 3 篇样章做内容种草`, `设计限时权益和早鸟价`, `把购买用户导入交付社群`, `每周发布一次学员进度案例`],
  },
  {
    id: `booklet-loop`,
    title: `数据闭环`,
    badge: `内容同步智能体 · 小册线`,
    icon: Repeat2,
    summary: `用销量、完读率、问题反馈和复购信号反推下一版小册，把内容产品变成可迭代资产。`,
    outputs: [`销售复盘表`, `用户问题池`, `版本迭代清单`, `下一期选题假设`],
    playbook: [`记录每个渠道的点击与转化`, `收集高频卡点并回写章节`, `把好评转成案例素材`, `用反馈决定下一版目录`],
  },
]

const activeStageId = computed<BookletLifecycleStageId>(() =>
  route.name === `booklet-loop` ? `booklet-loop` : `booklet-operation`,
)

const activeStage = computed(() =>
  lifecycleStages.find(stage => stage.id === activeStageId.value) ?? lifecycleStages[0],
)

const lifecycleMarkdown = computed(() => {
  const stage = activeStage.value
  return [
    `# ${stage.title}`,
    ``,
    stage.summary,
    ``,
    `## 需要产出的东西`,
    ``,
    ...stage.outputs.map(item => `- ${item}`),
    ``,
    `## 执行动作`,
    ``,
    ...stage.playbook.map(item => `- ${item}`),
    ``,
    `## 复盘指标`,
    ``,
    `- 曝光：各渠道阅读、收藏、转发`,
    `- 转化：销售页点击、支付转化、退款原因`,
    `- 交付：完读率、作业提交、用户问题`,
    `- 复购：二次购买、推荐、社群留存`,
  ].join(`\n`)
})

async function copyMarkdown() {
  try {
    await copyPlain(lifecycleMarkdown.value)
    toast.success(`已复制${activeStage.value.title}`)
  }
  catch {
    toast.error(`复制失败`)
  }
}

async function createEditorPost() {
  const stage = activeStage.value
  const content = lifecycleMarkdown.value.trim()

  postStore.addPost(stage.title)
  const postId = currentPostId.value
  if (postId)
    postStore.updatePostContent(postId, content)

  await router.push({ name: `sync` })
  await nextTick()
  editorStore.importContent(content)
  toast.success(`已生成小册运营文稿`)
}

function openStage(stage: BookletLifecycleStage) {
  router.push({ name: stage.id })
}
</script>

<template>
  <WorkflowPageShell>
    <template #header>
      <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div class="min-w-0 space-y-3">
          <div class="inline-flex rounded-full border border-border/70 bg-white/70 px-2.5 py-1 text-xs font-medium text-muted-foreground dark:bg-card">
            {{ activeStage.badge }}
          </div>
          <WorkflowPageTitle>
            <template #icon>
              <component :is="activeStage.icon" />
            </template>
            {{ activeStage.title }}
          </WorkflowPageTitle>
          <p class="max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {{ activeStage.summary }}
          </p>
        </div>

        <PanelShell>
          <div class="text-xs font-semibold uppercase text-muted-foreground">
            为什么要有这一层
          </div>
          <p class="mt-3 text-sm leading-relaxed text-muted-foreground">
            小册不是写完就结束。矩阵运营负责让产品被看见和购买，数据闭环负责用真实反馈继续改目录、改交付、改下一期选题。
          </p>
        </PanelShell>
      </div>
    </template>

    <div class="grid gap-4 pb-4 xl:grid-cols-[minmax(0,0.8fr)_minmax(26rem,1fr)]">
      <section class="space-y-4">
        <WorkflowSectionTitle>
          小册后半程
        </WorkflowSectionTitle>

        <div class="grid gap-3">
          <button
            v-for="stage in lifecycleStages"
            :key="stage.id"
            type="button"
            class="rounded-lg border bg-card p-4 text-left shadow-sm transition-colors"
            :class="activeStageId === stage.id ? 'border-primary/50 ring-2 ring-primary/15' : 'border-border/80 hover:border-primary/35'"
            @click="openStage(stage)"
          >
            <div class="flex items-start gap-3">
              <span class="inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-primary/15 bg-primary/10 text-primary">
                <component :is="stage.icon" class="size-5" />
              </span>
              <span class="min-w-0">
                <span class="block text-sm font-semibold text-foreground">{{ stage.title }}</span>
                <span class="mt-1 block text-xs leading-relaxed text-muted-foreground">{{ stage.summary }}</span>
              </span>
            </div>
          </button>
        </div>
      </section>

      <section class="space-y-4">
        <WorkflowSectionTitle>
          当前阶段执行单
        </WorkflowSectionTitle>

        <PanelShell tone="primary" radius="xl">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div class="text-sm font-semibold text-foreground">
                {{ activeStage.title }}
              </div>
              <p class="mt-1 text-sm leading-relaxed text-muted-foreground">
                {{ activeStage.summary }}
              </p>
            </div>
            <div class="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="secondary" @click="copyMarkdown">
                <Copy class="mr-1.5 size-3.5" />
                复制
              </Button>
              <Button type="button" size="sm" @click="createEditorPost">
                <FileText class="mr-1.5 size-3.5" />
                生成文稿
              </Button>
            </div>
          </div>
        </PanelShell>

        <div class="grid gap-3 sm:grid-cols-2">
          <div v-for="output in activeStage.outputs" :key="output" class="rounded-lg border border-border/70 bg-card p-3 text-sm font-semibold text-foreground">
            {{ output }}
          </div>
        </div>

        <section class="rounded-lg border border-border/80 bg-card shadow-sm">
          <div class="border-b border-border/70 px-4 py-3">
            <div class="text-sm font-semibold text-foreground">
              Markdown 执行清单
            </div>
          </div>
          <pre class="max-h-[30rem] overflow-auto whitespace-pre-wrap break-words p-4 text-xs leading-relaxed text-muted-foreground">{{ lifecycleMarkdown }}</pre>
        </section>
      </section>
    </div>
  </WorkflowPageShell>
</template>
