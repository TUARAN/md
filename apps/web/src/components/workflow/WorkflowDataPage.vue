<script setup lang="ts">
import { Database } from 'lucide-vue-next'
import { GNewsFetchRail, GNewsFetchResults } from '@/components/ai/gnews'
import WorkflowPageShell from './WorkflowPageShell.vue'
import WorkflowPageTitle from './WorkflowPageTitle.vue'
</script>

<template>
  <WorkflowPageShell>
    <template #header>
      <div class="mb-3 inline-flex rounded-full border border-border/70 bg-white/70 px-2.5 py-1 text-xs font-medium text-muted-foreground dark:bg-card">
        Syncblog · 文章线
      </div>
      <WorkflowPageTitle>
        <template #icon>
          <Database />
        </template>
        素材采集
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
