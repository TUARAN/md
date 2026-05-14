<script setup lang="ts">
import { Database } from 'lucide-vue-next'
import { GNewsFetchRail, GNewsFetchResults } from '@/components/ai/gnews'
import WorkflowPageShell from './WorkflowPageShell.vue'
import WorkflowPageTitle from './WorkflowPageTitle.vue'
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
        已接入 7 个资讯源，可按关键词批量检索最新内容，筛选高价值素材后进入理解、二创与传播流程。
      </p>
      <div class="mt-3">
        <GNewsFetchRail />
      </div>
    </template>

    <GNewsFetchResults class="min-h-0" />
  </WorkflowPageShell>
</template>
