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
 *   /edit                        编辑器主页(name=sync) — 排版分发 / 预览 / 发布准备
 *   /workflow/data               name=data       选择素材
 *   /workflow/booklet/research   name=booklet-research 小册调研选题
 *   /workflow/booklet/plan       name=booklet-plan     小册策划
 *   /workflow/booklet/writing    name=booklet-writing  小册章节生产
 *   /workflow/repository/idea     name=repo-idea        仓库项目选题
 *   /workflow/repository/plan     name=repo-plan        仓库策划
 *   /workflow/repository/build    name=repo-build       代码脚手架
 *   /workflow/creation           name=creation   AI 创作
 *   /workflow/import             name=import     外站接入
 *   /workflow/distribution       name=distribution  数据策略
 *   /workflow/stats              name=stats      增长运营
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
 *   /data             → /workflow/data
 *   /creation         → /workflow/creation
 *   /distribution     → /workflow/distribution
 *   /stats            → /workflow/stats
 *   /matrix           → /workflow/distribution(2026-05 并入)
 *   /creator-profile  → /workflow/distribution(早期公开矩阵页废弃)
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
const WorkflowBookletResearchPage = () => import('@/components/workflow/WorkflowBookletResearchPage.vue')
const WorkflowBookletPlanPage = () => import('@/components/workflow/WorkflowBookletPlanPage.vue')
const WorkflowBookletWritingPage = () => import('@/components/workflow/WorkflowBookletWritingPage.vue')
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
export const WORKFLOW_ROUTE_NAMES = [`sync`, `data`, `booklet-research`, `booklet-plan`, `booklet-writing`, `repo-idea`, `repo-plan`, `repo-build`, `creation`, `import`, `distribution`, `stats`] as const
export type WorkflowRouteName = (typeof WORKFLOW_ROUTE_NAMES)[number]

/** 旧版 hash → 新路由名映射,用于兼容老书签 (`matrix` 已并入 `distribution`) */
const LEGACY_HASH_TO_ROUTE: Record<string, WorkflowRouteName> = {
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
      // workflow 步骤搬到 /workflow/*。Phase 3.2 会把它们拆出 EditorLayout。
      { path: `workflow/data`, name: `data`, component: WorkflowDataPage },
      { path: `workflow/booklet/research`, name: `booklet-research`, component: WorkflowBookletResearchPage },
      { path: `workflow/booklet/plan`, name: `booklet-plan`, component: WorkflowBookletPlanPage },
      { path: `workflow/booklet/writing`, name: `booklet-writing`, component: WorkflowBookletWritingPage },
      { path: `workflow/monetize`, redirect: { name: `booklet-plan` } },
      { path: `workflow/repository`, redirect: { name: `repo-plan` } },
      { path: `workflow/repository/idea`, name: `repo-idea`, component: WorkflowRepositoryPage },
      { path: `workflow/repository/plan`, name: `repo-plan`, component: WorkflowRepositoryPage },
      { path: `workflow/repository/build`, name: `repo-build`, component: WorkflowRepositoryPage },
      { path: `workflow/creation`, name: `creation`, component: WorkflowCreationPage },
      { path: `workflow/import`, name: `import`, component: WorkflowImportPage },
      { path: `workflow/distribution`, name: `distribution`, component: WorkflowDistributionPage },
      { path: `workflow/stats`, name: `stats`, component: WorkflowStatsPage },
    ],
  },

  // 老路径兼容(Phase 3.1):保留 1 个月后清掉
  { path: `/sync`, redirect: `/edit` },
  { path: `/data`, redirect: `/workflow/data` },
  { path: `/monetize`, redirect: `/workflow/booklet/plan` },
  { path: `/repository`, redirect: `/workflow/repository/plan` },
  { path: `/creation`, redirect: `/workflow/creation` },
  { path: `/import`, redirect: `/workflow/import` },
  { path: `/distribution`, redirect: `/workflow/distribution` },
  { path: `/stats`, redirect: `/workflow/stats` },
  // /matrix 已并入 distribution(2026-05);/creator-profile 早期公开矩阵页废弃
  { path: `/matrix`, redirect: `/workflow/distribution` },
  { path: `/creator-profile`, redirect: `/workflow/distribution` },

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
