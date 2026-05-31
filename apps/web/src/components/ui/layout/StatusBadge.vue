<script setup lang="ts">
/**
 * `<StatusBadge>` — small pill used to convey state (locked / unlocked,
 * online / offline, free / pro, etc.).
 *
 * Visual: rounded full + icon + label, tone-tinted background.
 */

import type { Component } from 'vue'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  tone?: 'neutral' | 'success' | 'warning' | 'info' | 'danger'
  icon?: Component
}>(), {
  tone: `neutral`,
})

const toneClass = computed(() => ({
  neutral: `bg-slate-200 text-slate-700 dark:bg-muted dark:text-muted-foreground`,
  success: `bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300`,
  warning: `bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300`,
  info: `bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300`,
  danger: `bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300`,
}[props.tone]))
</script>

<template>
  <span
    :class="cn(
      `inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium`,
      toneClass,
    )"
  >
    <component :is="icon" v-if="icon" class="size-3" />
    <slot />
  </span>
</template>
