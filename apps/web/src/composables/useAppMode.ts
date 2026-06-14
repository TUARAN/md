/**
 * `useAppMode` — derive the high-level UI mode from the current route.
 *
 * Drives chrome differentiation (header accent, body data-attr) so editor
 * and workflow modes feel distinct without splitting the actual layout.
 * Phase 3.4 will hang right-rail behaviour off this same signal.
 */

import type { Component } from 'vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

export type AppMode = 'editor' | 'workflow' | 'public'

/** Routes that render the editor experience (currently just `/edit`). */
const EDITOR_ROUTES = new Set([`sync`])

/** Routes that render public pages without the workflow chrome. */
const PUBLIC_ROUTES = new Set([`pricing`, `import-docs`, `creator-offer`, `settings`])

export interface AppModeInfo {
  mode: AppMode
  label: string
  /** A short Chinese label for the current workflow step (when in workflow mode). */
  stepLabel: string
}

// 标签与 editor-header 的车道内 chip 保持一致。也会用于浏览器标签页标题
// (`${APP_NAME} · ${stepLabel}`,见 App.vue);跨车道的通用阶段名(策划 /
// 矩阵运营 / 数据闭环)在标题里会跨车道重名,这是有意取舍——优先和顶栏一致。
const WORKFLOW_STEP_LABELS: Record<string, string> = {
  'data': `素材采集`,
  'booklet-research': `调研选题`,
  'booklet-plan': `内容策划`,
  'booklet-writing': `章节生产`,
  'booklet-operation': `矩阵运营`,
  'booklet-loop': `数据闭环`,
  'repo-idea': `项目选题`,
  'repo-plan': `规格策划`,
  'repo-build': `工程搭建`,
  'repo-operation': `矩阵运营`,
  'repo-loop': `数据闭环`,
  'creation': `文章创作`,
  'import': `外站接入`,
  'distribution': `矩阵运营`,
  'stats': `数据闭环`,
}

export function useAppMode() {
  const route = useRoute()

  const info = computed<AppModeInfo>(() => {
    const name = String(route.name ?? ``)
    if (PUBLIC_ROUTES.has(name))
      return { mode: `public`, label: ``, stepLabel: `` }
    if (EDITOR_ROUTES.has(name))
      return { mode: `editor`, label: `编辑器`, stepLabel: `排版发布` }
    return {
      mode: `workflow`,
      label: `工作流`,
      stepLabel: WORKFLOW_STEP_LABELS[name] ?? ``,
    }
  })

  return {
    mode: computed(() => info.value.mode),
    label: computed(() => info.value.label),
    stepLabel: computed(() => info.value.stepLabel),
  }
}

/** Optional helper for components that want to pick an icon per mode. */
export function pickByMode<T>(mode: AppMode, opts: { editor: T, workflow: T, public: T }): T {
  return opts[mode]
}

// Re-export `Component` so we don't have to import vue twice in consumers.
export type { Component }
