<script setup lang="ts">
import { BarChart3, Bot, Camera, ClipboardCheck, Copy, ExternalLink, Link, RefreshCw, ShieldCheck, Sparkles, Star, UserCheck } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { copyPlain } from '@/utils/clipboard'
import { toast } from '@/utils/toast'
import WorkflowPageShell from './WorkflowPageShell.vue'
import WorkflowPageTitle from './WorkflowPageTitle.vue'
import WorkflowSectionTitle from './WorkflowSectionTitle.vue'

interface PublishedLink {
  id: number
  platform: string
  url: string
  title: string
  publishedAt: string
  reads: number
  likes: number
  comments: number
  collects: number
  shares: number
  score: number
}

const reportTemplates = [
  {
    id: `weekly`,
    name: `周报复盘`,
    summary: `适合对一周内多平台发布效果做横向比较。`,
  },
  {
    id: `single`,
    name: `单篇评估`,
    summary: `适合评估一篇文章的标题、渠道、互动与后续改稿。`,
  },
  {
    id: `client`,
    name: `客户交付`,
    summary: `强调结论、证据、下一步动作，便于对外汇报。`,
  },
] as const

const accuracySteps = [
  {
    title: `自动抓取数据`,
    summary: `对支持接口或页面抓取的平台，自动采集阅读、互动与发布数据，形成基础数据源。`,
    icon: Bot,
    tone: `text-indigo-600 bg-indigo-50 border-indigo-100`,
  },
  {
    title: `快照补充校验`,
    summary: `对不支持直接抓取的平台，由本地 Agent 调用浏览器查询，或人工上传截图快照留痕。`,
    icon: Camera,
    tone: `text-emerald-600 bg-emerald-50 border-emerald-100`,
  },
  {
    title: `人工复核异常`,
    summary: `人工复核异常值、缺失值和口径不一致的数据，确认后再进入最终汇报。`,
    icon: UserCheck,
    tone: `text-amber-600 bg-amber-50 border-amber-100`,
  },
] as const

const activeTemplateId = ref<(typeof reportTemplates)[number]['id']>(`weekly`)
const linkInput = ref(``)
const reportNote = ref(`目标：验证技术长文在开发者平台的阅读效率，并判断是否值得拆成短内容二次分发。`)
const isFetching = ref(false)
const publishedLinks = ref<PublishedLink[]>([
  {
    id: 1,
    platform: `CSDN`,
    url: `https://blog.csdn.net/tuaran/article/details/ai-agent-workflow`,
    title: `AI Agent 工作流从素材到发布的自动化实践`,
    publishedAt: `2026-05-20`,
    reads: 4280,
    likes: 126,
    comments: 24,
    collects: 83,
    shares: 37,
    score: 86,
  },
  {
    id: 2,
    platform: `掘金`,
    url: `https://juejin.cn/post/ai-agent-workflow`,
    title: `用工作流把 AI 内容生产跑成闭环`,
    publishedAt: `2026-05-21`,
    reads: 2360,
    likes: 91,
    comments: 18,
    collects: 64,
    shares: 22,
    score: 78,
  },
])

const activeTemplate = computed(() =>
  reportTemplates.find(t => t.id === activeTemplateId.value) ?? reportTemplates[0],
)

const totals = computed(() => publishedLinks.value.reduce(
  (acc, item) => {
    acc.reads += item.reads
    acc.likes += item.likes
    acc.comments += item.comments
    acc.collects += item.collects
    acc.shares += item.shares
    return acc
  },
  { reads: 0, likes: 0, comments: 0, collects: 0, shares: 0 },
))

const averageScore = computed(() => {
  if (!publishedLinks.value.length)
    return 0
  return Math.round(publishedLinks.value.reduce((sum, item) => sum + item.score, 0) / publishedLinks.value.length)
})

const bestLink = computed(() =>
  [...publishedLinks.value].sort((a, b) => b.score - a.score)[0] ?? null,
)

