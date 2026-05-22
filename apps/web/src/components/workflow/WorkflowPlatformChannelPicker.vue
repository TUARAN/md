<script setup lang="ts">
import { getCreatorPlatformMatrix } from '@/constants/creators'
import { listDistributionPlatformTypes } from '@/constants/distributionStrategies'
import { useUIStore } from '@/stores/ui'
import { getPlatformProfileTitle } from '@/utils/socialAccounts'

const props = withDefaults(
  defineProps<{
    creatorId?: string
    compact?: boolean
  }>(),
  { compact: false },
)

const uiStore = useUIStore()
const { workflowCreatorId, workflowDistributionPlatform } = storeToRefs(uiStore)
const { setWorkflowDistributionPlatform } = uiStore

const activeCreatorId = computed(() => props.creatorId ?? workflowCreatorId.value)

const platformTypes = computed(() => {
  const matrix = getCreatorPlatformMatrix(activeCreatorId.value).map(r => r.type)
  return listDistributionPlatformTypes(activeCreatorId.value, matrix)
})
</script>

<template>
  <div class="flex flex-col gap-2" role="group" :aria-label="compact ? '平台' : '宣发平台'">
    <span class="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
      {{ compact ? '平台' : '宣发平台（按渠道切换策略）' }}
    </span>
    <div
      class="flex gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:thin]"
      :class="compact ? 'flex-wrap' : 'flex-nowrap'"
    >
      <button
        v-for="type in platformTypes"
        :key="type"
        type="button"
        class="shrink-0 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors"
        :class="workflowDistributionPlatform === type
          ? 'border-primary/50 bg-primary/10 text-primary'
          : 'border-border/80 bg-background/80 text-muted-foreground hover:text-foreground'"
        @click="setWorkflowDistributionPlatform(type)"
      >
        {{ getPlatformProfileTitle(type) }}
      </button>
    </div>
  </div>
</template>
