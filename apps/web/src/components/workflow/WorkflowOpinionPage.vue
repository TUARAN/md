<script setup lang="ts">
import type { Component } from 'vue'
import { ClipboardCheck, Copy, ExternalLink, FileText, Hash, MessageCircle, Repeat2, Send, Sparkles } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { computed, nextTick, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PanelShell } from '@/components/ui/layout'
import { Textarea } from '@/components/ui/textarea'
import { APP_NAME } from '@/constants/branding'
import { useEditorStore } from '@/stores/editor'
import { usePostStore } from '@/stores/post'
import { copyPlain } from '@/utils/clipboard'
import { toast } from '@/utils/toast'
import WorkflowPageShell from './WorkflowPageShell.vue'
import WorkflowPageTitle from './WorkflowPageTitle.vue'
import WorkflowSectionTitle from './WorkflowSectionTitle.vue'

type OpinionStageId = `opinion-idea` | `opinion-rewrite` | `opinion-distribution` | `opinion-loop`

interface OpinionStage {
  id: OpinionStageId
  title: string
  subtitle: string
  icon: Component
  goal: string
}

interface OpinionPlatform {
  id: `weibo` | `juejin-pin` | `x` | `xiaohongshu` | `zhihu`
  title: string
  limit: string
  style: string
  url: string
}

const route = useRoute()
const router = useRouter()
const postStore = usePostStore()
const editorStore = useEditorStore()
const { currentPostId } = storeToRefs(postStore)

const opinionStages: OpinionStage[] = [
  {
    id: `opinion-idea`,
    title: `观点提炼`,
    subtitle: `先把一句判断打磨成可传播的观点`,
    icon: MessageCircle,
    goal: `把素材、灵感或长文结论压缩成一个清晰判断，明确受众、立场、证据和讨论钩子。`,
  },
  {
    id: `opinion-rewrite`,
    title: `短内容改写`,
    subtitle: `生成微博、沸点、X、小红书等版本`,
    icon: Sparkles,
    goal: `围绕同一观点生成多个百字左右版本，按平台语气、长度和互动方式做差异化。`,
  },
  {
    id: `opinion-distribution`,
    title: `观点分发`,
    subtitle: `草稿优先，逐个平台确认后发布`,
    icon: Send,
    goal: `参考 Wechatsync 的本地浏览器登录态和草稿优先思路，把短观点作为比长文更靠前的分发入口。`,
  },
  {
    id: `opinion-loop`,
    title: `互动复盘`,
    subtitle: `用评论和转发决定是否扩成文章`,
    icon: Repeat2,
    goal: `记录短观点的互动信号，把高反馈观点回流到文章、小册或项目线继续生产。`,
  },
]

const opinionPlatforms: OpinionPlatform[] = [
  { id: `weibo`, title: `微博`, limit: `80-140 字`, style: `一句判断 + 一句理由 + 互动问题`, url: `https://weibo.com` },
  { id: `juejin-pin`, title: `掘金沸点`, limit: `80-200 字`, style: `开发者场景 + 可验证经验 + 话题标签`, url: `https://juejin.cn/pin` },
  { id: `x`, title: `X`, limit: `120-240 字`, style: `结论前置 + 线程钩子 + 英文/双语可扩展`, url: `https://x.com/compose/post` },
  { id: `xiaohongshu`, title: `小红书`, limit: `100-300 字`, style: `场景钩子 + 经验清单 + 标签`, url: `https://creator.xiaohongshu.com/publish/publish?from=menu` },
  { id: `zhihu`, title: `知乎想法`, limit: `120-300 字`, style: `观点 + 论据 + 可讨论问题`, url: `https://www.zhihu.com` },
]

const topic = ref(`AI Agent 内容分发`)
const rawOpinion = ref(`真正拉开内容运营差距的，不是单篇文章写得多漂亮，而是观点能不能先被快速验证，再决定是否扩写成长文、小册或项目。`)
const evidence = ref(`短观点发布成本低，能更快拿到评论、点赞、转发和收藏信号。`)
const selectedPlatformId = ref<OpinionPlatform['id']>(`weibo`)

const activeStageId = computed<OpinionStageId>(() => {
  const name = String(route.name ?? ``)
  if (name === `opinion-idea` || name === `opinion-rewrite` || name === `opinion-distribution` || name === `opinion-loop`)
    return name
  return `opinion-idea`
})

const activeStage = computed(() =>
  opinionStages.find(stage => stage.id === activeStageId.value) ?? opinionStages[0],
)

const selectedPlatform = computed(() =>
  opinionPlatforms.find(platform => platform.id === selectedPlatformId.value) ?? opinionPlatforms[0],
)