const reportMarkdown = computed(() => {
  const rows = publishedLinks.value.map(item =>
    `| ${item.platform} | [${item.title}](${item.url}) | ${item.reads.toLocaleString()} | ${item.likes} | ${item.comments} | ${item.collects} | ${item.shares} | ${item.score} |`,
  ).join(`\n`)

  const conclusion = averageScore.value >= 80
    ? `整体表现良好，适合继续扩大分发，并将高分平台作为首发或重点维护渠道。`
    : `整体表现仍有提升空间，建议先优化标题、封面与发布时间，再扩大分发。`

  const recommendation = bestLink.value
    ? `本轮最佳平台是 ${bestLink.value.platform}，评分 ${bestLink.value.score}。建议复用其标题表达、摘要结构和互动引导方式。`
    : `暂无可评估链接。`

  return [
    `# ${activeTemplate.value.name} · 数据闭环`,
    ``,
    `## 1. 数据来源`,
    `已发布链接 ${publishedLinks.value.length} 条，覆盖 ${publishedLinks.value.map(item => item.platform).join(`、`) || `未选择平台`}。`,
    ``,
    `## 2. 核心指标`,
    `- 总阅读：${totals.value.reads.toLocaleString()}`,
    `- 总互动：${(totals.value.likes + totals.value.comments + totals.value.collects + totals.value.shares).toLocaleString()}`,
    `- 平均评分：${averageScore.value}/100`,
    ``,
    `| 平台 | 链接 | 阅读 | 点赞 | 评论 | 收藏 | 分享 | 评分 |`,
    `| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |`,
    rows || `| - | - | 0 | 0 | 0 | 0 | 0 | 0 |`,
    ``,
    `## 3. 数据准确性保障`,
    `- 自动抓取数据：对支持接口或页面抓取的平台，自动采集阅读、互动与发布数据，形成基础数据源。`,
    `- 快照补充校验：对不支持直接抓取的平台，由本地 Agent 调用浏览器查询，或人工上传截图快照留痕。`,
    `- 人工复核异常：人工复核异常值、缺失值和口径不一致的数据，确认后再进入最终汇报。`,
    `- 闭环原则：自动采集提升效率，快照留痕保证可追溯，人工复核兜底排除异常。`,
    ``,
    `## 4. 分析评价`,
    `${conclusion}`,
    ``,
    `${recommendation}`,
    ``,
    `## 5. 下一步动作`,
    `- 对评分最高的平台保留同类选题，继续观察 24h / 72h 数据变化。`,
    `- 对低互动平台重写标题与首段，把结论前置，并补充评论区引导。`,
    `- 将表现最好的长文拆成 3–5 条短内容，回流到数据策略继续分发。`,
    ``,
    `## 6. 备注`,
    reportNote.value.trim() || `无`,
  ].join(`\n`)
})

function inferPlatform(url: string) {
  const lower = url.toLowerCase()
  if (lower.includes(`csdn`))
    return `CSDN`
  if (lower.includes(`juejin`))
    return `掘金`
  if (lower.includes(`zhihu`))
    return `知乎`
  if (lower.includes(`cloud.tencent`))
    return `腾讯云社区`
  if (lower.includes(`aliyun`))
    return `阿里云社区`
  return `自定义链接`
}

function parsePublishedUrls(input: string) {
  const existingUrls = new Set(publishedLinks.value.map(item => item.url))
  const uniqueUrls = new Set<string>()

  return input
    .split(/[,\n\r]+/)
    .map(url => url.trim())
    .filter(Boolean)
    .filter((url) => {
      if (existingUrls.has(url) || uniqueUrls.has(url))
        return false
      uniqueUrls.add(url)
      return true
    })
}

