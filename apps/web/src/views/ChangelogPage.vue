<script setup lang="ts">
import type {
  RoadmapItem,
  RoadmapMilestone,
  RoadmapPriority,
} from '@/constants/roadmap'
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Compass,
  GitBranch,
  GitCommitHorizontal,
  GitFork,
  History,
  ListChecks,
  Rocket,
  ShieldCheck,
  Target,
  Wrench,
} from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { APP_NAME } from '@/constants/branding'
import {
  buildRoadmapStats,
  ROADMAP_AUDIENCE_META,
  ROADMAP_CATEGORY_META,
  ROADMAP_ITEMS,
  ROADMAP_MILESTONE_META,
  ROADMAP_MILESTONE_ORDER,
  ROADMAP_PRIORITY_META,
  ROADMAP_PRIORITY_ORDER,
  ROADMAP_STATUS_META,
} from '@/constants/roadmap'

const router = useRouter()

type TimelineSource = `fork` | `upstream`
type TimelineKind = `release` | `weekly` | `milestone`

interface TimelineEntry {
  id: string
  source: TimelineSource
  kind: TimelineKind
  date: string
  range?: string
  title: string
  subtitle: string
  commits?: number
  items: string[]
  tags: string[]
}

const timelineEntries: TimelineEntry[] = [
  {
    id: `fork-2026-06-10`,
    source: `fork`,
    kind: `milestone`,
    date: `2026-06-10`,
    title: `多租户创作名片加固与状态机收敛`,
    subtitle: `把"用户级创作名片"从可用做到稳：修复短暂的站长数据泄漏、补齐 D1 唯一冲突回退、收敛多 store 循环依赖。`,
    items: [
      `工作流默认 creatorId 由站长 tuaran 改为空串，避免普通用户登录瞬间渲染到站长的快照数据。`,
      `slugifyCreatorId 调换 slice / strip 顺序，前后端一致，修复 48 字符边界处尾部留 - 被校验拒掉的隐性 bug。`,
      `合并 0006 / 0007 D1 迁移为单文件；首次插入不再预生成 share_token，避免"为禁用功能预先生成密钥"。`,
      `worker 端为新建名片加入 creator_id UNIQUE 回退（fallback slug + 随机后缀），防止站长邮箱命中已被占用的 tuaran 时 5xx。`,
      `引入 CreatorOfferContent.kind 判别联合，移除 services.length 兜底判断与 as unknown as 强转。`,
      `creatorProfile.save 返回 { offline } 状态；D1 未挂或 404 时改为 toast.warning 明示"未同步到服务器"。`,
      `socialAccounts store 改为 server profile 派生，统一 store.getJSON/setJSON 抽象（修复浏览器扩展模式下直读 localStorage 的丢失问题）。`,
      `CreatorOfferPage 5 段互斥 v-if 收敛成 viewState 状态机，避免组合遗漏导致的误跳转。`,
      `WorkflowDistributionPage 已登录但无名片时补 empty state CTA；WorkflowCreatorPicker 无名片时不再静默隐藏。`,
      `SettingsPage 标签 ID 加 inline 校验与 slugify 预览，校验未通过时禁用保存按钮。`,
    ],
    tags: [`创作名片`, `多租户`, `D1 迁移`, `状态机`, `安全加固`],
  },
  {
    id: `fork-2026-06-03`,
    source: `fork`,
    kind: `milestone`,
    date: `2026-06-03`,
    title: `邮箱注册闭环与 SyncBlog Plugin 收尾`,
    subtitle: `完成邮箱验证码注册、登录链路和多平台发布插件的近期修复。`,
    commits: 5,
    items: [
      `新增邮箱验证码注册、邮箱密码登录、会话保持与账号菜单。`,
      `修复验证码通过后注册返回 500 时验证码被提前消费的问题。`,
      `GitHub 登录统一经由 Worker,修复 OAuth 回调 Cookie 与 SPA query 处理。`,
      `统一 SyncBlog Plugin 命名、打包脚本与发布入口,保留 csync 兼容别名。`,
      `修复 SegmentFault 跳转确认页与百家号编辑器填充链路。`,
    ],
    tags: [`邮箱认证`, `OAuth`, `SyncBlog Plugin`, `发布修复`],
  },
  {
    id: `fork-2026-06-02`,
    source: `fork`,
    kind: `weekly`,
    date: `2026-06-02`,
    range: `2026-06-01 ~ 2026-06-02`,
    title: `导航、编辑器头部与创作者分享`,
    subtitle: `重做 Web 端信息架构,让编辑器、分发和商业化入口更清晰。`,
    commits: 8,
    items: [
      `重构编辑器 header chrome,移除遗留入口并简化编辑器导航。`,
      `新增创作者名片分享面板,用于展示和分发个人创作资产。`,
      `明确导航层级和商业化导航重点,登录入口改为达到使用阈值后触发。`,
      `修复 UI 细节,并持续加固 GitHub OAuth 流程。`,
    ],
    tags: [`导航重构`, `编辑器`, `创作者名片`, `登录门槛`],
  },
  {
    id: `fork-2026-05-31`,
    source: `fork`,
    kind: `weekly`,
    date: `2026-05-31`,
    range: `2026-05-25 ~ 2026-05-31`,
    title: `账号、配额、计费与安全基础设施`,
    subtitle: `从内容工作流继续推进到账户体系、Pro 计费骨架和安全治理。`,
    commits: 37,
    items: [
      `接入 Cloudflare D1、GitHub OAuth、签名 Session、DeepSeek 用户额度和 IP 限流。`,
      `新增 auth store、UserMenu、/pricing、/settings,以及微信 / 支付宝计费骨架和手动 Pro 授权。`,
      `编辑器与 workflow 拆成 /edit 与 /workflow/* URL 空间,并加入专注模式。`,
      `站外文章导入协议补齐白名单限制与接入文档。`,
      `移除内置图床 Token,加密图床凭据、用户 API Key 和自定义上传脚本。`,
    ],
    tags: [`D1`, `Session`, `Pro`, `限流`, `安全加固`],
  },
  {
    id: `fork-2026-05-24`,
    source: `fork`,
    kind: `weekly`,
    date: `2026-05-24`,
    range: `2026-05-18 ~ 2026-05-24`,
    title: `创作者矩阵与多平台同步主链路`,
    subtitle: `围绕创作者名片、平台矩阵、发布扩展和路由重构集中推进。`,
    commits: 41,
    items: [
      `新增创作者名片、平台数据快照、手动重检、默认主页 URL 与公开 offer 页。`,
      `平台矩阵进入 workflow,补齐各平台分发策略并统一平台 registry。`,
      `引入 vue-router,拆出编辑器布局和同步页,顶部导航从多行压平到两行。`,
      `修复 SyncBlog Plugin 安装包、macOS 下载兼容、SegmentFault 路由和发布弹窗文案。`,
    ],
    tags: [`平台矩阵`, `Vue Router`, `发布扩展`, `凭据加密`],
  },
  {
    id: `upstream-2-2-0`,
    source: `upstream`,
    kind: `release`,
    date: `2026-05-22`,
    title: `上游 v2.2.0: 内容分发优化与修复`,
    subtitle: `fork 基线附近的上游主要节点,集中统一平台注册表和 COSE 发布通道。`,
    items: [
      `平台 type、名称、分类、登录入口和门户主页收敛到单一注册表。`,
      `修复 COSE 检测在部分进度回调后卡死、重新检测按钮无法再次使用的问题。`,
      `发布与账号检测统一走 COSE,避免多扩展桥接对象造成通道错配。`,
      `矩阵表粉丝 / 阅读数据优先取 COSE 检测缓存,缺省回落静态快照。`,
    ],
    tags: [`v2.2.0`, `平台注册表`, `COSE`, `内容分发`],
  },
  {
    id: `fork-2026-05-17`,
    source: `fork`,
    kind: `weekly`,
    date: `2026-05-17`,
    range: `2026-05-11 ~ 2026-05-17`,
    title: `内容工厂工作流启动`,
    subtitle: `产品从单一同步工具升级为采集、二创、同步、宣发、复盘的工作流雏形。`,
    commits: 18,
    items: [
      `完成博主联盟同步工具品牌阶段,更新样例文章、站点文案和顶部 workflow 导航。`,
      `接入 GNews,增加多来源资讯抓取、预览、二创模板和代理 Worker。`,
      `新增 Hacker News、BenZhi 聚合源,优化内容工厂导航与 Remix 页面。`,
      `补齐失败账号单个重试与批量重试,提升多平台发布补偿能力。`,
    ],
    tags: [`内容工厂`, `GNews`, `二创`, `发布重试`],
  },
  {
    id: `fork-2026-05-11`,
    source: `fork`,
    kind: `weekly`,
    date: `2026-05-11`,
    range: `2026-05-05 ~ 2026-05-11`,
    title: `构建稳定性与 MCP 能力修复`,
    subtitle: `主要处理依赖、构建和 MCP 服务稳定性,并补充主题颜色能力。`,
    commits: 9,
    items: [
      `修复 MCP Server 启动与 KaTeX polyfill 问题。`,
      `新增 primaryColor 支持和 list_colors 工具。`,
      `固定 pnpm 与 Docker ignore-scripts 配置,减少构建环境差异。`,
    ],
    tags: [`MCP`, `构建固定`, `主题色`],
  },
  {
    id: `fork-2026-05-04`,
    source: `fork`,
    kind: `weekly`,
    date: `2026-05-04`,
    range: `2026-04-29 ~ 2026-05-04`,
    title: `编辑器交互与文稿管理清理`,
    subtitle: `聚焦编辑器左右同步、文稿删除和旧组件清理。`,
    commits: 12,
    items: [
      `新增编辑器与预览之间的滚动同步。`,
      `递归删除文稿与子文稿删除处理补齐,修复自定义图床服务问题。`,
      `抽出确认弹窗 hook,移除 FloatingToc、ThemeCustomizer 和未使用导出。`,
    ],
    tags: [`滚动同步`, `文稿管理`, `组件清理`],
  },
  {
    id: `fork-2026-04-27`,
    source: `fork`,
    kind: `weekly`,
    date: `2026-04-27`,
    range: `2026-04-21 ~ 2026-04-27`,
    title: `样式编辑与 Markdown 体验增强`,
    subtitle: `CSS 编辑器、搜索替换和 Obsidian 图片语法获得体验增强。`,
    commits: 8,
    items: [
      `CSS 编辑器支持右键批量操作。`,
      `支持 Obsidian 风格图片尺寸语法。`,
      `搜索 / 替换输入响应式优化,修复主题延迟相关 DOM override。`,
    ],
    tags: [`CSS`, `Obsidian`, `搜索替换`],
  },
  {
    id: `fork-2026-04-20`,
    source: `fork`,
    kind: `weekly`,
    date: `2026-04-20`,
    range: `2026-04-14 ~ 2026-04-20`,
    title: `侧栏、文稿和移动端基础体验`,
    subtitle: `围绕文稿列表、侧栏、弹窗、移动端覆盖层和帮助入口做体验修补。`,
    commits: 21,
    items: [
      `新增 Markdown 帮助弹窗、批量 Markdown 导入、单篇复制和 CSS Tab 双击重命名。`,
      `所有侧栏增加关闭按钮,文件夹面板在移动端改为覆盖层。`,
      `修复分屏视图、TOC、配置导入导出、弹窗 overflow 与内容偏移问题。`,
    ],
    tags: [`Markdown 帮助`, `批量导入`, `移动端`, `Toast`],
  },
  {
    id: `fork-2026-04-12`,
    source: `fork`,
    kind: `weekly`,
    date: `2026-04-12`,
    range: `2026-04-06 ~ 2026-04-12`,
    title: `版本差异与 AI 请求复用`,
    subtitle: `抽出 AI 请求复用层,并补上版本差异查看能力。`,
    commits: 11,
    items: [
      `新增版本 diff viewer,方便比较内容版本变化。`,
      `抽出 useAIFetch 复用 AI API 请求逻辑。`,
      `编辑器面板重构与修复,升级 TypeScript、juice 和 GitHub Actions 依赖。`,
    ],
    tags: [`版本 Diff`, `AI 请求复用`, `依赖升级`],
  },
  {
    id: `fork-2026-04-05`,
    source: `fork`,
    kind: `weekly`,
    date: `2026-04-05`,
    range: `2026-04-01 ~ 2026-04-05`,
    title: `预览同步与 Markdown 渲染升级`,
    subtitle: `月初重点是编辑器预览同步、MathJax / Mermaid 依赖处理和底部预览控制。`,
    commits: 11,
    items: [
      `新增语义化 editor-preview sync,为后续滚动同步打基础。`,
      `调整 MathJax v4 升级并修复表格单元格 text-align 内联样式。`,
      `底部增加大纲入口与预览模式切换,新增豆瓣同步。`,
      `移除 Mermaid CDN 与旧插件,减少外部加载依赖。`,
    ],
    tags: [`预览同步`, `MathJax`, `Mermaid`, `豆瓣同步`],
  },
  {
    id: `upstream-2-1-0`,
    source: `upstream`,
    kind: `release`,
    date: `2025-10-17`,
    title: `上游 v2.1.0: AI 助手与移动端增强`,
    subtitle: `上游在编辑器能力、AI 辅助和移动端体验上继续推进。`,
    items: [
      `新增独立 AI 助手侧边栏,支持智能对话、文本生成与 AI 图像生成。`,
      `支持 PlantUML 图表渲染、Ruby 注音、图片压缩和上传进度条。`,
      `CodeMirror 升级至 v6,Vite 升级至 v7,项目重构为 pnpm monorepo。`,
      `支持 Cloudflare Workers 部署与自动化 CI/CD。`,
    ],
    tags: [`v2.1.0`, `AI 助手`, `CodeMirror 6`, `Vite 7`],
  },
  {
    id: `upstream-2-0-4`,
    source: `upstream`,
    kind: `release`,
    date: `2025-06-20`,
    title: `上游 v2.0.4: 编辑器快捷能力`,
    subtitle: `上游补齐搜索替换、标题快捷键和 VSCode 插件初步集成。`,
    items: [
      `新增编辑器搜索与替换快捷键。`,
      `支持 Ctrl / Cmd + 1~6 快速插入 Markdown 标题。`,
      `开始支持 VSCode 插件和浏览器插件 SitePanel 能力。`,
      `修复重置、XSS 和 Docker 镜像相关问题。`,
    ],
    tags: [`v2.0.4`, `搜索替换`, `VSCode`, `安全修复`],
  },
  {
    id: `upstream-2-0-0`,
    source: `upstream`,
    kind: `release`,
    date: `2025-04-18`,
    title: `上游 v2.0.0: Vue3 编辑器基线`,
    subtitle: `上游形成 Markdown 编辑器、主题、图床、插件和 AI 助手的主要基线。`,
    items: [
      `全面支持 Markdown 基础语法、数学公式和 Mermaid 图表。`,
      `新增样式自定义面板、本地内容管理、配置导入导出和自动草稿保存。`,
      `新增公众号与 Cloudflare R2 图床支持,并提供浏览器扩展插件。`,
      `升级到 Vue3 + Vite,支持多架构 Docker 镜像。`,
    ],
    tags: [`v2.0.0`, `Vue3`, `Markdown`, `图床`, `插件`],
  },
]

