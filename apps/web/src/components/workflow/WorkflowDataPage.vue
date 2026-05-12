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
        通过
        <a
          class="text-primary underline-offset-2 hover:underline"
          href="https://gnews.io/"
          rel="noopener noreferrer"
          target="_blank"
        >GNews</a>
        检索资讯并整理为参考材料；默认写入本地浏览器。免费档通常仅允许从 localhost 跨域访问接口。
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
