<script setup lang="ts">
/** 各工作流步骤页顶栏下的页面主标题，与 EditorHeader 区分、与区块标题层级不同 */
</script>

<template>
  <h1
    class="workflow-page-title flex items-center gap-2.5 text-lg font-semibold leading-snug tracking-tight text-foreground"
  >
    <span
      v-if="$slots.icon"
      class="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-primary/15 bg-primary/10 text-primary [&_svg]:size-[1.15rem]"
    >
      <slot name="icon" />
    </span>
    <span class="min-w-0">
      <slot />
    </span>
  </h1>
</template>
