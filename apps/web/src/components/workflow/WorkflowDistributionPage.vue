<script setup lang="ts">
import { Megaphone } from 'lucide-vue-next'
import WorkflowPageShell from './WorkflowPageShell.vue'
import WorkflowPageTitle from './WorkflowPageTitle.vue'
import WorkflowSectionTitle from './WorkflowSectionTitle.vue'
</script>

<template>
  <WorkflowPageShell>
    <template #header>
      <WorkflowPageTitle>
        <template #icon>
          <Megaphone />
        </template>
        宣发活跃
      </WorkflowPageTitle>
    </template>
    <div class="space-y-3 pb-4">
      <WorkflowSectionTitle>
        当前说明
      </WorkflowSectionTitle>
      <p class="text-sm leading-relaxed text-muted-foreground">
        多平台节奏、加热与社群活跃、渠道联动等能力将在后续版本接入；当前步骤仅占位，便于对齐整条工作流。
      </p>
    </div>
  </WorkflowPageShell>
</template>