function createPublishedLink(url: string, index: number): PublishedLink {
  const seed = Array.from(url).reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return {
    id: Date.now() + index,
    platform: inferPlatform(url),
    url,
    title: `待复盘内容 ${publishedLinks.value.length + index + 1}`,
    publishedAt: new Date().toISOString().slice(0, 10),
    reads: 800 + (seed % 4200),
    likes: 20 + (seed % 140),
    comments: 4 + (seed % 36),
    collects: 10 + (seed % 90),
    shares: 3 + (seed % 48),
    score: 62 + (seed % 31),
  }
}

function addPublishedLinks() {
  const urls = parsePublishedUrls(linkInput.value)
  if (!linkInput.value.trim()) {
    toast.error(`请输入已发布链接`)
    return
  }

  if (!urls.length) {
    toast.error(`没有可加入的新链接`)
    return
  }

  publishedLinks.value.unshift(...urls.map(createPublishedLink))
  linkInput.value = ``
  toast.success(`已加入 ${urls.length} 条抓取队列`)
}

async function refreshMetrics() {
  if (!publishedLinks.value.length) {
    toast.error(`请先加入已发布链接`)
    return
  }
  isFetching.value = true
  await new Promise(resolve => setTimeout(resolve, 550))
  publishedLinks.value = publishedLinks.value.map((item, index) => ({
    ...item,
    reads: item.reads + 120 + index * 37,
    likes: item.likes + 3 + index,
    comments: item.comments + (index % 2 === 0 ? 2 : 1),
    collects: item.collects + 2,
    shares: item.shares + 1,
    score: Math.min(96, item.score + (index === 0 ? 2 : 1)),
  }))
  isFetching.value = false
  toast.success(`已刷新模拟数据`)
}

