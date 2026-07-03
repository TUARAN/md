<script setup lang="ts">
import {
  ArrowLeft,
  BarChart3,
  Check,
  Copy,
  Database,
  FileText,
  Megaphone,
  MessageCircle,
  PenLine,
  Plug,
  Radio,
  Reply,
  ShieldCheck,
} from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { APP_NAME } from '@/constants/branding'

const router = useRouter()

const editorOrigin = computed(() => (typeof window !== `undefined` ? window.location.origin : `https://md.doocs.org`))
const editorBaseUrl = computed(() => {
  const base = import.meta.env.BASE_URL || `/`
  const normalizedBase = base === `/` ? `` : base.replace(/\/$/, ``)
  return `${editorOrigin.value}${normalizedBase}`
})
const articleImportUrl = computed(() => `${editorBaseUrl.value}/#content-sync`)
const opinionImportUrl = computed(() => `${editorBaseUrl.value}/#opinion-sync`)
const bookletImportUrl = computed(() => `${editorBaseUrl.value}/#booklet-sync`)
const projectImportUrl = computed(() => `${editorBaseUrl.value}/#project-sync`)

/** 工作流定位：外站完成选题/改写后，内容从对应分发台接入，再进入矩阵运营与数据闭环 */
const workflowSteps = [
  { key: `data`, label: `素材采集`, icon: Database, state: `done` },
  { key: `creation`, label: `内容创作`, icon: PenLine, state: `done` },
  { key: `import`, label: `外站接入`, icon: Plug, state: `enter` },
  { key: `sync`, label: `四类分发台`, icon: FileText, state: `next` },
  { key: `distribution`, label: `矩阵运营`, icon: Megaphone, state: `next` },
  { key: `stats`, label: `数据闭环`, icon: BarChart3, state: `next` },
] as const

/**
 * 四种内容类型 × 四条消息:每种类型有独立的 type、必填字段和落地分发台。
 * `entry` 是推荐的 window.open 入口(打开后直接落在对应分发台)。
 */
