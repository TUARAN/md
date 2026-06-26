<script setup lang="ts">
/**
 * BookletDistribute —— 「小册」内容类型的分发台。
 *
 * 小册分发 = 整册发布到长文平台 / 导出为独立小册站点。本页负责把多章节
 * 装配成整册：选发布目标（知乎专栏 / 公众号合集 / 掘金专栏）→ 导出整册
 * Markdown 包，或复制后交给发布插件。静态小册站点生成为后续子步骤。
 */
import { BookOpen, Copy, Download, GripVertical, Plus, Trash2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PanelShell } from '@/components/ui/layout'
import { Textarea } from '@/components/ui/textarea'
import WorkflowPageShell from '@/components/workflow/WorkflowPageShell.vue'
import WorkflowPageTitle from '@/components/workflow/WorkflowPageTitle.vue'
import WorkflowSectionTitle from '@/components/workflow/WorkflowSectionTitle.vue'
import { APP_NAME } from '@/constants/branding'
import { useUIStore } from '@/stores/ui'
import { downloadMD } from '@/utils'
import { copyPlain } from '@/utils/clipboard'
import { store } from '@/utils/storage'
import { toast } from '@/utils/toast'

interface Chapter { id: string, title: string, content: string }

const uiStore = useUIStore()

const bookletTitle = store.reactive(`booklet_distribute_title`, `我的小册`)
const bookletIntro = store.reactive(`booklet_distribute_intro`, ``)
const chapters = store.reactive<Chapter[]>(`booklet_distribute_chapters`, [
  { id: `c1`, title: `第一章`, content: `` },
])

const PUBLISH_TARGETS = [
  { id: `zhihu-column`, title: `知乎专栏`, hint: `逐章发布到同一专栏，形成系列` },
  { id: `mp-collection`, title: `公众号合集`, hint: `逐篇推送并加入合集` },
  { id: `juejin-column`, title: `掘金专栏`, hint: `作为掘金专栏系列文章` },
] as const

const selectedTargets = store.reactive<string[]>(`booklet_distribute_targets`, [`zhihu-column`])

const assembledMarkdown = computed(() => {
  const parts: string[] = [`# ${bookletTitle.value.trim() || `未命名小册`}`]
  if (bookletIntro.value.trim())
    parts.push(bookletIntro.value.trim())
  parts.push(`## 目录`)
  parts.push(chapters.value.map((c, i) => `${i + 1}. ${c.title.trim() || `未命名章节`}`).join(`\n`))
  for (const c of chapters.value) {
    parts.push(`---`)
    parts.push(`# ${c.title.trim() || `未命名章节`}`)
    parts.push(c.content.trim() || `_（本章待补充）_`)
  }
  return parts.join(`\n\n`)
})

const chapterCount = computed(() => chapters.value.length)
const wordCount = computed(() => chapters.value.reduce((n, c) => n + c.content.replace(/\s/g, ``).length, 0))

function addChapter() {
  chapters.value = [...chapters.value, { id: `c${Date.now()}`, title: `第 ${chapters.value.length + 1} 章`, content: `` }]
}

function removeChapter(id: string) {
  if (chapters.value.length <= 1) {
    toast.error(`至少保留一个章节`)
    return
  }
  chapters.value = chapters.value.filter(c => c.id !== id)
}

function moveChapter(index: number, dir: -1 | 1) {
  const next = index + dir
  if (next < 0 || next >= chapters.value.length)
    return
  const copy = [...chapters.value]
  ;[copy[index], copy[next]] = [copy[next], copy[index]]
  chapters.value = copy
}

function toggleTarget(id: string) {
  selectedTargets.value = selectedTargets.value.includes(id)
    ? selectedTargets.value.filter(x => x !== id)
    : [...selectedTargets.value, id]
}

function exportBundle() {
  downloadMD(assembledMarkdown.value, bookletTitle.value.trim() || `booklet`)
  toast.success(`整册 Markdown 已导出`)
}

async function copyAssembled() {
  try {
    await copyPlain(assembledMarkdown.value)
    toast.success(`整册内容已复制`)
  }
  catch {
    toast.error(`复制失败`)
  }
}

function openInEditor() {
  uiStore.creationDraftMarkdown = assembledMarkdown.value
  toast.success(`已写入草稿，去文章分发台排版发布`)
}
</script>

