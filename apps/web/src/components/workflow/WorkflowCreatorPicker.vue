<script setup lang="ts">
import { listWorkflowCreators } from '@/constants/creators'
import { useUIStore } from '@/stores/ui'

const uiStore = useUIStore()
const { workflowCreatorId } = storeToRefs(uiStore)
const { setWorkflowCreatorId } = uiStore

const creators = listWorkflowCreators()
</script>

<template>
  <div class="flex flex-wrap items-center gap-2" role="group" aria-label="创作者">
    <span class="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">创作者</span>
    <div class="inline-flex flex-wrap gap-1 rounded-lg border border-border/80 bg-muted/30 p-0.5">
      <button
        v-for="creator in creators"
        :key="creator.id"
        type="button"
        class="rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
        :class="workflowCreatorId === creator.id
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground'"
        @click="setWorkflowCreatorId(creator.id)"
      >
        {{ creator.displayName }}
        <span class="ml-1 font-mono text-[10px] opacity-70">{{ creator.id }}</span>
      </button>
    </div>
  </div>
</template>