const messageGroups = computed(() => [
  {
    title: `文章导入`,
    type: `MD_IMPORT_ARTICLE`,
    entry: articleImportUrl.value,
    target: `Markdown 编辑器(文章排版)`,
    note: `适合长文章、调研、教程和公众号稿。正文写入编辑器,排版后分发到公众号、知乎、掘金、CSDN 等平台。`,
    fields: [
      { name: `type`, type: `string`, required: true, desc: `固定为 MD_IMPORT_ARTICLE(兼容 SYNCBLOG_IMPORT_ARTICLE)` },
      { name: `markdown`, type: `string`, required: true, desc: `文章正文(Markdown 文本)` },
      { name: `title`, type: `string`, required: false, desc: `文章标题,将作为当前文稿名` },
      { name: `requestId`, type: `string`, required: false, desc: `自定义请求标识,原样回传至回执,便于多次推送对应` },
      { name: `canonicalUrl`, type: `string`, required: false, desc: `原文链接` },
      { name: `tags`, type: `string[]`, required: false, desc: `标签数组` },
    ],
  },
  {
    title: `观点导入`,
    type: `MD_IMPORT_OPINION`,
    entry: opinionImportUrl.value,
    target: `观点分发台`,
    note: `适合一段百字观点 + 原文链接,分发到微博、沸点、X、即刻、知乎想法等短内容渠道。`,
    fields: [
      { name: `type`, type: `string`, required: true, desc: `固定为 MD_IMPORT_OPINION(兼容 SYNCBLOG_IMPORT_OPINION)` },
      { name: `opinion`, type: `string`, required: true, desc: `观点正文。兼容 content / markdown 字段作为降级输入` },
      { name: `title`, type: `string`, required: false, desc: `来源标题,用于内部识别` },
      { name: `requestId`, type: `string`, required: false, desc: `自定义请求标识,原样回传至回执` },
      { name: `canonicalUrl`, type: `string`, required: false, desc: `原文链接,建议拼进 opinion 正文末尾` },
      { name: `tags`, type: `string[]`, required: false, desc: `标签数组` },
    ],
  },
  {
    title: `电子书导入`,
    type: `MD_IMPORT_BOOKLET`,
    entry: bookletImportUrl.value,
    target: `电子书分发台`,
    note: `适合电子书、付费小册和网文小说。书名、简介、已发布链接填入分发台,再同步到知识付费、小说连载与电子书长尾平台。title 与 url 至少提供一个。`,
    fields: [
      { name: `type`, type: `string`, required: true, desc: `固定为 MD_IMPORT_BOOKLET(兼容 SYNCBLOG_IMPORT_BOOKLET)` },
      { name: `title`, type: `string`, required: true, desc: `书名 / 小册名(与 url 二选一必填,将作为各平台草稿标题)` },
      { name: `url`, type: `string`, required: false, desc: `已发布的电子书 / 小册 / 小说链接(与 title 二选一必填)` },
      { name: `intro`, type: `string`, required: false, desc: `一句话简介,与链接一起填入各平台草稿正文。兼容 summary / content` },
      { name: `requestId`, type: `string`, required: false, desc: `自定义请求标识,原样回传至回执` },
      { name: `tags`, type: `string[]`, required: false, desc: `标签数组` },
    ],
  },
  {
    title: `项目导入`,
    type: `MD_IMPORT_PROJECT`,
    entry: projectImportUrl.value,
    target: `项目分发台`,
    note: `适合 GitHub 等代码仓库项目。仓库链接 + 一句话介绍填入分发台,再同步到开源发布站、开发者社区、社交渠道和云生态平台。`,
    fields: [
      { name: `type`, type: `string`, required: true, desc: `固定为 MD_IMPORT_PROJECT(兼容 SYNCBLOG_IMPORT_PROJECT)` },
      { name: `url`, type: `string`, required: true, desc: `仓库链接(GitHub / Gitee / GitLab 等)。兼容 repoUrl` },
      { name: `summary`, type: `string`, required: false, desc: `一句话项目简介,填入各平台草稿正文。兼容 intro / content` },
      { name: `title`, type: `string`, required: false, desc: `项目名,用于内部识别(平台草稿标题默认取 owner/repo)` },
      { name: `requestId`, type: `string`, required: false, desc: `自定义请求标识,原样回传至回执` },
      { name: `tags`, type: `string[]`, required: false, desc: `标签数组` },
    ],
  },
])

const exampleCode = computed(() => `// 1. 打开接入口(必须用 window.open,这样编辑器才能通过 opener 找到你)
// 每种内容类型有自己的入口,打开后直接落在对应分发台:
// 文章:   ${articleImportUrl.value}
// 观点:   ${opinionImportUrl.value}
// 电子书: ${bookletImportUrl.value}
// 项目:   ${projectImportUrl.value}
const editor = window.open('${articleImportUrl.value}', 'md-editor')

// 2. 等待编辑器发回「就绪」信号,再按内容类型推送对应消息(推送任一条即可)
function onMessage(event) {
  if (event.origin !== '${editorOrigin.value}')
    return

  // 编辑器加载完成后会持续广播 MD_IMPORT_READY
  if (event.data?.type === 'MD_IMPORT_READY') {
    // ① 文章 → Markdown 编辑器
    editor.postMessage({
      type: 'MD_IMPORT_ARTICLE',
      requestId: 'article-demo-1',    // 可选,用于和回执对应
      title: '我的文章标题',          // 可选
      markdown: '# 标题\\n\\n正文内容……', // 必填
      canonicalUrl: 'https://example.com/post/1', // 可选,原文链接
      tags: ['标签A', '标签B'],       // 可选
    }, '${editorOrigin.value}')

    // ② 观点 → 观点分发台
    editor.postMessage({
      type: 'MD_IMPORT_OPINION',
      requestId: 'opinion-demo-1',
      opinion: '这是一段要分发的观点。\\n\\n原文：https://example.com/post/1', // 必填
      title: '我的文章标题',
      canonicalUrl: 'https://example.com/post/1',
      tags: ['观点', 'AI'],
    }, '${editorOrigin.value}')

    // ③ 电子书 → 电子书分发台(title 与 url 至少一个)
    editor.postMessage({
      type: 'MD_IMPORT_BOOKLET',
      requestId: 'booklet-demo-1',
      title: '《我的付费小册》',       // 书名(与 url 二选一必填)
      url: 'https://example.com/booklet/1', // 已发布链接(可选)
      intro: '一本关于内容分发的小册。',    // 可选,一句话简介
      tags: ['小册'],
    }, '${editorOrigin.value}')

    // ④ 项目 → 项目分发台
    editor.postMessage({
      type: 'MD_IMPORT_PROJECT',
      requestId: 'project-demo-1',
      url: 'https://github.com/owner/repo', // 必填,仓库链接
      summary: '一个面向创作者的多平台内容分发工具。', // 可选,一句话简介
      title: 'repo',
      tags: ['开源'],
    }, '${editorOrigin.value}')
  }

  // 导入结果回执
  if (event.data?.type === 'MD_IMPORT_RESULT') {
    console.log('导入', event.data.ok ? '成功' : '失败', event.data.reason)
  }
}

window.addEventListener('message', onMessage)`)

