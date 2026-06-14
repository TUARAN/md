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

// 与 editor-header 的三条 workflow 线命名保持一致
const WORKFLOW_STEP_LABELS: Record<string, string> = {
  'data': `找素材`,
  'booklet-research': `调研选题`,
  'booklet-plan': `小册策划`,
  'booklet-writing': `章节生产`,
  'repo-idea': `项目选题`,
  'repo-plan': `仓库策划`,
  'repo-build': `代码脚手架`,
  'creation': `写文章`,
  'import': `外站接入`,
  'distribution': `矩阵管理`,
  'stats': `数据复盘`,
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