async function copyReport() {
  try {
    await copyPlain(reportMarkdown.value)
    toast.success(`已复制数据闭环`)
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
        AI分发大师 · 文章线
      </div>
      <WorkflowPageTitle>
        <template #icon>
          <BarChart3 />
        </template>
        数据闭环
      </WorkflowPageTitle>
      <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
        汇总发布数据、平台表现和下一步动作；AI 自动生成的复盘报告是 Pro 能力之一。
      </p>
    </template>

    <div class="grid min-h-0 gap-4 pb-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(26rem,1.05fr)]">
      <section class="space-y-4">
        <div class="rounded-[22px] border border-gray-200 bg-white/85 p-4 shadow-sm dark:border-border dark:bg-card">
          <WorkflowSectionTitle>
            已发布链接
          </WorkflowSectionTitle>
          <div class="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <div class="relative">
              <Link class="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground" />
              <Textarea
                v-model="linkInput"
                class="min-h-20 resize-none rounded-lg border-slate-200 bg-white py-3 pl-9 text-sm leading-relaxed focus-visible:ring-indigo-500 dark:border-border dark:bg-background"
                placeholder="粘贴 CSDN、掘金、知乎等已发布链接；多个链接请用英文逗号 , 隔开"
              />
            </div>
            <Button class="h-10 rounded-lg bg-indigo-600 px-4 text-white hover:bg-indigo-700 sm:self-start" type="button" @click="addPublishedLinks">
              加入抓取
            </Button>
          </div>
          <p class="mt-2 text-xs leading-relaxed text-muted-foreground">
            支持批量粘贴，格式示例：链接1, 链接2, 链接3；重复链接会自动跳过。
          </p>

          <div class="mt-4 grid gap-2">
            <article
              v-for="item in publishedLinks"
              :key="item.id"
              class="rounded-xl border border-border/80 bg-muted/10 p-3"
            >
              <div class="flex flex-wrap items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="flex flex-wrap items-center gap-2 text-xs">
                    <span class="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">{{ item.platform }}</span>
                    <span class="text-muted-foreground">{{ item.publishedAt }}</span>
                  </p>
                  <a
                    class="mt-1 inline-flex max-w-full items-center gap-1 text-sm font-medium text-foreground hover:text-primary"
                    :href="item.url"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span class="truncate">{{ item.title }}</span>
                    <ExternalLink class="size-3.5 shrink-0" />
                  </a>
                </div>
                <div class="text-right">
                  <p class="text-xs text-muted-foreground">
                    综合评分
                  </p>
                  <p class="text-xl font-semibold tabular-nums text-primary">
                    {{ item.score }}
                  </p>
                </div>
              </div>
              <dl class="mt-3 grid grid-cols-5 gap-2 text-center text-xs">
                <div class="rounded-lg bg-white/80 px-2 py-1.5 dark:bg-background/50">
                  <dt class="text-muted-foreground">
                    阅读
                  </dt>
                  <dd class="mt-0.5 font-semibold tabular-nums">
                    {{ item.reads.toLocaleString() }}
                  </dd>
                </div>
                <div class="rounded-lg bg-white/80 px-2 py-1.5 dark:bg-background/50">
                  <dt class="text-muted-foreground">
                    点赞
                  </dt>
                  <dd class="mt-0.5 font-semibold tabular-nums">
                    {{ item.likes }}
                  </dd>
                </div>
                <div class="rounded-lg bg-white/80 px-2 py-1.5 dark:bg-background/50">
                  <dt class="text-muted-foreground">
                    评论
                  </dt>
                  <dd class="mt-0.5 font-semibold tabular-nums">
                    {{ item.comments }}
                  </dd>
                </div>
                <div class="rounded-lg bg-white/80 px-2 py-1.5 dark:bg-background/50">
                  <dt class="text-muted-foreground">
                    收藏
                  </dt>
                  <dd class="mt-0.5 font-semibold tabular-nums">
                    {{ item.collects }}
                  </dd>
                </div>
                <div class="rounded-lg bg-white/80 px-2 py-1.5 dark:bg-background/50">
                  <dt class="text-muted-foreground">
                    分享
                  </dt>
                  <dd class="mt-0.5 font-semibold tabular-nums">
                    {{ item.shares }}
                  </dd>
                </div>
              </dl>
            </article>
          </div>
        </div>

        <div class="rounded-[22px] border border-gray-200 bg-white/85 p-4 shadow-sm dark:border-border dark:bg-card">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <WorkflowSectionTitle>
              数据分析
            </WorkflowSectionTitle>
            <Button
              class="h-8 rounded-lg text-xs"
              type="button"
              variant="outline"
              :disabled="isFetching"
              @click="refreshMetrics"
            >
              <RefreshCw class="mr-1.5 size-3.5" :class="{ 'animate-spin': isFetching }" />
              刷新数据
            </Button>
          </div>
          <div class="mt-3 grid gap-3 sm:grid-cols-3">
            <div class="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 dark:border-border dark:bg-background">
              <p class="text-xs text-muted-foreground">
                总阅读
              </p>
              <p class="mt-1 text-2xl font-semibold tabular-nums">
                {{ totals.reads.toLocaleString() }}
              </p>
            </div>
            <div class="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 dark:border-border dark:bg-background">
              <p class="text-xs text-muted-foreground">
                总互动
              </p>
              <p class="mt-1 text-2xl font-semibold tabular-nums">
                {{ (totals.likes + totals.comments + totals.collects + totals.shares).toLocaleString() }}
              </p>
            </div>
            <div class="rounded-xl border border-amber-100 bg-amber-50/70 p-3 dark:border-border dark:bg-background">
              <p class="text-xs text-muted-foreground">
                平均评分
              </p>
              <p class="mt-1 flex items-center gap-1 text-2xl font-semibold tabular-nums">
                {{ averageScore }}
                <Star class="size-4 fill-amber-400 text-amber-500" />
              </p>
            </div>
          </div>
        </div>

        <div class="rounded-[22px] border border-gray-200 bg-white/85 p-4 shadow-sm dark:border-border dark:bg-card">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <WorkflowSectionTitle>
              数据准确性闭环
            </WorkflowSectionTitle>
            <span class="inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:border-border dark:bg-background dark:text-emerald-300">
              <ShieldCheck class="size-3.5" />
              三步校验
            </span>
          </div>
          <div class="mt-3 grid gap-2">
            <article
              v-for="(step, index) in accuracySteps"
              :key="step.title"
              class="flex gap-3 rounded-xl border border-border/80 bg-muted/10 p-3"
            >
              <div
                class="flex size-9 shrink-0 items-center justify-center rounded-lg border"
                :class="step.tone"
              >
                <component :is="step.icon" class="size-4" />
              </div>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-foreground">
                  {{ index + 1 }}. {{ step.title }}
                </p>
                <p class="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {{ step.summary }}
                </p>
              </div>
            </article>
          </div>
          <p class="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600 dark:bg-background dark:text-muted-foreground">
            自动采集提升效率，快照留痕保证可追溯，人工复核兜底排除异常，最终保障汇报数据准确可靠。
          </p>
        </div>
      </section>

      <section class="flex min-h-0 flex-col gap-4">
        <div class="rounded-[22px] border border-gray-200 bg-white/85 p-4 shadow-sm dark:border-border dark:bg-card">
          <WorkflowSectionTitle>
            汇报模版
          </WorkflowSectionTitle>
          <div class="mt-3 grid gap-2 sm:grid-cols-3">
            <button
              v-for="template in reportTemplates"
              :key="template.id"
              class="rounded-xl border p-3 text-left transition-colors"
              :class="activeTemplateId === template.id
                ? 'border-primary/50 bg-primary/[0.08] text-foreground ring-1 ring-primary/15'
                : 'border-border/80 bg-muted/10 text-muted-foreground hover:bg-muted/30'"
              type="button"
              @click="activeTemplateId = template.id"
            >
              <span class="text-sm font-semibold">{{ template.name }}</span>
              <span class="mt-1 block text-xs leading-relaxed">{{ template.summary }}</span>
            </button>
          </div>
          <div class="mt-4 grid gap-1.5">
            <Label class="text-xs text-muted-foreground">补充说明</Label>
            <Textarea
              v-model="reportNote"
              class="min-h-20 resize-none rounded-xl border-slate-200 bg-white text-sm focus-visible:ring-indigo-500 dark:border-border dark:bg-background"
              placeholder="写入本轮目标、投放背景、客户要求或观察口径"
            />
          </div>
        </div>

        <div class="flex min-h-0 flex-1 flex-col gap-2">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <WorkflowSectionTitle>
              报告与评价
            </WorkflowSectionTitle>
            <Button class="h-9 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white hover:bg-indigo-700" type="button" @click="copyReport">
              <Copy class="mr-1.5 size-3.5" />
              复制报告
            </Button>
          </div>
          <pre class="min-h-[420px] flex-1 overflow-auto whitespace-pre-wrap break-words rounded-2xl border border-gray-200 bg-white/85 p-4 text-xs leading-relaxed text-slate-700 shadow-sm dark:border-border dark:bg-background dark:text-muted-foreground">{{ reportMarkdown }}</pre>
          <div class="grid gap-2 rounded-2xl border border-slate-200 bg-white/70 p-3 text-xs leading-relaxed text-slate-600 dark:border-border dark:bg-card dark:text-muted-foreground sm:grid-cols-3">
            <p class="flex gap-1.5">
              <ClipboardCheck class="mt-0.5 size-3.5 shrink-0 text-indigo-600" />
              链接进入抓取队列后形成指标表。
            </p>
            <p class="flex gap-1.5">
              <Sparkles class="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
              按模版沉淀可复用汇报结构。
            </p>
            <p class="flex gap-1.5">
              <Bot class="mt-0.5 size-3.5 shrink-0 text-amber-600" />
              评价结果回流到下一轮选题与分发。
            </p>
          </div>
        </div>
      </section>
    </div>
  </WorkflowPageShell>
</template>
