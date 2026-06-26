import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'

/**
 * 路由架构(2026-05 Phase 3.1: 编辑器与 workflow 分离)
 *
 * - Web / Cloudflare Workers / Netlify: history mode,干净路径,SPA fallback 已在
 *   netlify.toml 和 wrangler.jsonc(`not_found_handling: single-page-application`)中配好
 * - 浏览器扩展(WXT 编译产物运行在 chrome-extension://)和 uTools(file://): hash mode
 *
 * **新 IA(Phase 3.1, 2026-05):**
 *
 *   /                            → 重定向到 /edit
 *   /edit                        编辑器主页(name=sync) — 文章线「排版发布」步骤
 *   /workflow/opinion/idea       name=opinion-idea         观点提炼
 *   /workflow/opinion/rewrite    name=opinion-rewrite      短内容改写
 *   /workflow/opinion/distribution name=opinion-distribution 观点分发
 *   /workflow/opinion/loop       name=opinion-loop         互动复盘
 *   /workflow/article/data       name=data       素材采集
 *   /workflow/article/creation   name=creation   文章创作
 *   /workflow/article/distribution name=distribution  矩阵运营
 *   /workflow/article/stats      name=stats      数据闭环
 *   /workflow/booklet/research   name=booklet-research 调研选题
 *   /workflow/booklet/plan       name=booklet-plan     内容策划
 *   /workflow/booklet/writing    name=booklet-writing  章节生产
 *   /workflow/booklet/operation  name=booklet-operation 矩阵运营
 *   /workflow/booklet/loop       name=booklet-loop      数据闭环
 *   /workflow/opensource/idea     name=repo-idea        项目选题
 *   /workflow/opensource/plan     name=repo-plan        规格策划
 *   /workflow/opensource/build    name=repo-build       工程搭建
 *   /workflow/opensource/operation name=repo-operation  矩阵运营
 *   /workflow/opensource/loop     name=repo-loop        数据闭环
 *   /workflow/import             name=import     外站接入
 *   /pricing                     name=pricing    AI 算力额度（成本价中转）
 *   /changelog                   name=changelog  更新日志
 *   /docs/import                 name=import-docs  站外接入文档
 *   /creator-offer/:creatorId    name=creator-offer  创作名片（本人或 ?share=token 只读）
 *
 * 路由 **名字** 维持不变(sync / data / creation / import / distribution / stats),只有
 * **路径** 改了。这样所有 `router.push({ name: 'sync' })` 都不用动。
 *
 * **老路径兼容:**
 *   /sync             → /edit
 *   /data             → /workflow/article/data
 *   /creation         → /workflow/article/creation
 *   /distribution     → /workflow/article/distribution
 *   /stats            → /workflow/article/stats
 *   /matrix           → /workflow/article/distribution(2026-05 并入)
 *   /creator-profile  → /workflow/article/distribution(早期公开矩阵页废弃)
 *   /workflow/{data,creation,distribution,stats} → /workflow/article/*(2026-06 收拢)
 *   /repository, /workflow/repository/*  → /workflow/opensource/*(2026-06 仓库线 → 开源线)
 *
 * 老 hash 书签(`/#content-sync` / `/#data` …) 仍由 beforeEach 守卫重写为命名路由。
 *
 * **Phase 3.2 计划:** 把 4 个 workflow 页从 EditorLayout 拆出来挂到独立的
 * WorkflowLayout,右侧栏不再混装编辑器与 workflow 内容。
 */

const EditorLayout = () => import('@/layouts/EditorLayout.vue')
const SyncPage = () => import('@/views/SyncPage.vue')

// 非默认 workflow 页一律懒加载,首屏只装编辑器
const WorkflowDataPage = () => import('@/components/workflow/WorkflowDataPage.vue')
const WorkflowOpinionPage = () => import('@/components/workflow/WorkflowOpinionPage.vue')
const WorkflowBookletResearchPage = () => import('@/components/workflow/WorkflowBookletResearchPage.vue')
const WorkflowBookletPlanPage = () => import('@/components/workflow/WorkflowBookletPlanPage.vue')
const WorkflowBookletWritingPage = () => import('@/components/workflow/WorkflowBookletWritingPage.vue')
const WorkflowBookletLifecyclePage = () => import('@/components/workflow/WorkflowBookletLifecyclePage.vue')
const WorkflowRepositoryPage = () => import('@/components/workflow/WorkflowRepositoryPage.vue')
const WorkflowCreationPage = () => import('@/components/workflow/WorkflowCreationPage.vue')
const WorkflowImportPage = () => import('@/components/workflow/WorkflowImportPage.vue')
const WorkflowDistributionPage = () => import('@/components/workflow/WorkflowDistributionPage.vue')
const WorkflowStatsPage = () => import('@/components/workflow/WorkflowStatsPage.vue')