const copied = ref(false)
async function copyExample() {
  try {
    await navigator.clipboard.writeText(exampleCode.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 1600)
  }
  catch {
    // 忽略剪贴板权限错误
  }
}

onMounted(() => {
  document.title = `站外内容接入文档 — ${APP_NAME}`
})

function goBack() {
  router.push({ name: `sync` })
}
</script>

<template>
  <main class="min-h-[100dvh] overflow-y-auto bg-[#e8eaef] text-foreground dark:bg-[#0c0f14]">
    <div class="mx-auto max-w-4xl px-4 py-5 sm:px-6 sm:py-8">
      <!-- 顶栏 -->
      <nav class="mb-4 flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" class="h-8 -ml-2 text-muted-foreground" @click="goBack">
          <ArrowLeft class="mr-1.5 h-4 w-4" />
          返回编辑器
        </Button>
        <span class="font-mono text-[11px] text-muted-foreground">接入文档 · postMessage</span>
      </nav>

      <!-- Hero -->
      <header class="import-docs-hero relative overflow-hidden rounded-2xl px-6 py-7 text-white shadow-lg sm:px-9 sm:py-9">
        <div class="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div class="pointer-events-none absolute -bottom-20 -left-10 h-44 w-44 rounded-full bg-sky-400/20 blur-3xl" />

        <div class="relative">
          <span class="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur">
            <Plug class="h-3.5 w-3.5" />
            站外接入
          </span>
          <h1 class="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            把文章、观点、电子书、项目一键推进分发台
          </h1>
          <p class="mt-2.5 max-w-2xl text-sm leading-relaxed text-white/80">
            站外应用把已经做好的内容直接「推」进来,无需手动复制粘贴。四种内容类型各有独立消息:文章进 Markdown 编辑器,观点进观点分发台,电子书和项目分别进各自分发台。通信基于浏览器原生的
            <code class="rounded bg-white/15 px-1.5 py-0.5 text-[0.85em]">window.postMessage</code>,不依赖任何 SDK 或后端接口。
          </p>
        </div>
      </header>

      <!-- 工作流定位 -->
      <section class="mt-4 rounded-2xl border border-border/70 bg-background p-5 shadow-sm dark:bg-card sm:p-6">
        <h2 class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          在工作流里的位置
        </h2>
        <p class="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          对外站而言，选题、改写和摘录可以在站外完成。内容通过
          <span class="font-medium text-foreground">外站接入</span>
          按类型分流到文章排版、观点、电子书或项目分发台，之后做多平台矩阵运营，再沉淀为数据闭环。
        </p>

        <div class="mt-4 flex flex-wrap items-center gap-2">
          <template v-for="(step, i) in workflowSteps" :key="step.key">
            <div
              class="flex items-center gap-2 rounded-xl border px-3 py-2 transition-colors"
              :class="{
                'border-dashed border-border/70 bg-muted/40 text-muted-foreground/70': step.state === 'done',
                'border-primary/40 bg-primary/[0.07] text-primary ring-1 ring-primary/25 dark:bg-primary/10': step.state === 'enter',
                'border-border/80 bg-background text-foreground/80 dark:bg-background/40': step.state === 'next',
              }"
            >
              <component :is="step.icon" class="h-4 w-4 shrink-0" />
              <div class="flex flex-col leading-tight">
                <span
                  class="text-sm font-medium"
                  :class="{ 'line-through': step.state === 'done' }"
                >{{ step.label }}</span>
                <span v-if="step.state === 'done'" class="text-[10px]">站外已完成</span>
                <span v-else-if="step.state === 'enter'" class="text-[10px] font-semibold">← 外站接入点</span>
                <span v-else class="text-[10px] text-muted-foreground">后续步骤</span>
              </div>
            </div>
            <span v-if="i < workflowSteps.length - 1" class="text-muted-foreground/50">→</span>
          </template>
        </div>
      </section>

      <!-- 工作原理 -->
      <section class="mt-4 rounded-2xl border border-border/70 bg-background p-5 shadow-sm dark:bg-card sm:p-6">
        <h2 class="flex items-center gap-2 text-base font-semibold">
          <FileText class="h-4 w-4 text-primary" />
          工作原理
        </h2>
        <ol class="mt-3 space-y-2.5">
          <li
            v-for="(text, i) in [
              `你的站点用 window.open() 打开对应内容类型的接入口(见下方各消息的「入口」,打开任意页面也可以,消息会自动路由)。`,
              `编辑器加载完成后,持续向「打开它的窗口」(opener)广播就绪信号 MD_IMPORT_READY。`,
              `你收到就绪信号后,按内容类型 postMessage 一条 MD_IMPORT_ARTICLE / MD_IMPORT_OPINION / MD_IMPORT_BOOKLET / MD_IMPORT_PROJECT 消息。`,
              `编辑器把内容写入对应分发台(文章写入编辑器正文,其余填入分发台表单),并向你回传 MD_IMPORT_RESULT 回执。`,
            ]"
            :key="i"
            class="flex gap-3 text-sm leading-relaxed text-muted-foreground"
          >
            <span class="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
              {{ i + 1 }}
            </span>
            <span>{{ text }}</span>
          </li>
        </ol>
      </section>

      <!-- 推送消息字段 -->
      <section class="mt-4 rounded-2xl border border-border/70 bg-background p-5 shadow-sm dark:bg-card sm:p-6">
        <h2 class="flex items-center gap-2 text-base font-semibold">
          <Plug class="h-4 w-4 text-primary" />
          推送消息
        </h2>
        <p class="mt-1.5 text-sm text-muted-foreground">
          通过 <code class="rounded bg-muted px-1 py-0.5 text-[0.8em]">editorWindow.postMessage(payload, '{{ editorOrigin }}')</code> 发送。四种内容类型使用不同 type,字段和必填项各不相同:
        </p>
        <div v-for="group in messageGroups" :key="group.type" class="mt-4 overflow-hidden rounded-xl border border-border/70">
          <div class="border-b border-border/60 bg-muted/30 px-4 py-3">
            <h3 class="text-sm font-semibold text-foreground">
              {{ group.title }}
              <code class="ml-1 rounded bg-background/70 px-1.5 py-0.5 text-[0.8em] dark:bg-background/40">{{ group.type }}</code>
              <span class="ml-2 text-xs font-normal text-muted-foreground">→ {{ group.target }}</span>
            </h3>
            <p class="mt-1 text-xs leading-relaxed text-muted-foreground">
              {{ group.note }}
            </p>
            <p class="mt-1 text-xs text-muted-foreground">
              入口:<code class="rounded bg-background/70 px-1 py-0.5 text-[0.9em] dark:bg-background/40">{{ group.entry }}</code>
            </p>
          </div>
          <table class="w-full text-left text-sm">
            <thead class="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th class="px-4 py-2.5 font-medium">
                  字段
                </th>
                <th class="px-4 py-2.5 font-medium">
                  类型
                </th>
                <th class="px-4 py-2.5 font-medium">
                  必填
                </th>
                <th class="px-4 py-2.5 font-medium">
                  说明
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border/60">
              <tr v-for="f in group.fields" :key="f.name" class="even:bg-muted/20">
                <td class="px-4 py-2.5 font-mono text-xs text-foreground">
                  {{ f.name }}
                </td>
                <td class="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                  {{ f.type }}
                </td>
                <td class="px-4 py-2.5">
                  <span
                    class="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium"
                    :class="f.required ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'"
                  >{{ f.required ? '必填' : '可选' }}</span>
                </td>
                <td class="px-4 py-2.5 text-muted-foreground">
                  {{ f.desc }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- 就绪信号 + 回执 -->
      <div class="mt-4 grid gap-4 sm:grid-cols-2">
        <section class="rounded-2xl border border-border/70 bg-background p-5 shadow-sm dark:bg-card">
          <h2 class="flex items-center gap-2 text-sm font-semibold">
            <Radio class="h-4 w-4 text-emerald-500" />
            就绪信号 <span class="text-muted-foreground/70 text-xs">编辑器 → 你</span>
          </h2>
          <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
            编辑器就绪后每秒向 <code class="rounded bg-muted px-1 py-0.5 text-[0.8em]">opener</code> 广播一次,收到第一条即可推送文章。
          </p>
          <pre class="mt-3 overflow-x-auto rounded-lg bg-muted/50 p-3 text-xs"><code>{ type: 'MD_IMPORT_READY',
  app: 'md.doocs.org' }</code></pre>
        </section>

        <section class="rounded-2xl border border-border/70 bg-background p-5 shadow-sm dark:bg-card">
          <h2 class="flex items-center gap-2 text-sm font-semibold">
            <Reply class="h-4 w-4 text-sky-500" />
            导入回执 <span class="text-muted-foreground/70 text-xs">编辑器 → 你</span>
          </h2>
          <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
            每次导入后回传。<code class="rounded bg-muted px-1 py-0.5 text-[0.8em]">ok=false</code> 时
            <code class="rounded bg-muted px-1 py-0.5 text-[0.8em]">reason</code> 为
            <code class="rounded bg-muted px-1 py-0.5 text-[0.8em]">origin-not-whitelisted</code> 或
            <code class="rounded bg-muted px-1 py-0.5 text-[0.8em]">no-active-post</code>。
          </p>
          <pre class="mt-3 overflow-x-auto rounded-lg bg-muted/50 p-3 text-xs"><code>{ type: 'MD_IMPORT_RESULT',
  requestId, ok, reason }</code></pre>
        </section>
      </div>

      <!-- 来源与授权 -->
      <section class="mt-4 rounded-2xl border border-amber-200/70 bg-amber-50/50 p-5 shadow-sm dark:border-amber-900/40 dark:bg-amber-950/20 sm:p-6">
        <h2 class="flex items-center gap-2 text-base font-semibold">
          <ShieldCheck class="h-4 w-4 text-amber-600 dark:text-amber-400" />
          来源与授权
        </h2>
        <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
          只有<span class="font-medium text-foreground">打开或以 iframe 嵌入编辑器</span>的页面才能发来消息(它持有编辑器的 window 句柄);用户自己直接打开编辑器时,外部站点无法触达。在此之上,导入受白名单严格门禁:
        </p>
        <ul class="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground">
          <li class="flex gap-2">
            <Check class="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              <span class="font-medium text-foreground">仅白名单站点可导入</span>,直接写入当前文稿。当前已开通:
              <code class="rounded bg-background/70 px-1 py-0.5 text-[0.8em] dark:bg-background/40">2aran.com</code>、<code class="rounded bg-background/70 px-1 py-0.5 text-[0.8em] dark:bg-background/40">frontendnext.com</code>。
            </span>
          </li>
          <li class="flex gap-2">
            <Check class="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              <span class="font-medium text-foreground">未在白名单内的站点会被直接拒绝</span>,不写入任何内容,并回传 <code class="rounded bg-background/70 px-1 py-0.5 text-[0.8em] dark:bg-background/40">origin-not-whitelisted</code>。
            </span>
          </li>
          <li class="flex gap-2">
            <Check class="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            仅接受 <code class="rounded bg-background/70 px-1 py-0.5 text-[0.8em] dark:bg-background/40">type</code> 合法且必填字段齐全的消息(文章 <code class="rounded bg-background/70 px-1 py-0.5 text-[0.8em] dark:bg-background/40">markdown</code>、观点 <code class="rounded bg-background/70 px-1 py-0.5 text-[0.8em] dark:bg-background/40">opinion</code>、电子书 <code class="rounded bg-background/70 px-1 py-0.5 text-[0.8em] dark:bg-background/40">title</code> 或 <code class="rounded bg-background/70 px-1 py-0.5 text-[0.8em] dark:bg-background/40">url</code>、项目 <code class="rounded bg-background/70 px-1 py-0.5 text-[0.8em] dark:bg-background/40">url</code>),其余忽略。
          </li>
        </ul>

        <div class="mt-4 flex items-start gap-2 rounded-xl border border-amber-300/60 bg-amber-100/50 px-3 py-2.5 text-sm dark:border-amber-800/50 dark:bg-amber-900/20">
          <MessageCircle class="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p class="leading-relaxed text-foreground/90">
            需要站外<span class="font-medium">直接推入、免用户确认</span>?请联系微信
            <code class="rounded bg-background/80 px-1.5 py-0.5 font-semibold dark:bg-background/40">atar24</code>
            申请把你的站点加入白名单。
          </p>
        </div>
      </section>

      <!-- 完整示例 -->
      <section class="mt-4 rounded-2xl border border-border/70 bg-background shadow-sm dark:bg-card">
        <div class="flex items-center justify-between border-b border-border/60 px-5 py-3">
          <h2 class="text-base font-semibold">
            完整示例
          </h2>
          <Button variant="outline" size="sm" class="h-7" @click="copyExample">
            <component :is="copied ? Check : Copy" class="mr-1.5 h-3.5 w-3.5" />
            {{ copied ? '已复制' : '复制代码' }}
          </Button>
        </div>
        <pre class="overflow-x-auto p-5 text-xs leading-relaxed"><code>{{ exampleCode }}</code></pre>
      </section>

      <p class="mt-4 rounded-xl bg-muted/40 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
        <span class="font-medium text-foreground">iframe 嵌入:</span>
        把示例里的 <code class="rounded bg-background/70 px-1 py-0.5 dark:bg-background/40">window.open</code> 换成
        <code class="rounded bg-background/70 px-1 py-0.5 dark:bg-background/40">iframe.contentWindow</code> 即可,协议一致。
      </p>

      <p class="mt-3 text-center text-[11px] text-muted-foreground/70">
        兼容性:早期 <code class="rounded bg-muted px-1 py-0.5">SYNCBLOG_IMPORT_*</code> 系列消息名仍受支持。新接入请统一使用 <code class="rounded bg-muted px-1 py-0.5">MD_IMPORT_ARTICLE</code> / <code class="rounded bg-muted px-1 py-0.5">MD_IMPORT_OPINION</code> / <code class="rounded bg-muted px-1 py-0.5">MD_IMPORT_BOOKLET</code> / <code class="rounded bg-muted px-1 py-0.5">MD_IMPORT_PROJECT</code>。
      </p>
    </div>
  </main>
</template>

<style scoped>
.import-docs-hero {
  background: linear-gradient(135deg, #1a2332 0%, #1e3a5f 50%, #1e3a2f 100%);
}

.dark .import-docs-hero {
  background: linear-gradient(135deg, #0f1419 0%, #16243a 50%, #142820 100%);
}
</style>
