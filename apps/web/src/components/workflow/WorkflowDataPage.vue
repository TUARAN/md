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
        选题素材
      </WorkflowPageTitle>
      <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
        按关键词检索最新内容，先找到值得写的选题和素材，再进入写作、改写与发布。
      </p>
      <div class="mt-3">
        <GNewsFetchRail />
      </div>
    </template>

    <GNewsFetchResults class="min-h-0" />
  </WorkflowPageShell>
</template>
