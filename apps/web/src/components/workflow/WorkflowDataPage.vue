<script setup lang="ts">
import { Database } from 'lucide-vue-next'
import { GNewsFetchRail, GNewsFetchResults } from '@/components/ai/gnews'
import WorkflowPageShell from './WorkflowPageShell.vue'
import WorkflowPageTitle from './WorkflowPageTitle.vue'
import WorkflowRailPanel from './WorkflowRailPanel.vue'
</script>

<template>
  <WorkflowPageShell>
    <template #header>
      <WorkflowPageTitle>
        <template #icon>
          <Database />
        </template>
        数据获取
      </WorkflowPageTitle>
      <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
        选择信息源检索资讯，统一经资讯 Worker 请求并整理为参考材料。
      </p>
    </template>

    <template #rail>
      <WorkflowRailPanel title="检索与配置">
        <GNewsFetchRail />
      </WorkflowRailPanel>
    </template>

    <GNewsFetchResults class="min-h-0" />
  </WorkflowPageShell>
</template>
