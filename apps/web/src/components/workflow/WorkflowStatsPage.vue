<script setup lang="ts">
import { BarChart3, Database, HardHat, PenLine, RefreshCw } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/stores/ui'
import WorkflowPageShell from './WorkflowPageShell.vue'
import WorkflowPageTitle from './WorkflowPageTitle.vue'

const { setWorkflowAppPage } = useUIStore()

const nextSteps = [
  { id: `data` as const, label: `数据获取`, icon: Database, hint: `先找素材` },
  { id: `creation` as const, label: `风格二创`, icon: PenLine, hint: `再写成稿` },
  { id: `sync` as const, label: `内容同步`, icon: RefreshCw, hint: `排版与复制` },
]
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
    <div class="flex min-h-0 flex-1 items-start justify-center py-6">
      <div class="w-full max-w-xl rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-center">
        <div class="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-background text-muted-foreground shadow-sm ring-1 ring-border">
          <HardHat class="size-6" />
        </div>
        <h2 class="text-base font-semibold text-foreground">
          建设中
        </h2>
        <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
          曝光、阅读、互动与转化等数据回流与复盘汇报将在后续版本接入；当前仅占位。
        </p>
        <div class="mt-5 flex flex-wrap justify-center gap-2">
          <Button
            v-for="step in nextSteps"
            :key="step.id"
            class="h-9 px-3 text-xs"
            type="button"
            variant="secondary"
            @click="setWorkflowAppPage(step.id)"
          >
            <component :is="step.icon" class="mr-1.5 size-3.5" />
            去{{ step.label }}
            <span class="ml-1.5 text-muted-foreground">· {{ step.hint }}</span>
          </Button>
        </div>
      </div>
    </div>
  </WorkflowPageShell>
</template>
