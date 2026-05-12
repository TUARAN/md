<script setup lang="ts">
import { PenLine } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { APP_NAME } from '@/constants/branding'
import { toast } from '@/utils/toast'
import WorkflowPageShell from './WorkflowPageShell.vue'
import WorkflowPageTitle from './WorkflowPageTitle.vue'
import WorkflowSectionTitle from './WorkflowSectionTitle.vue'

const templates = [
  {
    name: `多平台 · 语气重写`,
    text: `下面是一篇原文梗概（或粘贴要点）：{原文摘要}\n\n请做「风格二创」：分别产出适合公众号、小红书、短视频口播文案三版。每版保持事实一致，调整篇幅、语气和 CTA；用 Markdown，小标题清晰。`,
  },
  {
    name: `同一主题 · 体裁变换`,
    text: `主题：{主题}\n平台：{目标平台列表}\n\n在不大改核心信息的前提下，把内容二创为：一则短动态（≤140 字）、一则中长图文大纲（3–5 节）、一条口语化开场钩子（15 秒内可读）。`,
  },
  {
    name: `轻量润色 · 保持结构`,
    text: `以下内容已写好，请只做风格化改写与节奏优化，不改变章节结构与小标题层级：\n\n{粘贴 Markdown}\n\n要求：更口语/更干货二选一；删废话；保留列表与链接；总字数浮动 ±15%。`,
  },
] as const

async function copyTemplate(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(`已复制到剪贴板`)
  }
  catch {
    toast.error(`复制失败，请手动选中复制`)
  }
}
</script>

<template>
  <WorkflowPageShell>
    <template #header>
      <WorkflowPageTitle>
        <template #icon>
          <PenLine />
        </template>
        风格二创
      </WorkflowPageTitle>
      <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
        在 {{ APP_NAME }} 中定稿或列好要点后，可用下列提示语在 AI 里做「二创」：按平台改编语气与篇幅，统一事实、适配多端分发。请替换「{}」占位符后再生成。
      </p>
    </template>

    <div class="space-y-4 pb-4">
      <WorkflowSectionTitle>
        二创提示语模版
      </WorkflowSectionTitle>
      <div
        v-for="tpl in templates"
        :key="tpl.name"
        class="rounded-lg border border-border bg-muted/40 p-3"
      >
        <div class="mb-2 flex items-center justify-between gap-2">
          <span class="text-xs font-medium text-foreground">{{ tpl.name }}</span>
          <Button
            class="h-7 shrink-0 text-xs"
            size="sm"
            variant="secondary"
            @click="copyTemplate(tpl.text)"
          >
            复制
          </Button>
        </div>
        <pre class="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded bg-background p-2 text-xs leading-relaxed text-muted-foreground">{{ tpl.text }}</pre>
      </div>
    </div>
  </WorkflowPageShell>
</template>
