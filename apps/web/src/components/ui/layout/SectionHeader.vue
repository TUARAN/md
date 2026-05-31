<script setup lang="ts">
/**
 * `<SectionHeader>` — title row used inside `<PanelShell>` and standalone
 * sections. Slots:
 *
 *   - default: title content (overrides `title` prop)
 *   - description: subtitle (overrides `description` prop)
 *   - actions: trailing buttons / badges
 *
 * The icon prop accepts any component (intended for `lucide-vue-next` icons).
 */

import type { Component } from 'vue'
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  title?: string
  description?: string
  icon?: Component
  /** Title weight / size. `md` matches editor section headers; `sm` is tight. */
  size?: 'sm' | 'md'
  /** Title tone. `accent` paints the title in the primary brand colour. */
  tone?: 'default' | 'accent' | 'success'
}>(), {
  size: `md`,
  tone: `default`,
})

const titleClass = computed(() => cn(
  `flex items-center gap-2 font-semibold`,
  props.size === `md` ? `text-sm` : `text-xs`,
  {
    default: `text-foreground`,
    accent: `text-primary`,
    success: `text-emerald-800 dark:text-primary`,
  }[props.tone],
))
</script>

<template>
  <header class="flex flex-wrap items-start justify-between gap-3">
    <div class="min-w-0 space-y-1">
      <div :class="titleClass">
        <component :is="icon" v-if="icon" class="size-4 shrink-0" />
        <span class="truncate">
          <slot>{{ title }}</slot>
        </span>
      </div>
      <p
        v-if="$slots.description || description"
        class="text-xs leading-relaxed text-muted-foreground"
      >
        <slot name="description">
          {{ description }}
        </slot>
      </p>
    </div>
    <div v-if="$slots.actions" class="flex shrink-0 items-center gap-1.5">
      <slot name="actions" />
    </div>
  </header>
</template>
