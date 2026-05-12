<script setup lang="ts">
import { BarChart3 } from 'lucide-vue-next'
import WorkflowPageShell from './WorkflowPageShell.vue'
import WorkflowPageTitle from './WorkflowPageTitle.vue'
import WorkflowSectionTitle from './WorkflowSectionTitle.vue'
</script>

<template>
  <WorkflowPageShell>
    <template #header>
      <WorkflowPageTitle>
        <template #icon>
          <BarChart3 />
        </template>
        闭环汇报
      </WorkflowPageTitle>
    </template>
    <div class="space-y-3 pb-4">
      <WorkflowSectionTitle>
        当前说明
      </WorkflowSectionTitle>
      <p class="text-sm leading-relaxed text-muted-foreground">
        曝光、阅读、互动与转化等数据回流与复盘汇报将在后续版本接入；当前步骤仅占位。
      </p>
    </div>
  </WorkflowPageShell>
</template>
