import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHashHistory, createWebHistory } from 'vue-router'

/**
 * 路由架构(2026-05 重构)
 *
 * - Web / Cloudflare Workers / Netlify: history mode,干净路径,SPA fallback 已在
 *   netlify.toml 和 wrangler.jsonc(`not_found_handling: single-page-application`)中配好
 * - 浏览器扩展(WXT 编译产物运行在 chrome-extension://)和 uTools(file://): hash mode
 * - 主入口 5 个 workflow 步骤(sync/data/creation/distribution/stats)挂在
 *   EditorLayout 下,共享 EditorHeader 顶栏。2026-05 把原「平台矩阵」并入
 *   「宣发活跃」(左列矩阵 + 右列单平台策略),`/matrix` 重定向到 `/distribution`
 * - 创作名片(`/creator-offer/:creatorId`)是独立公开页,不挂顶栏。
 *   原 `/creator-profile` 公开矩阵已废弃,重定向到 `/distribution`
 *
 * 旧版兼容(过渡期):访问 `/#content-sync`、`/#data` 等老书签会被 beforeEach 守卫
 * 重写为 `/sync`、`/data` 等新路径
 */

const EditorLayout = () => import('@/layouts/EditorLayout.vue')
const SyncPage = () => import('@/views/SyncPage.vue')

// 非默认 workflow 页一律懒加载,首屏只装编辑器
const WorkflowDataPage = () => import('@/components/workflow/WorkflowDataPage.vue')
const WorkflowCreationPage = () => import('@/components/workflow/WorkflowCreationPage.vue')
const WorkflowDistributionPage = () => import('@/components/workflow/WorkflowDistributionPage.vue')
const WorkflowStatsPage = () => import('@/components/workflow/WorkflowStatsPage.vue')

const CreatorOfferPage = () => import('@/views/CreatorOfferPage.vue')
const ImportDocsPage = () => import('@/views/ImportDocsPage.vue')
const PricingPage = () => import('@/views/PricingPage.vue')

/** workflow 步骤路由名,与 stores/ui.ts 中的 `WorkflowAppPage` 一一对应 */
export const WORKFLOW_ROUTE_NAMES = [`sync`, `data`, `creation`, `distribution`, `stats`] as const
export type WorkflowRouteName = (typeof WORKFLOW_ROUTE_NAMES)[number]

/** 旧版 hash → 新路由名映射,用于兼容老书签 (`matrix` 已并入 `distribution`) */
const LEGACY_HASH_TO_ROUTE: Record<string, WorkflowRouteName> = {
  'content-sync': `sync`,
  'data': `data`,
  'creation': `creation`,
  'matrix': `distribution`,
  'distribution': `distribution`,
  'stats': `stats`,
}

const routes: RouteRecordRaw[] = [
  {
    path: `/`,
    component: EditorLayout,
    children: [
      { path: ``, redirect: { name: `sync` } },
      { path: `sync`, name: `sync`, component: SyncPage },
      { path: `data`, name: `data`, component: WorkflowDataPage },
      { path: `creation`, name: `creation`, component: WorkflowCreationPage },
      { path: `distribution`, name: `distribution`, component: WorkflowDistributionPage },
      { path: `stats`, name: `stats`, component: WorkflowStatsPage },
    ],
  },
  // /matrix 已并入 /distribution(2026-05);保留 redirect 兜住老书签 / 旧外链
  { path: `/matrix`, redirect: `/distribution` },
  // /creator-profile 早期公开矩阵页, 一并指向 /distribution
  { path: `/creator-profile`, redirect: `/distribution` },
  // 站外文章接入文档(公开页,不挂顶栏)
  { path: `/docs/import`, name: `import-docs`, component: ImportDocsPage },
  // 定价 / 升级 Pro(公开页,不挂顶栏)
  { path: `/pricing`, name: `pricing`, component: PricingPage },
  {
    path: `/creator-offer/:creatorId`,
    name: `creator-offer`,
    component: CreatorOfferPage,
    props: route => ({ creatorId: String(route.params.creatorId).trim().toLowerCase() }),
  },
  // 兜底:未知路径回主编辑器。redirect 用字符串路径,避免把 pathMatch 参数带过去触发警告
  { path: `/:pathMatch(.*)*`, redirect: `/sync` },
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
