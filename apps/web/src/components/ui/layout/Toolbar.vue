<script setup lang="ts">
/**
 * `<Toolbar>` — horizontal action row. Pairs with `<SectionHeader>` for the
 * "label on left, actions on right" pattern, but also works standalone as a
 * sticky footer-style action row.
 *
 * Two slots:
 *   - default: leading content (often label / status)
 *   - end: trailing actions (buttons)
 *
 * If only one slot is used, content collapses to that edge.
 */

import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  /** Horizontal arrangement when both slots are filled. */
  align?: 'between' | 'start' | 'end'
  /** Wrap behaviour. Default wraps so toolbars adapt on narrow widths. */
  wrap?: boolean
}>(), {
  align: `between`,
  wrap: true,
})

const alignClass = computed(() => ({
  between: `justify-between`,
  start: `justify-start`,
  end: `justify-end`,
}[props.align]))
</script>

<template>
  <div
    :class="cn(
      `flex items-center gap-2`,
      wrap && `flex-wrap`,
      alignClass,
    )"
  >
    <div v-if="$slots.default" class="flex min-w-0 items-center gap-2">
      <slot />
    </div>
    <div v-if="$slots.end" class="flex items-center gap-2">
      <slot name="end" />
    </div>
  </div>
</template>