const CreatorOfferPage = () => import('@/views/CreatorOfferPage.vue')
const ImportDocsPage = () => import('@/views/ImportDocsPage.vue')
const PricingPage = () => import('@/views/PricingPage.vue')
const SettingsPage = () => import('@/views/SettingsPage.vue')
const ChangelogPage = () => import('@/views/ChangelogPage.vue')

/** workflow 步骤路由名,与 stores/ui.ts 中的 `WorkflowAppPage` 一一对应 */
export const WORKFLOW_ROUTE_NAMES = [`sync`, `opinion-idea`, `opinion-rewrite`, `opinion-distribution`, `opinion-loop`, `data`, `booklet-research`, `booklet-plan`, `booklet-writing`, `booklet-operation`, `booklet-loop`, `repo-idea`, `repo-plan`, `repo-build`, `repo-operation`, `repo-loop`, `creation`, `import`, `distribution`, `stats`] as const
export type WorkflowRouteName = (typeof WORKFLOW_ROUTE_NAMES)[number]

/** 旧版 hash → 新路由名映射,用于兼容老书签 (`matrix` 已并入 `distribution`) */
const LEGACY_HASH_TO_ROUTE: Record<string, WorkflowRouteName> = {
  'opinion': `opinion-idea`,
  'content-sync': `sync`,
  'data': `data`,
  'monetize': `booklet-plan`,
  'repository': `repo-plan`,
  'creation': `creation`,
  'import': `import`,
  'matrix': `distribution`,
  'distribution': `distribution`,
  'stats': `stats`,
}