const platformCopies = computed<Record<OpinionPlatform['id'], string>>(() => {
  const t = topic.value.trim() || `未命名主题`
  const opinion = rawOpinion.value.trim() || `这里填写你的核心观点。`
  const reason = evidence.value.trim() || `这里补一句事实、经验或观察依据。`

  return {
    'weibo': `${opinion}\n\n${reason}\n\n你会先发短观点试水，还是直接写成长文？#${t.replace(/\s+/g, '')}#`,
    'juejin-pin': `最近做 ${t} 有个判断：${opinion}\n\n原因是：${reason}\n\n如果这条反馈不错，我会把它扩成一篇完整复盘。#AI #内容分发 #开发者`,
    'x': `${opinion}\n\nWhy: ${reason}\n\nShort posts are cheap probes. If the signal is strong, turn it into a long-form article, booklet, or project.`,
    'xiaohongshu': `${t} 这件事，我现在更相信一个顺序：先发观点，再写长文。\n\n${opinion}\n\n我的依据：${reason}\n\n适合先用短内容验证选题，再决定要不要投入更多时间。\n\n#AI工具 #内容运营 #自媒体 #开发者成长`,
    'zhihu': `关于「${t}」，我的判断是：${opinion}\n\n这个判断的依据是：${reason}\n\n如果把短观点当作选题验证入口，它可以帮助创作者更早发现哪些问题值得展开。你怎么看？`,
  }
})

const selectedCopy = computed(() => platformCopies.value[selectedPlatform.value.id])

const opinionPrompt = computed(() => [
  `你是 ${APP_NAME} 的短观点分发助手。请把下方观点改写成适合多个平台发布的百字短内容。`,
  ``,
  `主题：${topic.value.trim() || `{填写主题}`}`,
  `核心观点：${rawOpinion.value.trim() || `{填写观点}`}`,
  `依据：${evidence.value.trim() || `{填写依据}`}`,
  ``,
  `请分别输出：`,
  `1. 微博：80-140 字，一句判断 + 一句理由 + 互动问题。`,
  `2. 掘金沸点：80-200 字，开发者场景更明确，带 2-3 个话题标签。`,
  `3. X：120-240 字，结论前置，可英文或中英混合。`,
  `4. 小红书：100-300 字，场景钩子 + 经验判断 + 标签。`,
  `5. 知乎想法：120-300 字，观点、论据和可讨论问题齐全。`,
  ``,
  `要求：不要编造事实；不要写成完整文章；每个平台只给最终可发布正文。`,
].join(`\n`))

const distributionChecklist = [
  `先确认账号已登录，短内容仍按草稿优先处理。`,
  `微博 / 沸点 / X 适合先测观点；微信公众号 / CSDN / 掘金文章适合承接高反馈选题。`,
  `发布后记录 2 小时、24 小时的评论、点赞、收藏、转发。`,
  `高反馈观点回流到文章线；体系化观点进入小册线；工具型观点进入项目线。`,
]

async function copySelectedCopy() {
  try {
    await copyPlain(selectedCopy.value)
    toast.success(`已复制${selectedPlatform.value.title}版本`)
  }
  catch {
    toast.error(`复制失败`)
  }
}

async function copyPrompt() {
  try {
    await copyPlain(opinionPrompt.value)
    toast.success(`已复制短观点提示词`)
  }
  catch {
    toast.error(`复制失败`)
  }
}

async function createOpinionDraft() {
  const markdown = [
    `# ${topic.value.trim() || `短观点分发草稿`}`,
    ``,
    `## 核心观点`,
    ``,
    rawOpinion.value.trim() || `这里填写你的核心观点。`,
    ``,
    `## 依据`,
    ``,
    evidence.value.trim() || `这里填写证据或经验。`,
    ``,
    `## 平台版本`,
    ``,
    ...opinionPlatforms.flatMap(platform => [
      `### ${platform.title}`,
      ``,
      platformCopies.value[platform.id],
      ``,
    ]),
    `## 分发检查`,
    ``,
    ...distributionChecklist.map(item => `- ${item}`),
  ].join(`\n`)

  postStore.addPost(`${topic.value.trim() || `短观点`} · 观点分发`)
  const postId = currentPostId.value
  if (postId)
    postStore.updatePostContent(postId, markdown)

  await router.push({ name: `sync` })
  await nextTick()
  editorStore.importContent(markdown)
  toast.success(`已生成观点分发草稿`)
}

function openStage(stage: OpinionStage) {
  router.push({ name: stage.id })
}

function openPlatform(platform: OpinionPlatform) {
  window.open(platform.url, `_blank`, `noopener,noreferrer`)
}
</script>