<template>
  <WorkflowPageShell>
    <template #header>
      <div class="mb-3 inline-flex rounded-full border border-border/70 bg-white/70 px-2.5 py-1 text-xs font-medium text-muted-foreground dark:bg-card">
        {{ APP_NAME }} · 小册分发
      </div>
      <WorkflowPageTitle>
        <template #icon>
          <BookOpen />
        </template>
        小册整册分发
      </WorkflowPageTitle>
      <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
        装配多章节，选好发布目标，整册导出 Markdown 包或交给发布插件铺到知乎专栏、公众号合集、掘金专栏。
        当前 <span class="font-medium text-foreground">{{ chapterCount }}</span> 章 · 约
        <span class="font-medium text-foreground">{{ wordCount }}</span> 字。
      </p>
    </template>

    <div class="grid min-h-0 gap-4 lg:grid-cols-[20rem_minmax(0,1fr)] lg:items-start">
      <!-- 左：整册信息 + 发布目标 -->
      <aside class="min-w-0 space-y-4 lg:sticky lg:top-3">
        <PanelShell tone="neutral" radius="md" padding="md" flat>
          <WorkflowSectionTitle>
            整册信息
          </WorkflowSectionTitle>
          <div class="mt-3 space-y-3">
            <div class="space-y-1">
              <Label class="text-xs">小册标题</Label>
              <Input v-model="bookletTitle" placeholder="小册名" />
            </div>
            <div class="space-y-1">
              <Label class="text-xs">小册简介</Label>
              <Textarea v-model="bookletIntro" :rows="3" placeholder="这本小册讲什么、适合谁" />
            </div>
          </div>
        </PanelShell>

        <PanelShell tone="neutral" radius="md" padding="md" flat>
          <WorkflowSectionTitle>
            发布目标
          </WorkflowSectionTitle>
          <div class="mt-3 space-y-2">
            <button
              v-for="t in PUBLISH_TARGETS"
              :key="t.id"
              type="button"
              class="flex w-full items-start gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors"
              :class="selectedTargets.includes(t.id)
                ? 'border-primary/45 bg-primary/[0.08] ring-1 ring-primary/15'
                : 'border-border/70 hover:border-border hover:bg-muted/40'"
              @click="toggleTarget(t.id)"
            >
              <span
                class="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border text-[10px] font-semibold"
                :class="selectedTargets.includes(t.id) ? 'border-primary bg-primary text-primary-foreground' : 'border-border/70 text-transparent'"
              >✓</span>
              <span class="min-w-0">
                <span class="block text-sm font-medium" :class="selectedTargets.includes(t.id) ? 'text-primary' : 'text-foreground'">{{ t.title }}</span>
                <span class="mt-0.5 block text-[11px] text-muted-foreground">{{ t.hint }}</span>
              </span>
            </button>
          </div>

          <div class="mt-4 space-y-2">
            <Button class="w-full gap-1.5" @click="exportBundle">
              <Download class="size-4" />
              导出整册 Markdown 包
            </Button>
            <Button variant="outline" class="w-full gap-1.5" @click="copyAssembled">
              <Copy class="size-4" />
              复制整册内容
            </Button>
            <Button variant="outline" class="w-full gap-1.5" @click="openInEditor">
              <BookOpen class="size-4" />
              写入草稿去排版
            </Button>
          </div>

          <p class="mt-3 rounded-lg border border-dashed border-border bg-muted/15 px-2.5 py-2 text-[11px] leading-relaxed text-muted-foreground">
            生成独立「小册站点」（VitePress / mdBook）即将推出；当前先用导出 + 发布插件铺到长文平台。
          </p>
        </PanelShell>
      </aside>

      <!-- 右：章节装配 -->
      <main class="min-w-0 space-y-3">
        <div class="flex items-center justify-between">
          <WorkflowSectionTitle>
            章节装配
          </WorkflowSectionTitle>
          <Button variant="outline" size="sm" class="gap-1.5" @click="addChapter">
            <Plus class="size-3.5" />
            添加章节
          </Button>
        </div>

        <div
          v-for="(c, i) in chapters"
          :key="c.id"
          class="rounded-[16px] border border-border/80 bg-white/80 p-3 dark:bg-card"
        >
          <div class="flex items-center gap-2">
            <span class="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">{{ i + 1 }}</span>
            <Input v-model="c.title" class="h-8 flex-1" placeholder="章节标题" />
            <div class="flex shrink-0 items-center gap-0.5">
              <button type="button" class="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30" :disabled="i === 0" title="上移" @click="moveChapter(i, -1)">
                <GripVertical class="size-4 rotate-90" />
              </button>
              <button type="button" class="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" title="删除章节" @click="removeChapter(c.id)">
                <Trash2 class="size-4" />
              </button>
            </div>
          </div>
          <Textarea v-model="c.content" :rows="5" class="mt-2 font-mono text-xs" placeholder="本章 Markdown 内容…" />
        </div>
      </main>
    </div>
  </WorkflowPageShell>
</template>