const sourceMeta: Record<TimelineSource, {
  label: string
  shortLabel: string
  classes: string
  dotClasses: string
}> = {
  fork: {
    label: `Fork 修改日志`,
    shortLabel: `Fork`,
    classes: `border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200`,
    dotClasses: `border-emerald-500 bg-emerald-500`,
  },
  upstream: {
    label: `上游 Upstream 主要节点`,
    shortLabel: `Upstream`,
    classes: `border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200`,
    dotClasses: `border-sky-500 bg-sky-500`,
  },
}

const timelineStats = computed(() => {
  const forkEntries = timelineEntries.filter(entry => entry.source === `fork`)
  const upstreamEntries = timelineEntries.filter(entry => entry.source === `upstream`)

  return {
    total: timelineEntries.length,
    fork: forkEntries.length,
    upstream: upstreamEntries.length,
    commits: forkEntries.reduce((sum, entry) => sum + (entry.commits ?? 0), 0),
  }
})

onMounted(() => {
  document.title = `更新日志 — ${APP_NAME}`
})

function goHome() {
  router.push({ name: `sync` })
}

/* ------------------------------------------------------------------ */
/* roadmap view                                                        */
/* ------------------------------------------------------------------ */

type ActiveTab = `history` | `roadmap`

/** 默认进入"已发布"tab；用户可通过顶部 segmented control 切换 */
const activeTab = ref<ActiveTab>(`history`)

