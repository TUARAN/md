<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  label: string
  icon: Component
  current: boolean
  comingSoon?: boolean
  phase?: string
  /** 移动端紧凑尺寸 */
  dense?: boolean
}>()

defineEmits<{ select: [] }>()
</script>

<template>
  <button
    type="button"
    class="workflow-step inline-flex shrink-0 items-center rounded-md font-medium transition-colors"
    :class="[
      dense ? 'gap-1 px-2 py-1 text-xs' : 'gap-1.5 px-2.5 py-1.5 text-sm',
      current
        ? 'workflow-step--current bg-primary/10 text-primary'
        : comingSoon
          ? 'workflow-step--pending text-muted-foreground/55 hover:bg-muted/40'
          : 'workflow-step--inactive text-muted-foreground hover:bg-muted/60 hover:text-foreground',
    ]"
    :title="comingSoon ? `${label}：后续接入` : `${phase}：${label}`"
    :aria-current="current ? 'step' : undefined"
    @click="$emit('select')"
  >
    <component :is="icon" :class="dense ? 'size-3.5' : 'size-4'" class="shrink-0" aria-hidden="true" />
    <span :class="dense ? 'max-w-[3.25rem] truncate' : 'truncate'">{{ label }}</span>
    <span v-if="comingSoon && !dense" class="workflow-step-badge">后续</span>
  </button>
</template>

<style lang="less" scoped>
.workflow-step {
  border: 0;
  cursor: pointer;
  font-family: inherit;
  letter-spacing: normal;
  text-transform: none;

  &:focus-visible {
    outline: 2px solid hsl(var(--ring));
    outline-offset: 2px;
  }
}

.workflow-step-badge {
  border-radius: 999px;
  padding: 0 0.375rem;
  font-size: 0.625rem;
  line-height: 1rem;
  color: hsl(var(--muted-foreground));
  background: hsl(var(--muted) / 0.6);
}
</style>
