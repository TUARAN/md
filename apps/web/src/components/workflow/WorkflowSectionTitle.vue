<script setup lang="ts">
withDefaults(
  defineProps<{
    /** 语义标签，默认 h2 */
    as?: string
  }>(),
  { as: `h2` },
)
/** 配置区、结果区等「内容块」标题，样式与页面主标题区分且在各页一致 */
</script>

<template>
  <component
    :is="as"
    class="workflow-section-title flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground"
  >
    <span
      class="inline-block h-3.5 w-1 shrink-0 rounded-full bg-primary/75"
      aria-hidden="true"
    />
    <span class="min-w-0 leading-snug">
      <slot />
    </span>
  </component>
</template>
