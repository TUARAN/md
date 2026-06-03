<script setup lang="ts">
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  GitCommitHorizontal,
  Rocket,
  ShieldCheck,
  Wrench,
} from 'lucide-vue-next'
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { APP_NAME } from '@/constants/branding'

const router = useRouter()

interface WeeklyEntry {
  range: string
  title: string
  commits: number
  focus: string
  stats: {
    feat: number
    fix: number
    refactor: number
    docs: number
    chore: number
    build: number
    ci: number
    style: number
    other: number
  }
  highlights: string[]
  shipped: string[]
}

const weeklyEntries: WeeklyEntry[] = [
  {
    range: `2026-06-01 ~ 2026-06-07`,
    title: `登录链路收尾`,
    commits: 1,
    focus: `修复 GitHub OAuth 回调 Cookie,让新上线的账号体系更稳定。`,
    stats: { feat: 0, fix: 1, refactor: 0, docs: 0, chore: 0, build: 0, ci: 0, style: 0, other: 0 },
    highlights: [`修复 GitHub OAuth callback cookies,降低登录后会话丢失概率。`],
    shipped: [`GitHub 登录回调稳定性修复`],
  },
  {
    range: `2026-05-25 ~ 2026-05-31`,
    title: `Syncblog 商业化与账号体系成型`,
    commits: 37,
    focus: `本周从工作流产品化进入账号、配额、支付和安全治理阶段,同时把编辑器与工作流的 URL、壳层和设置中心拆清楚。`,
    stats: { feat: 18, fix: 7, refactor: 5, docs: 2, chore: 4, build: 0, ci: 0, style: 0, other: 1 },
    highlights: [
      `新增 D1、GitHub OAuth、签名 Session、DeepSeek 用户配额和 IP 限流,并加入 rate_limits 夜间 GC。`,
      `新增 auth store、UserMenu、/pricing、/settings,以及微信/支付宝计费骨架和手动 Pro 授权。`,
      `编辑器与 workflow 拆成 /edit 与 /workflow/* URL 空间,并加入专注模式。`,
      `站外文章导入协议补齐白名单限制与接入文档,提升外部内容推进编辑器的安全边界。`,
      `DeepSeek 二创、宣发建议、统计汇报、小红书活动和 IP 触达工具持续增强。`,
    ],
    shipped: [`账号与配额`, `Pro 计费骨架`, `站外接入协议`, `工作流 IA`, `安全审计`],
  },
  {
    range: `2026-05-18 ~ 2026-05-24`,
    title: `创作者矩阵与多平台同步主链路`,
    commits: 41,
    focus: `围绕创作者名片、平台矩阵、发布扩展和路由重构集中推进,并清理内置凭据风险。`,
    stats: { feat: 14, fix: 11, refactor: 4, docs: 2, chore: 5, build: 2, ci: 2, style: 0, other: 1 },
    highlights: [
      `新增创作者名片、14 个平台数据快照、手动重检、默认主页 URL 与公开 offer 页。`,
      `平台矩阵进入 workflow,补齐各平台分发策略,统一平台 registry 并加固内容分发同步。`,
      `引入 vue-router,拆出编辑器布局和同步页,顶部导航从多行压平到两行。`,
      `加密用户 API Key、图床凭据和自定义上传脚本,移除内置图床 Token。`,
      `修复 SyncBlog Plugin 安装包、macOS 下载兼容、SegmentFault 路由和发布弹窗文案。`,
    ],
    shipped: [`创作者名片`, `平台矩阵`, `Vue Router`, `凭据加密`, `发布扩展包`],
  },
  {
    range: `2026-05-11 ~ 2026-05-17`,
    title: `内容工厂工作流启动`,
    commits: 18,
    focus: `产品从单一同步工具升级为采集、二创、同步、宣发、复盘的全链路工作流雏形。`,
    stats: { feat: 4, fix: 1, refactor: 0, docs: 0, chore: 2, build: 1, ci: 1, style: 1, other: 8 },
    highlights: [
      `完成博主联盟同步工具品牌阶段,更新样例文章、站点文案和顶部 workflow 导航。`,
      `接入 GNews,增加多来源资讯抓取、预览、二创模板和代理 Worker。`,
      `新增 Hacker News、BenZhi 聚合源,并优化内容工厂导航与 Remix 页面。`,
      `补齐失败账号单个重试与批量重试,提升多平台发布补偿能力。`,
    ],
    shipped: [`工作流导航`, `GNews`, `资讯聚合`, `二创模板`, `发布重试`],
  },
  {
    range: `2026-05-05 ~ 2026-05-11`,
    title: `构建稳定性与 MCP 能力修复`,
    commits: 9,
    focus: `这一周主要处理依赖、构建和 MCP 服务稳定性,同时为主题颜色能力补一块接口。`,
    stats: { feat: 1, fix: 5, refactor: 0, docs: 0, chore: 3, build: 0, ci: 0, style: 0, other: 0 },
    highlights: [
      `修复 MCP Server 启动与 KaTeX polyfill 问题,新增 primaryColor 支持和 list_colors 工具。`,
      `固定 pnpm 与 Docker ignore-scripts 配置,回退 CodeMirror view 以规避同步和 lint 兼容问题。`,
      `持续升级依赖并补齐 allowBuilds,减少构建环境差异。`,
    ],
    shipped: [`MCP 颜色能力`, `构建固定`, `依赖修复`],
  },
  {
    range: `2026-04-29 ~ 2026-05-04`,
    title: `编辑器交互与文稿管理清理`,
    commits: 12,
    focus: `聚焦编辑器左右同步、文稿删除和旧组件清理,减少 UI 状态复杂度。`,
    stats: { feat: 2, fix: 3, refactor: 2, docs: 0, chore: 4, build: 1, ci: 0, style: 0, other: 0 },
    highlights: [
      `新增编辑器与预览之间的滚动同步。`,
      `递归删除文稿与子文稿删除处理补齐,修复自定义图床服务问题。`,
      `抽出确认弹窗 hook,移除 FloatingToc、ThemeCustomizer 和未使用导出。`,
      `升级 uuid 与依赖,保持安全覆盖更新。`,
    ],
    shipped: [`滚动同步`, `递归删除`, `确认弹窗复用`, `旧组件清理`],
  },
  {
    range: `2026-04-21 ~ 2026-04-27`,
    title: `样式编辑与 Markdown 体验增强`,
    commits: 8,
    focus: `CSS 编辑器、搜索替换和 Obsidian 图片语法获得一轮体验增强。`,
    stats: { feat: 3, fix: 1, refactor: 0, docs: 0, chore: 4, build: 0, ci: 0, style: 0, other: 0 },
    highlights: [
      `CSS 编辑器支持右键批量操作。`,
      `支持 Obsidian 风格图片尺寸语法。`,
      `搜索/替换输入响应式优化,修复主题延迟相关 DOM override。`,
      `升级 @antv/infographic 与常规依赖。`,
    ],
    shipped: [`CSS 批量操作`, `图片尺寸语法`, `搜索替换优化`],
  },
  {
    range: `2026-04-14 ~ 2026-04-20`,
    title: `侧栏、文稿和移动端基础体验`,
    commits: 21,
    focus: `围绕文稿列表、侧栏、弹窗、移动端覆盖层和帮助入口做密集体验修补。`,
    stats: { feat: 6, fix: 9, refactor: 2, docs: 0, chore: 3, build: 1, ci: 0, style: 0, other: 0 },
    highlights: [
      `新增 Markdown 帮助弹窗、批量 Markdown 导入、单篇复制和 CSS Tab 双击重命名。`,
      `所有侧栏增加关闭按钮,文件夹面板在移动端改为覆盖层。`,
      `修复分屏视图、TOC、配置导入导出、弹窗 overflow 与内容偏移问题。`,
      `统一 Post 类型和 CSS scheme tab 标识,缩短 toast 展示并限制同时可见数量。`,
    ],
    shipped: [`Markdown 帮助`, `批量导入`, `侧栏关闭`, `移动端覆盖层`, `Toast 收敛`],
  },
  {
    range: `2026-04-06 ~ 2026-04-12`,
    title: `版本差异与 AI 请求复用`,
    commits: 11,
    focus: `抽出 AI 请求复用层,并补上版本差异查看能力。`,
    stats: { feat: 1, fix: 1, refactor: 2, docs: 0, chore: 6, build: 1, ci: 0, style: 0, other: 0 },
    highlights: [
      `新增版本 diff viewer,方便比较内容版本变化。`,
      `抽出 useAIFetch 复用 AI API 请求逻辑。`,
      `编辑器面板重构与修复,同时升级 TypeScript、juice 和 GitHub Actions 依赖。`,
    ],
    shipped: [`版本 Diff`, `AI 请求复用`, `编辑器面板整理`],
  },
  {
    range: `2026-04-01 ~ 2026-04-05`,
    title: `预览同步与 Markdown 渲染升级`,
    commits: 11,
    focus: `月初重点是编辑器预览同步、MathJax/Mermaid 依赖处理和底部预览控制。`,
    stats: { feat: 5, fix: 2, refactor: 0, docs: 0, chore: 3, build: 1, ci: 0, style: 0, other: 0 },
    highlights: [
      `新增语义化 editor-preview sync,为后续滚动同步打基础。`,
      `升级 MathJax 到 v4 后回滚问题变更,并修复表格单元格 text-align 内联样式。`,
      `底部增加大纲入口与预览模式切换,新增豆瓣同步。`,
      `移除 Mermaid CDN 与旧插件,减少外部加载依赖。`,
    ],
    shipped: [`预览同步`, `MathJax 调整`, `底部大纲`, `豆瓣同步`],
  },
]

