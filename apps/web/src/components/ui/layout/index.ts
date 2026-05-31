/**
 * Layout primitives — extracted from repeated patterns across panels.
 *
 * Use these for all *new* inline content panels (not modals — those keep
 * using `Dialog` / `Popover` from shadcn-vue).
 *
 * - `PanelShell`    — card container with tone / radius / padding presets
 * - `SectionHeader` — icon + title + optional description + actions slot
 * - `Toolbar`       — action row (left + right slots, configurable alignment)
 * - `StatusBadge`   — small tone-tinted pill for state
 */

export { default as PanelShell } from './PanelShell.vue'
export { default as SectionHeader } from './SectionHeader.vue'
export { default as StatusBadge } from './StatusBadge.vue'
export { default as Toolbar } from './Toolbar.vue'