<template>
  <WorkflowPageShell>
    <template #header>
      <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div class="min-w-0 space-y-3">
          <div class="inline-flex rounded-full border border-border/70 bg-white/70 px-2.5 py-1 text-xs font-medium text-muted-foreground dark:bg-card">
            {{ APP_NAME }} · 观点线
          </div>
          <WorkflowPageTitle>
            <template #icon>
              <component :is="activeStage.icon" />
            </template>
            {{ activeStage.title }}
          </WorkflowPageTitle>
          <p class="max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {{ activeStage.goal }}
          </p>
        </div>

        <PanelShell>
          <div class="text-xs font-semibold uppercase text-muted-foreground">
            观点线定位
          </div>
          <div class="mt-3 grid gap-2 text-sm">
            <div class="flex items-start gap-2">
              <Hash class="mt-0.5 size-4 text-primary" />
              <span>适合微博、沸点、X、知乎想法这类百字短内容。</span>
            </div>
            <div class="flex items-start gap-2">
              <ClipboardCheck class="mt-0.5 size-4 text-primary" />
              <span>先验证观点反馈，再决定是否扩写为文章、小册或项目。</span>
            </div>
          </div>
        </PanelShell>
      </div>
    </template>

    <div class="grid gap-4 pb-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(28rem,1fr)]">
      <section class="space-y-4">
        <WorkflowSectionTitle>
          观点阶段
        </WorkflowSectionTitle>

        <div class="grid gap-3">
          <button
            v-for="stage in opinionStages"
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
                <span class="mt-1 block text-xs leading-relaxed text-muted-foreground">{{ stage.subtitle }}</span>
              </span>
            </div>
          </button>
        </div>

        <PanelShell>
          <div class="space-y-3">
            <div class="grid gap-1.5">
              <Label class="text-xs text-muted-foreground">主题</Label>
              <Input v-model="topic" class="h-9" placeholder="例如：AI Agent 内容分发" />
            </div>
            <div class="grid gap-1.5">
              <Label class="text-xs text-muted-foreground">核心观点</Label>
              <Textarea v-model="rawOpinion" class="min-h-28 resize-none" placeholder="写下一句你想先验证的判断。" />
            </div>
            <div class="grid gap-1.5">
              <Label class="text-xs text-muted-foreground">依据 / 观察</Label>
              <Textarea v-model="evidence" class="min-h-24 resize-none" placeholder="补充一条事实、经验或案例，不要编造数据。" />
            </div>
          </div>
        </PanelShell>
      </section>

      <section class="space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <WorkflowSectionTitle>
            平台版本
          </WorkflowSectionTitle>
          <div class="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="secondary" @click="copyPrompt">
              <Copy class="mr-1.5 size-3.5" />
              复制提示词
            </Button>
            <Button type="button" size="sm" @click="createOpinionDraft">
              <FileText class="mr-1.5 size-3.5" />
              生成草稿
            </Button>
          </div>
        </div>

        <div class="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          <button
            v-for="platform in opinionPlatforms"
            :key="platform.id"
            type="button"
            class="rounded-lg border bg-card p-3 text-left transition-colors"
            :class="selectedPlatformId === platform.id ? 'border-primary/50 ring-2 ring-primary/15' : 'border-border/80 hover:border-primary/35'"
            @click="selectedPlatformId = platform.id"
          >
            <span class="block text-sm font-semibold text-foreground">{{ platform.title }}</span>
            <span class="mt-1 block text-xs text-muted-foreground">{{ platform.limit }}</span>
          </button>
        </div>

        <PanelShell tone="primary" radius="xl">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div class="text-sm font-semibold text-foreground">
                {{ selectedPlatform.title }} · {{ selectedPlatform.limit }}
              </div>
              <p class="mt-1 text-xs leading-relaxed text-muted-foreground">
                {{ selectedPlatform.style }}
              </p>
            </div>
            <div class="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="secondary" @click="copySelectedCopy">
                <Copy class="mr-1.5 size-3.5" />
                复制正文
              </Button>
              <Button type="button" size="sm" variant="outline" @click="openPlatform(selectedPlatform)">
                <ExternalLink class="mr-1.5 size-3.5" />
                打开平台
              </Button>
            </div>
          </div>
          <pre class="mt-4 whitespace-pre-wrap break-words rounded-lg border border-border/70 bg-background/80 p-4 text-sm leading-relaxed text-foreground">{{ selectedCopy }}</pre>
        </PanelShell>

        <section class="rounded-lg border border-border/80 bg-card shadow-sm">
          <div class="border-b border-border/70 px-4 py-3">
            <div class="text-sm font-semibold text-foreground">
              分发检查
            </div>
          </div>
          <div class="grid gap-2 p-4">
            <div v-for="item in distributionChecklist" :key="item" class="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
              <ClipboardCheck class="mt-0.5 size-4 shrink-0 text-primary" />
              <span>{{ item }}</span>
            </div>
          </div>
        </section>
      </section>
    </div>
  </WorkflowPageShell>
</template>