/** 路线图筛选：里程碑（all / alpha / beta / ga / post-ga） */
const roadmapMilestoneFilter = ref<`all` | RoadmapMilestone>(`all`)
/** 路线图筛选：优先级 */
const roadmapPriorityFilter = ref<`all` | RoadmapPriority>(`all`)

const filteredRoadmapItems = computed<RoadmapItem[]>(() => {
  return ROADMAP_ITEMS.filter((item) => {
    if (roadmapMilestoneFilter.value !== `all` && item.milestone !== roadmapMilestoneFilter.value)
      return false
    if (roadmapPriorityFilter.value !== `all` && item.priority !== roadmapPriorityFilter.value)
      return false
    return true
  })
})

/** 按里程碑分组，再按优先级排序，便于路线图视图直接渲染 */
const groupedRoadmap = computed(() => {
  return ROADMAP_MILESTONE_ORDER.map((milestone) => {
    const items = filteredRoadmapItems.value
      .filter(item => item.milestone === milestone)
      .sort((a, b) => {
        const ap = ROADMAP_PRIORITY_ORDER.indexOf(a.priority)
        const bp = ROADMAP_PRIORITY_ORDER.indexOf(b.priority)
        return ap - bp
      })
    return { milestone, items }
  })
})

const roadmapStats = computed(() => buildRoadmapStats(ROADMAP_ITEMS))

