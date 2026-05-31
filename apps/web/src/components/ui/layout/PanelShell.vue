<script setup lang="ts">
/**
 * `<PanelShell>` — the recurring "card panel" container used across workflow,
 * AI, and editor side panels.
 *
 * Absorbs the corner radius / padding / border / surface combinations that
 * have been hand-written ~10+ times. Use it as the outermost wrapper of an
 * inline content section. For modals / popovers, keep using shadcn's
 * `Dialog` / `Popover` primitives.
 *
 * Variants chosen to match what's already in the codebase — adding new tones
 * or sizes is fine, but prefer tweaking these over inventing per-component
 * one-offs.
 */

import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = withDefaults(defineProps<{
  /** Rendered tag — `'section'` is usually right for top-level panels. */
  as?: string
  /** Padding scale. Picks the value that matches the surface size. */
  padding?: 'sm' | 'md' | 'lg'
  /** Corner radius. `lg` = subordinate cards, `xl` = top-level surfaces. */
  radius?: 'md' | 'lg' | 'xl'
  /**
   * Surface tone. `neutral` is the default white-card look; `primary`,
   * `success`, and `warning` are tinted variants for emphasised panels.
   */
  tone?: 'neutral' | 'primary' | 'success' | 'warning' | 'muted'
  /** Drop the subtle elevation. Default is `shadow-sm`. */
  flat?: boolean
}>(), {
  as: `div`,
  padding: `md`,
  radius: `lg`,
  tone: `neutral`,
  flat: false,
})

const paddingClass = computed(() => ({
  sm: `p-3`,
  md: `p-4`,
  lg: `p-5`,
}[props.padding]))

const radiusClass = computed(() => ({
  md: `rounded-xl`,
  lg: `rounded-[18px]`,
  xl: `rounded-[22px]`,
}[props.radius]))

const toneClass = computed(() => ({
  neutral: `border border-border/80 bg-white/80 dark:bg-card`,
  primary: `border border-primary/25 bg-primary/[0.05] dark:bg-primary/10`,
  success: `border border-emerald-200/80 bg-emerald-50/50 dark:border-border dark:bg-card`,
  warning: `border border-amber-200/80 bg-amber-50/50 dark:border-border dark:bg-card`,
  muted: `border border-border/60 bg-muted/30 dark:bg-card/60`,
}[props.tone]))

const shadowClass = computed(() => (props.flat ? `` : `shadow-sm`))
</script>

<template>
  <component
    :is="as"
    :class="cn(paddingClass, radiusClass, toneClass, shadowClass)"
  >
    <slot />
  </component>
</template>
