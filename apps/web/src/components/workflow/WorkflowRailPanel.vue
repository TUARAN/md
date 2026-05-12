<script setup lang="ts">
import WorkflowSectionTitle from './WorkflowSectionTitle.vue'

defineProps<{
  title?: string
}>()
</script>

<template>
  <section
    class="workflow-rail-panel w-full space-y-3 rounded-lg border border-border/70 bg-muted/20 p-3 md:p-3.5"
  >
    <WorkflowSectionTitle v-if="title">
      {{ title }}
    </WorkflowSectionTitle>
    <div class="space-y-3">
      <slot />
    </div>
  </section>
</template>