/** 当前筛选生效后还剩多少；用于空态提示 */
const filteredCount = computed(() => filteredRoadmapItems.value.length)
</script>

<template>
  <main class="min-h-[100dvh] overflow-y-auto bg-[#f5f5f2] text-foreground dark:bg-[#101216]">
    <div class="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
      <nav class="mb-5 flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" class="h-8 -ml-2 text-muted-foreground" @click="goHome">
          <ArrowLeft class="mr-1.5 size-4" />
          返回编辑器
        </Button>
        <span class="font-mono text-[11px] text-muted-foreground">upstream + fork timeline</span>
      </nav>

      <header class="grid gap-5 border-b border-border/70 pb-6 lg:grid-cols-[1.4fr_1fr] lg:items-end">
        <div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="inline-flex items-center gap-1.5 rounded-md border border-border/70 bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground dark:bg-card">
              <GitBranch class="size-3.5" />
              Fork 基线: upstream v2.2.0
            </span>
            <span class="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200">
              <GitFork class="size-3.5" />
              Fork 后修改持续记录
            </span>
          </div>

          <h1 class="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            更新日志 &amp; 路线图
          </h1>
          <p class="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            「已发布」记录上游 doocs/md 的主要版本节点和当前 fork 之后的产品改动；「路线图」列出面向公众发布前后的合规、安全、计费、内容审核等改造目标。
          </p>
        </div>

        <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div class="rounded-lg border border-border/70 bg-background p-3 shadow-sm dark:bg-card">
            <p class="text-2xl font-semibold">
              {{ timelineStats.total }}
            </p>
            <p class="mt-1 text-xs text-muted-foreground">
              时间节点
            </p>
          </div>
          <div class="rounded-lg border border-sky-200 bg-sky-50 p-3 shadow-sm dark:border-sky-500/30 dark:bg-sky-500/10">
            <p class="text-2xl font-semibold text-sky-800 dark:text-sky-200">
              {{ timelineStats.upstream }}
            </p>
            <p class="mt-1 text-xs text-sky-700 dark:text-sky-300">
              Upstream
            </p>
          </div>
          <div class="rounded-lg border border-emerald-200 bg-emerald-50 p-3 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/10">
            <p class="text-2xl font-semibold text-emerald-800 dark:text-emerald-200">
              {{ timelineStats.fork }}
            </p>
            <p class="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
              Fork 修改
            </p>
          </div>
          <div class="rounded-lg border border-border/70 bg-background p-3 shadow-sm dark:bg-card">
            <p class="text-2xl font-semibold">
              {{ timelineStats.commits }}
            </p>
            <p class="mt-1 text-xs text-muted-foreground">
              fork commits
            </p>
          </div>
        </div>
      </header>

      <!--
        Tab 切换：已发布 / 路线图
        放在 stats 之后、说明卡片之前；segmented 风格而不是底线 tab，避免在 changelog 这种纯展示页过重。
      -->
      <div
        class="mt-6 inline-flex rounded-lg border border-border/70 bg-background p-1 shadow-sm dark:bg-card"
        role="tablist"
        aria-label="更新日志与路线图切换"
      >
        <button
          type="button"
          role="tab"
          :aria-selected="activeTab === 'history'"
          class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
          :class="activeTab === 'history'
            ? 'bg-muted text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'"
          @click="activeTab = 'history'"
        >
          <History class="size-4" />
          已发布
          <span class="ml-1 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            {{ timelineStats.total }}
          </span>
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="activeTab === 'roadmap'"
          class="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
          :class="activeTab === 'roadmap'
            ? 'bg-muted text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'"
          @click="activeTab = 'roadmap'"
        >
          <Compass class="size-4" />
          路线图
          <span class="ml-1 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            {{ roadmapStats.total }}
          </span>
        </button>
      </div>

      <section v-if="activeTab === 'history'" class="mt-6 grid gap-3 lg:grid-cols-3">
        <article class="rounded-lg border border-border/70 bg-background p-4 shadow-sm dark:bg-card">
          <Rocket class="size-5 text-emerald-600" />
          <h2 class="mt-3 text-sm font-semibold">
            Fork 主线
          </h2>
          <p class="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            从 Markdown 编辑器扩展到采集、二创、同步、宣发、复盘和账号计费的内容运营工作流。
          </p>
        </article>
        <article class="rounded-lg border border-border/70 bg-background p-4 shadow-sm dark:bg-card">
          <ShieldCheck class="size-5 text-sky-600" />
          <h2 class="mt-3 text-sm font-semibold">
            上游基线
          </h2>
          <p class="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            上游主要提供编辑器、主题、AI 助手、插件、图床和基础内容分发能力的版本节点。
          </p>
        </article>
        <article class="rounded-lg border border-border/70 bg-background p-4 shadow-sm dark:bg-card">
          <Wrench class="size-5 text-violet-600" />
          <h2 class="mt-3 text-sm font-semibold">
            记录方式
          </h2>
          <p class="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            Fork 修改来自 git 提交摘要和本仓库 changelog,上游节点来自根目录 CHANGELOG 的主要版本。
          </p>
        </article>
      </section>

      <section v-if="activeTab === 'history'" class="mt-8">
        <div class="relative">
          <div class="absolute left-4 top-0 hidden h-full w-px bg-border md:block" />

          <article
            v-for="entry in timelineEntries"
            :key="entry.id"
            class="relative grid gap-3 pb-5 md:grid-cols-[2rem_1fr]"
          >
            <div class="hidden md:block">
              <span
                class="relative z-10 mt-5 block size-8 rounded-full border-4 border-background shadow-sm dark:border-[#101216]"
                :class="sourceMeta[entry.source].dotClasses"
              />
            </div>

            <div class="rounded-lg border border-border/70 bg-background shadow-sm dark:bg-card">
              <div class="grid gap-4 border-b border-border/70 p-4 lg:grid-cols-[1fr_auto] lg:items-start">
                <div>
                  <div class="flex flex-wrap items-center gap-2">
                    <span
                      class="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-semibold"
                      :class="sourceMeta[entry.source].classes"
                    >
                      <GitFork v-if="entry.source === 'fork'" class="size-3.5" />
                      <GitBranch v-else class="size-3.5" />
                      {{ sourceMeta[entry.source].label }}
                    </span>
                    <span class="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                      <CalendarDays class="size-3.5" />
                      {{ entry.range ?? entry.date }}
                    </span>
                    <span
                      v-if="entry.commits"
                      class="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-1 text-xs font-semibold text-primary"
                    >
                      <GitCommitHorizontal class="size-3.5" />
                      {{ entry.commits }} commits
                    </span>
                  </div>

                  <h2 class="mt-3 text-xl font-semibold tracking-tight">
                    {{ entry.title }}
                  </h2>
                  <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {{ entry.subtitle }}
                  </p>
                </div>

                <div class="flex flex-wrap gap-1.5 lg:max-w-72 lg:justify-end">
                  <span
                    v-for="tag in entry.tags"
                    :key="tag"
                    class="rounded-md border border-border/70 bg-muted/40 px-2 py-1 text-xs text-muted-foreground"
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>

              <div class="p-4">
                <ul class="space-y-2">
                  <li
                    v-for="item in entry.items"
                    :key="item"
                    class="flex gap-2 text-sm leading-relaxed text-muted-foreground"
                  >
                    <CheckCircle2 class="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    <span>{{ item }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </article>
        </div>
      </section>

      <!-- ============================================================ -->
      <!-- Roadmap tab                                                   -->
      <!-- ============================================================ -->
      <section v-if="activeTab === 'roadmap'" class="mt-6">
        <!-- 顶部说明卡：里程碑分级解释 + 阻断项统计 -->
        <div class="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
          <article class="rounded-lg border border-border/70 bg-background p-4 shadow-sm dark:bg-card">
            <div class="flex items-center gap-2">
              <Target class="size-5 text-primary" />
              <h2 class="text-sm font-semibold">
                公开发布的阶段定义
              </h2>
            </div>
            <ul class="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
              <li
                v-for="milestone in ROADMAP_MILESTONE_ORDER"
                :key="milestone"
                class="flex gap-2"
              >
                <span
                  class="mt-0.5 inline-flex h-5 shrink-0 items-center rounded border px-1.5 text-[10px] font-semibold"
                  :class="ROADMAP_MILESTONE_META[milestone].classes"
                >
                  {{ ROADMAP_MILESTONE_META[milestone].shortLabel }}
                </span>
                <span>{{ ROADMAP_MILESTONE_META[milestone].summary }}</span>
              </li>
            </ul>
          </article>

          <article class="grid gap-2">
            <div class="rounded-lg border border-red-200 bg-red-50/60 p-3 dark:border-red-500/30 dark:bg-red-500/5">
              <div class="flex items-center gap-2">
                <AlertTriangle class="size-4 text-red-600 dark:text-red-300" />
                <p class="text-sm font-semibold text-red-700 dark:text-red-200">
                  对外公开前必须闭环
                </p>
              </div>
              <p class="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                P0 阻断项（合规、安全、计费、内容审核、错误监控）共 <strong class="text-red-700 dark:text-red-300">{{ roadmapStats.priorityCount.P0 }}</strong> 项，是 Public Beta 之前的硬门槛。
              </p>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <div class="rounded-lg border border-border/70 bg-background p-3 shadow-sm dark:bg-card">
                <p class="text-xs text-muted-foreground">
                  里程碑总数
                </p>
                <p class="mt-1 text-xl font-semibold">
                  {{ roadmapStats.total }}
                </p>
              </div>
              <div class="rounded-lg border border-border/70 bg-background p-3 shadow-sm dark:bg-card">
                <p class="text-xs text-muted-foreground">
                  进行中
                </p>
                <p class="mt-1 text-xl font-semibold text-primary">
                  {{ roadmapStats.statusCount['in-progress'] }}
                </p>
              </div>
              <div class="rounded-lg border border-border/70 bg-background p-3 shadow-sm dark:bg-card">
                <p class="text-xs text-muted-foreground">
                  等外部依赖
                </p>
                <p class="mt-1 text-xl font-semibold text-red-600 dark:text-red-300">
                  {{ roadmapStats.statusCount.blocked }}
                </p>
              </div>
            </div>
          </article>
        </div>

        <!-- 筛选条：里程碑 + 优先级 -->
        <div class="mt-5 flex flex-col gap-2 rounded-lg border border-border/70 bg-background p-3 shadow-sm dark:bg-card sm:flex-row sm:items-center sm:justify-between">
          <div class="flex flex-wrap items-center gap-1.5">
            <span class="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">里程碑</span>
            <button
              type="button"
              class="rounded-md border border-border/70 px-2 py-1 text-xs"
              :class="roadmapMilestoneFilter === 'all'
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground'"
              @click="roadmapMilestoneFilter = 'all'"
            >
              全部
            </button>
            <button
              v-for="milestone in ROADMAP_MILESTONE_ORDER"
              :key="milestone"
              type="button"
              class="rounded-md border border-border/70 px-2 py-1 text-xs"
              :class="roadmapMilestoneFilter === milestone
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground'"
              @click="roadmapMilestoneFilter = milestone"
            >
              {{ ROADMAP_MILESTONE_META[milestone].shortLabel }}
            </button>
          </div>
          <div class="flex flex-wrap items-center gap-1.5">
            <span class="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">优先级</span>
            <button
              type="button"
              class="rounded-md border border-border/70 px-2 py-1 text-xs"
              :class="roadmapPriorityFilter === 'all'
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground'"
              @click="roadmapPriorityFilter = 'all'"
            >
              全部
            </button>
            <button
              v-for="priority in ROADMAP_PRIORITY_ORDER"
              :key="priority"
              type="button"
              class="rounded-md border border-border/70 px-2 py-1 text-xs font-mono"
              :class="roadmapPriorityFilter === priority
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground'"
              @click="roadmapPriorityFilter = priority"
            >
              {{ priority }}
            </button>
          </div>
        </div>

        <!-- 空态 -->
        <p
          v-if="filteredCount === 0"
          class="mt-4 rounded-lg border border-dashed border-border/70 bg-muted/20 p-6 text-center text-sm text-muted-foreground"
        >
          当前筛选下没有匹配的路线图项目。
        </p>

        <!-- 按里程碑分组渲染 -->
        <div class="mt-5 grid gap-6">
          <article
            v-for="group in groupedRoadmap"
            v-show="group.items.length"
            :key="group.milestone"
            class="grid gap-3"
          >
            <header class="flex flex-wrap items-baseline gap-2 border-b border-border/70 pb-2">
              <span
                class="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-semibold"
                :class="ROADMAP_MILESTONE_META[group.milestone].classes"
              >
                <ListChecks class="size-3.5" />
                {{ ROADMAP_MILESTONE_META[group.milestone].label }}
              </span>
              <span class="text-xs text-muted-foreground">
                共 {{ group.items.length }} 项
              </span>
            </header>

            <ul class="grid gap-3 md:grid-cols-2">
              <li
                v-for="item in group.items"
                :key="item.id"
                class="grid gap-2 rounded-lg border border-border/70 bg-background p-4 shadow-sm dark:bg-card"
              >
                <div class="flex flex-wrap items-center gap-1.5">
                  <span
                    class="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-mono font-semibold"
                    :class="ROADMAP_PRIORITY_META[item.priority].classes"
                  >
                    {{ ROADMAP_PRIORITY_META[item.priority].label }}
                  </span>
                  <span
                    class="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium"
                    :class="ROADMAP_STATUS_META[item.status].classes"
                  >
                    {{ ROADMAP_STATUS_META[item.status].label }}
                  </span>
                  <span class="text-[10px] text-muted-foreground">
                    {{ ROADMAP_CATEGORY_META[item.category].label }}
                  </span>
                </div>

                <h3 class="text-sm font-semibold leading-tight">
                  {{ item.title }}
                </h3>
                <p class="text-xs leading-relaxed text-muted-foreground">
                  {{ item.goal }}
                </p>

                <div v-if="item.deliverables.length" class="mt-1 grid gap-1">
                  <p class="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    关键交付物
                  </p>
                  <ul class="grid gap-1">
                    <li
                      v-for="d in item.deliverables"
                      :key="d"
                      class="flex gap-1.5 text-xs leading-relaxed text-muted-foreground"
                    >
                      <span class="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/60" />
                      <span>{{ d }}</span>
                    </li>
                  </ul>
                </div>

                <p v-if="item.risk" class="mt-1 rounded border border-amber-300/60 bg-amber-50/60 px-2 py-1 text-[11px] leading-relaxed text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                  风险 / 依赖：{{ item.risk }}
                </p>

                <div class="mt-1 flex flex-wrap gap-1">
                  <span
                    v-for="aud in item.audience"
                    :key="aud"
                    class="rounded border border-border/70 bg-muted/40 px-1.5 py-0.5 text-[10px] text-muted-foreground"
                  >
                    {{ ROADMAP_AUDIENCE_META[aud] }}
                  </span>
                </div>
              </li>
            </ul>
          </article>
        </div>

        <!-- 底部免责声明：roadmap ≠ 承诺 -->
        <p class="mt-8 rounded-lg border border-dashed border-border/70 bg-muted/20 p-3 text-center text-xs text-muted-foreground">
          路线图基于当前优先级排序，会随用户反馈与平台政策调整。条目数量与状态不构成对外承诺，仅反映"已被识别为重要、需要排进 backlog"。
        </p>
      </section>
    </div>
  </main>
</template>