const totals = computed(() => weeklyEntries.reduce((acc, entry) => {
  acc.commits += entry.commits
  acc.feat += entry.stats.feat
  acc.fix += entry.stats.fix
  acc.refactor += entry.stats.refactor
  return acc
}, { commits: 0, feat: 0, fix: 0, refactor: 0 }))

const typeLabels: Array<{ key: keyof WeeklyEntry['stats'], label: string }> = [
  { key: `feat`, label: `功能` },
  { key: `fix`, label: `修复` },
  { key: `refactor`, label: `重构` },
  { key: `docs`, label: `文档` },
  { key: `chore`, label: `维护` },
]

onMounted(() => {
  document.title = `更新日志 — ${APP_NAME}`
})

function goHome() {
  router.push({ name: `sync` })
}
</script>

<template>
  <main class="min-h-[100dvh] overflow-y-auto bg-[#f3f4f1] text-foreground dark:bg-[#101216]">
    <div class="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-8">
      <nav class="mb-5 flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" class="h-8 -ml-2 text-muted-foreground" @click="goHome">
          <ArrowLeft class="mr-1.5 size-4" />
          返回编辑器
        </Button>
        <span class="font-mono text-[11px] text-muted-foreground">git log · weekly summary</span>
      </nav>

      <header class="grid gap-4 border-b border-border/70 pb-6 md:grid-cols-[1.5fr_1fr] md:items-end">
        <div>
          <span class="inline-flex items-center gap-1.5 rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-200">
            <GitCommitHorizontal class="size-3.5" />
            基于 git 提交记录
          </span>
          <h1 class="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Syncblog 更新日志
          </h1>
          <p class="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            按自然周整理 2026-04-01 至 2026-06-01 的开发进度。每周摘要来自提交主题、范围和提交类型分布,用于快速了解产品从 Markdown 编辑器到内容运营工作流的演进。
          </p>
        </div>

        <div class="grid grid-cols-3 gap-2 text-center">
          <div class="rounded-lg border border-border/70 bg-background p-3 shadow-sm dark:bg-card">
            <p class="text-2xl font-semibold">
              {{ totals.commits }}
            </p>
            <p class="mt-1 text-xs text-muted-foreground">
              commits
            </p>
          </div>
          <div class="rounded-lg border border-border/70 bg-background p-3 shadow-sm dark:bg-card">
            <p class="text-2xl font-semibold text-emerald-700 dark:text-emerald-300">
              {{ totals.feat }}
            </p>
            <p class="mt-1 text-xs text-muted-foreground">
              功能
            </p>
          </div>
          <div class="rounded-lg border border-border/70 bg-background p-3 shadow-sm dark:bg-card">
            <p class="text-2xl font-semibold text-rose-700 dark:text-rose-300">
              {{ totals.fix }}
            </p>
            <p class="mt-1 text-xs text-muted-foreground">
              修复
            </p>
          </div>
        </div>
      </header>

      <section class="mt-6 grid gap-3 sm:grid-cols-3">
        <article class="rounded-lg border border-border/70 bg-background p-4 shadow-sm dark:bg-card">
          <Rocket class="size-5 text-emerald-600" />
          <h2 class="mt-3 text-sm font-semibold">
            产品主线
          </h2>
          <p class="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            五月中旬开始,产品主线明显转向采集、二创、同步、宣发和复盘的完整内容运营链路。
          </p>
        </article>
        <article class="rounded-lg border border-border/70 bg-background p-4 shadow-sm dark:bg-card">
          <ShieldCheck class="size-5 text-sky-600" />
          <h2 class="mt-3 text-sm font-semibold">
            安全主线
          </h2>
          <p class="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            凭据加密、站外导入白名单、Session、限流和配额是后半段最密集的基础设施投入。
          </p>
        </article>
        <article class="rounded-lg border border-border/70 bg-background p-4 shadow-sm dark:bg-card">
          <Wrench class="size-5 text-violet-600" />
          <h2 class="mt-3 text-sm font-semibold">
            工程主线
          </h2>
          <p class="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            路由、布局、UI primitives、构建依赖和类型收敛持续推进,为后续功能迭代降低维护成本。
          </p>
        </article>
      </section>

      <section class="mt-8 space-y-4">
        <article
          v-for="entry in weeklyEntries"
          :key="entry.range"
          class="rounded-lg border border-border/70 bg-background shadow-sm dark:bg-card"
        >
          <div class="grid gap-4 border-b border-border/70 p-4 md:grid-cols-[1fr_auto] md:items-start">
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <span class="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                  <CalendarDays class="size-3.5" />
                  {{ entry.range }}
                </span>
                <span class="rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                  {{ entry.commits }} commits
                </span>
              </div>
              <h2 class="mt-3 text-xl font-semibold tracking-tight">
                {{ entry.title }}
              </h2>
              <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
                {{ entry.focus }}
              </p>
            </div>

            <div class="grid min-w-48 grid-cols-5 gap-1">
              <div
                v-for="type in typeLabels"
                :key="type.key"
                class="rounded-md border border-border/60 bg-muted/30 px-2 py-1.5 text-center"
              >
                <p class="text-sm font-semibold">
                  {{ entry.stats[type.key] }}
                </p>
                <p class="mt-0.5 text-[10px] text-muted-foreground">
                  {{ type.label }}
                </p>
              </div>
            </div>
          </div>

          <div class="grid gap-5 p-4 md:grid-cols-[1fr_14rem]">
            <div>
              <h3 class="text-sm font-semibold">
                本周进展
              </h3>
              <ul class="mt-3 space-y-2">
                <li
                  v-for="item in entry.highlights"
                  :key="item"
                  class="flex gap-2 text-sm leading-relaxed text-muted-foreground"
                >
                  <CheckCircle2 class="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  <span>{{ item }}</span>
                </li>
              </ul>
            </div>

            <aside>
              <h3 class="text-sm font-semibold">
                交付关键词
              </h3>
              <div class="mt-3 flex flex-wrap gap-1.5">
                <span
                  v-for="item in entry.shipped"
                  :key="item"
                  class="rounded-md border border-border/70 bg-muted/40 px-2 py-1 text-xs text-muted-foreground"
                >
                  {{ item }}
                </span>
              </div>
            </aside>
          </div>
        </article>
      </section>
    </div>
  </main>
</template>
