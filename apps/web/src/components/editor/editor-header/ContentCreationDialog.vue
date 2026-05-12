<script setup lang="ts">
import { APP_NAME } from '@/constants/branding'
import { toast } from '@/utils/toast'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([`close`])

function onUpdate(val: boolean) {
  if (!val)
    emit(`close`)
}

const templates = [
  {
    name: `技术解读 · 开篇`,
    text: `你是一位资深技术编辑。请根据以下要点，写一篇面向「{读者画像}」的解读文章：\n\n1. 背景：{一句话背景}\n2. 核心问题：{要解决什么}\n3. 结论先行：{你的观点}\n4. 展开：分 3 个小节说明原因与案例\n5. 结尾：可执行建议 + 延伸阅读\n\n语气：专业、克制、少用空话。`,
  },
  {
    name: `产品 / 功能说明`,
    text: `请用 Markdown 写一篇「{产品名}」的功能说明，结构如下：\n\n## 解决什么问题\n## 适用人群\n## 核心能力（列表）\n## 如何使用（分步）\n## 常见问题\n\n要求：段落短、列表多、每节不超过 200 字。`,
  },
  {
    name: `观点短评`,
    text: `针对「{话题或新闻}」，写一段 400 字以内的观点：\n- 第一段：现象复述（客观）\n- 第二段：你的判断（主观但要有依据）\n- 第三段：对读者的一条建议\n\n避免人身攻击与绝对化表述。`,
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
  <Dialog :open="props.visible" @update:open="onUpdate">
    <DialogContent class="max-h-[85vh] max-w-lg overflow-y-auto">
      <DialogHeader>
        <DialogTitle>内容创作</DialogTitle>
      </DialogHeader>
      <p class="text-sm text-muted-foreground">
        在 {{ APP_NAME }} 中写好正文后，可将下列提示语粘贴到 AI 工具中，按需替换「{}」占位符再生成初稿。
      </p>

      <div class="mt-4 space-y-4">
        <h4 class="text-sm font-semibold text-foreground">
          提示语模版
        </h4>
        <div
          v-for="tpl in templates"
          :key="tpl.name"
          class="rounded-lg border border-border bg-muted/40 p-3"
        >
          <div class="mb-2 flex items-center justify-between gap-2">
            <span class="text-xs font-medium text-foreground">{{ tpl.name }}</span>
            <Button size="sm" variant="secondary" class="h-7 shrink-0 text-xs" @click="copyTemplate(tpl.text)">
              复制
            </Button>
          </div>
          <pre class="max-h-40 overflow-auto whitespace-pre-wrap break-words rounded bg-background p-2 text-xs leading-relaxed text-muted-foreground">{{ tpl.text }}</pre>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="emit('close')">
          关闭
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