const routes: RouteRecordRaw[] = [
  {
    path: `/`,
    component: EditorLayout,
    children: [
      // 主入口:编辑器永远在根路径,/edit 是规范 URL
      { path: ``, redirect: { name: `sync` } },
      { path: `edit`, name: `sync`, component: SyncPage },
      // workflow 步骤搬到 /workflow/<lane>/*。Phase 3.2 会把它们拆出 EditorLayout。
      // 观点线：百字短内容先行，适配微博 / 沸点 / X 等短内容渠道
      { path: `workflow/opinion`, redirect: { name: `opinion-idea` } },
      { path: `workflow/opinion/idea`, name: `opinion-idea`, component: WorkflowOpinionPage },
      { path: `workflow/opinion/rewrite`, name: `opinion-rewrite`, component: WorkflowOpinionPage },
      { path: `workflow/opinion/distribution`, name: `opinion-distribution`, component: WorkflowOpinionPage },
      { path: `workflow/opinion/loop`, name: `opinion-loop`, component: WorkflowOpinionPage },
      // 文章线（排版发布 = 编辑器主页 /edit,故父级 redirect 到 sync）
      { path: `workflow/article`, redirect: { name: `sync` } },
      { path: `workflow/article/data`, name: `data`, component: WorkflowDataPage },
      { path: `workflow/article/creation`, name: `creation`, component: WorkflowCreationPage },
      { path: `workflow/article/distribution`, name: `distribution`, component: WorkflowDistributionPage },
      { path: `workflow/article/stats`, name: `stats`, component: WorkflowStatsPage },
      { path: `workflow/booklet`, redirect: { name: `booklet-plan` } },
      { path: `workflow/booklet/research`, name: `booklet-research`, component: WorkflowBookletResearchPage },
      { path: `workflow/booklet/plan`, name: `booklet-plan`, component: WorkflowBookletPlanPage },
      { path: `workflow/booklet/writing`, name: `booklet-writing`, component: WorkflowBookletWritingPage },
      { path: `workflow/booklet/operation`, name: `booklet-operation`, component: WorkflowBookletLifecyclePage },
      { path: `workflow/booklet/loop`, name: `booklet-loop`, component: WorkflowBookletLifecyclePage },
      { path: `workflow/monetize`, redirect: { name: `booklet-plan` } },
      // 开源线（route name 仍是 repo-*,只改路径,避免动所有 router.push）
      { path: `workflow/opensource`, redirect: { name: `repo-plan` } },
      { path: `workflow/opensource/idea`, name: `repo-idea`, component: WorkflowRepositoryPage },
      { path: `workflow/opensource/plan`, name: `repo-plan`, component: WorkflowRepositoryPage },
      { path: `workflow/opensource/build`, name: `repo-build`, component: WorkflowRepositoryPage },
      { path: `workflow/opensource/operation`, name: `repo-operation`, component: WorkflowRepositoryPage },
      { path: `workflow/opensource/loop`, name: `repo-loop`, component: WorkflowRepositoryPage },
      // 旧 /workflow/repository/* 兼容(2026-06 仓库线 → 开源线改名),保留一段时间后清掉
      { path: `workflow/repository`, redirect: { name: `repo-plan` } },
      { path: `workflow/repository/idea`, redirect: { name: `repo-idea` } },
      { path: `workflow/repository/plan`, redirect: { name: `repo-plan` } },
      { path: `workflow/repository/build`, redirect: { name: `repo-build` } },
      { path: `workflow/repository/operation`, redirect: { name: `repo-operation` } },
      { path: `workflow/repository/loop`, redirect: { name: `repo-loop` } },
      { path: `workflow/import`, name: `import`, component: WorkflowImportPage },
      // 旧扁平文章线路径兼容(2026-06 收拢到 /workflow/article/*),保留一段时间后清掉
      { path: `workflow/data`, redirect: { name: `data` } },
      { path: `workflow/creation`, redirect: { name: `creation` } },
      { path: `workflow/distribution`, redirect: { name: `distribution` } },
      { path: `workflow/stats`, redirect: { name: `stats` } },
    ],
  },

  // 老路径兼容(Phase 3.1):保留 1 个月后清掉
  { path: `/sync`, redirect: `/edit` },
  { path: `/opinion`, redirect: `/workflow/opinion/idea` },
  { path: `/data`, redirect: `/workflow/article/data` },
  { path: `/monetize`, redirect: `/workflow/booklet/plan` },
  { path: `/repository`, redirect: `/workflow/opensource/plan` },
  { path: `/creation`, redirect: `/workflow/article/creation` },
  { path: `/import`, redirect: `/workflow/import` },
  { path: `/distribution`, redirect: `/workflow/article/distribution` },
  { path: `/stats`, redirect: `/workflow/article/stats` },
  // /matrix 已并入 distribution(2026-05);/creator-profile 早期公开矩阵页废弃
  { path: `/matrix`, redirect: `/workflow/article/distribution` },
  { path: `/creator-profile`, redirect: `/workflow/article/distribution` },

  // 站外文章接入文档(公开页,不挂顶栏)
  { path: `/docs/import`, name: `import-docs`, component: ImportDocsPage },
  // AI 算力额度充值页（公开页，不挂顶栏；工具本身永久免费）
  { path: `/pricing`, name: `pricing`, component: PricingPage },
  // 更新日志(公开页,不挂顶栏)
  { path: `/changelog`, name: `changelog`, component: ChangelogPage },
  // 设置中心 — 单页 + 左侧 section nav(公开页,不挂顶栏)
  { path: `/settings`, name: `settings`, component: SettingsPage },
  {
    path: `/creator-offer/:creatorId`,
    name: `creator-offer`,
    component: CreatorOfferPage,
    props: route => ({ creatorId: String(route.params.creatorId).trim().toLowerCase() }),
  },

  // 兜底:未知路径回编辑器主入口。用函数式 redirect 强制丢掉 query/hash,
  // 避免 Worker API 路径被 SPA fallback 接住后把临时 query 带进 `/edit`。
  { path: `/:pathMatch(.*)*`, redirect: () => ({ path: `/edit`, query: {}, hash: `` }) },
]

/**
 * 浏览器扩展(chrome-extension://)、uTools(file://) 等非 http 协议下,
 * history mode 的 pushState 会被浏览器拒绝。改用 hash mode 兜底。
 */
function shouldUseHashHistory(): boolean {
  if (typeof window === `undefined`)
    return false
  const protocol = window.location.protocol
  return protocol !== `http:` && protocol !== `https:`
}

const history = shouldUseHashHistory()
  ? createWebHashHistory(import.meta.env.BASE_URL)
  : createWebHistory(import.meta.env.BASE_URL)

export const router = createRouter({
  history,
  routes,
  // 切换路由时滚动回顶部,但保留 anchor hash 行为(例如 `/creator-offer/x#content-sync`)
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition)
      return savedPosition
    if (to.hash)
      return { el: to.hash, behavior: `smooth` }
    return { left: 0, top: 0 }
  },
})

/**
 * 兼容旧 hash 书签:访问 `/`(或 base path)且 hash 为旧 anchor 之一时,
 * 改写为对应的命名路由。这一守卫只在 history mode 下有意义。
 */
router.beforeEach((to) => {
  if (!to.hash)
    return true
  if (to.name && to.name !== `sync`)
    return true

  // 仅处理 `/` 或 `/sync` 上挂着的旧 anchor
  const cleanedHash = to.hash.replace(/^#/, ``)
  const legacyTarget = LEGACY_HASH_TO_ROUTE[cleanedHash]
  if (!legacyTarget)
    return true

  return { name: legacyTarget, hash: ``, replace: true } as ReturnType<typeof routes[number] extends never ? never : any>
})
