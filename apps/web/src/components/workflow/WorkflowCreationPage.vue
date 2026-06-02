<script setup lang="ts">
import { Bot, ChevronDown, Copy, NotebookPen, PenLine } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { useRoute } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { APP_NAME } from '@/constants/branding'
import { useUIStore } from '@/stores/ui'
import { copyPlain } from '@/utils/clipboard'
import { toast } from '@/utils/toast'
import DeepSeekRemixPanel from './DeepSeekRemixPanel.vue'
import WorkflowPageShell from './WorkflowPageShell.vue'
import WorkflowPageTitle from './WorkflowPageTitle.vue'
import WorkflowSectionTitle from './WorkflowSectionTitle.vue'

const uiStore = useUIStore()
const { creationDraftMarkdown } = storeToRefs(uiStore)
const { queueAiAssistantDraftMarkdown, toggleAIDialog } = uiStore
const route = useRoute()

const templateTopic = ref(`XXX`)
const creationMode = ref<`generic` | `xiaohongshu` | `doubao` | `gpt`>(`generic`)
const promptPreviewExpanded = ref(false)

watch(
  () => route.query.mode,
  (mode) => {
    if (mode === `xiaohongshu` || mode === `doubao` || mode === `gpt`)
      creationMode.value = mode
  },
  { immediate: true },
)

const gptStylePrompt = computed(() =>
  [
    `请用 GPT 生成一篇「小红书知识博主风格」的科技深度长文，主题围绕 AI 技术 / 大模型生态 / 工具链演进。`,
    `风格要求（参考小红书图文表达）：`,
    `1. 开头必须有真实场景或反常识钩子，口吻自然、有个人复盘感；`,
    `2. 结构采用「开头钩子 → 4-6 段正文拆解 → 行动清单 → 互动提问」；`,
    `3. 每段尽量给出可执行建议、避坑提醒或判断框架，不写空泛口号；`,
    `4. 文风保持专业但通俗，像在给读者讲明白一个复杂问题；`,
    `5. 只输出 Markdown 正文，不解释推理过程。`,
    ``,
    `内容范围建议：行业背景、技术原理、工具对比、落地场景、未来趋势。`,
    `可按章节插入配图建议（不生成图片，仅写建议）。`,
    ``,
    `主题：${templateTopic.value.trim() || `__________`}`,
  ].join(`\n`),
)

const doubaoStylePrompt = computed(() =>
  [
    `请按照「豆包可稳定执行」的方式，产出一篇面向技术社区的深度科普文，并保持小红书知识类内容的表达节奏。`,
    `写作目标：既适合掘金/CSDN/InfoQ 阅读，又具备小红书式的可读性和实操感。`,
    `写作约束：`,
    `1. 开篇先用小红书风格钩子切入（具体场景 / 常见误区 / 反直觉观点）；`,
    `2. 主体遵循技术社区长文结构：引言→基础铺垫→核心原理→技术演进→工具生态→常见问题→趋势总结；`,
    `3. 每个核心章节补充「实操要点 / 避坑提醒 / 复盘指标」中的至少一项；`,
    `4. 文风通俗但不失专业，避免堆砌术语，适合 AI 开发者和技术爱好者；`,
    `5. 标题层级清晰，重点内容可加粗，代码/命令使用代码块；`,
    `6. 只输出 Markdown 正文，不输出额外说明。`,
    ``,
    `主题：${templateTopic.value.trim() || `__________`}`,
  ].join(`\n`),
)

const xiaohongshuStylePrompt = computed(() =>
  [
    `请按「小红书知识类图文」风格，围绕下方主题和素材生成可发布的中文长文稿。`,
    `写作要求：`,
    `1. 开头用真实场景或反常识判断做钩子，快速引出核心问题；`,
    `2. 正文采用「钩子开场 → 4-6 段拆解 → 行动清单 → 互动提问」结构；`,
    `3. 每段尽量包含一个可执行动作、一个避坑点或一个复盘指标；`,
    `4. 口吻自然、专业、克制，不制造焦虑，不承诺“必爆”；`,
    `5. 结尾补充 6-8 个小红书标签；`,
    `6. 只输出 Markdown 正文，不解释过程。`,
    ``,
    `主题：${templateTopic.value.trim() || `__________`}`,
  ].join(`\n`),
)

const remixPrompt = computed(() => {
  const material = creationDraftMarkdown.value.trim()
  if (creationMode.value === `xiaohongshu` || creationMode.value === `doubao` || creationMode.value === `gpt`) {
    let fixedPrompt = gptStylePrompt.value
    if (creationMode.value === `xiaohongshu`)
      fixedPrompt = xiaohongshuStylePrompt.value
    else if (creationMode.value === `doubao`)
      fixedPrompt = doubaoStylePrompt.value
    return [
      fixedPrompt,
      ``,
      `参考素材：`,
      `---`,
      material || `{在这里粘贴资讯、提纲或原文}`,
    ].join(`\n`)
  }

  return [
    `你是 ${APP_NAME} 的内容二创助手。请基于下方素材，写成一版可直接在编辑器里继续排版的 Markdown 正文。`,
    ``,
    `写作取向：中文读者可读；结构与标题层次清晰；口吻偏干货但不僵硬，适合公众号或技术专栏阅读场景。`,
    ``,
    `硬性要求：`,
    `1. 事实、数据、人物、机构和链接须与素材一致，不要编造来源。`,
    `2. 保留可用的原文链接或来源说明，便于发布前核验。`,
    `3. 只输出 Markdown 正文，不要解释你的构思过程。`,
    ``,
    `素材：`,
    `---`,
    material || `{在这里粘贴资讯、提纲或原文}`,
  ].join(`\n`)
})

async function copyPrompt() {
  try {
    await copyPlain(remixPrompt.value)
    toast.success(`已复制二创提示词`)
  }
  catch {
    toast.error(`复制失败`)
  }
}

function openAssistantWithPrompt() {
  if (!creationDraftMarkdown.value.trim()) {
    toast.error(`请先粘贴素材，或从选择素材页送入材料`)
    return
  }
  queueAiAssistantDraftMarkdown(remixPrompt.value)
  toggleAIDialog(true)
}
</script>

<template>
  <WorkflowPageShell>
    <template #header>
      <WorkflowPageTitle>
        <template #icon>
          <PenLine />
        </template>
        AI 创作
      </WorkflowPageTitle>
      <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
        把素材或初稿改成不同平台需要的表达风格，快速生成提示词与可继续编辑的成稿。
      </p>
      <div class="mt-3 inline-flex rounded-lg border border-border/80 bg-white/80 p-1 dark:bg-card" aria-label="AI 创作模式">
        <button
          type="button"
          class="inline-flex min-h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors"
          :class="creationMode === 'generic'
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'"
          @click="creationMode = 'generic'"
        >
          <PenLine class="h-4 w-4" />
          通用改写
        </button>
        <button
          type="button"
          class="inline-flex min-h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors"
          :class="creationMode === 'xiaohongshu'
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'"
          @click="creationMode = 'xiaohongshu'"
        >
          <NotebookPen class="h-4 w-4" />
          小红书风格
        </button>
        <button
          type="button"
          class="inline-flex min-h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors"
          :class="creationMode === 'doubao'
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'"
          @click="creationMode = 'doubao'"
        >
          <Bot class="h-4 w-4" />
          豆包风格
        </button>
        <button
          type="button"
          class="inline-flex min-h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors"
          :class="creationMode === 'gpt'
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'"
          @click="creationMode = 'gpt'"
        >
          <Bot class="h-4 w-4" />
          GPT风格
        </button>
      </div>
    </template>

    <div class="grid min-h-0 gap-4 pb-4 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.85fr)]">
      <section class="flex min-h-0 flex-col gap-3">
        <WorkflowSectionTitle>
          输入材料
        </WorkflowSectionTitle>
        <Textarea
          v-model="creationDraftMarkdown"
          class="min-h-[320px] flex-1 resize-none rounded-2xl border-gray-200 bg-white/90 font-mono text-sm leading-relaxed shadow-sm focus-visible:ring-indigo-500 dark:border-border dark:bg-background"
          placeholder="从「选择素材」页送入资讯材料；也可以在这里粘贴原文、提纲或参考资料。"
        />
      </section>

      <section class="flex min-h-0 flex-col gap-3">
        <div class="flex min-h-0 flex-1 flex-col gap-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <WorkflowSectionTitle>
              二创任务
            </WorkflowSectionTitle>
            <div class="flex items-center gap-2">
              <Button
                class="h-9 rounded-lg border border-indigo-200 bg-white px-3 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 dark:border-border dark:bg-background dark:text-primary"
                type="button"
                variant="secondary"
                @click="copyPrompt"
              >
                <Copy class="mr-1.5 size-3.5" />
                复制提示词
              </Button>
              <Button
                class="h-9 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white hover:bg-indigo-700"
                type="button"
                @click="openAssistantWithPrompt"
              >
                <Bot class="mr-1.5 size-3.5" />
                交给 AI
              </Button>
            </div>
          </div>

          <div class="rounded-2xl border border-gray-200 bg-white/80 shadow-sm dark:border-border dark:bg-background">
            <div
              v-if="creationMode !== 'generic'"
              class="grid gap-1.5 border-b border-gray-100 px-3.5 py-3 dark:border-border"
            >
              <Label class="text-[11px] text-slate-500 dark:text-muted-foreground">
                风格主题（可选，将写入{{ creationMode === 'xiaohongshu' ? '小红书风格' : creationMode === 'doubao' ? '豆包风格' : 'GPT风格' }}提示词）
              </Label>
              <Input
                v-model="templateTopic"
                class="h-8 rounded-lg border-slate-200 bg-white text-sm focus-visible:ring-indigo-500 dark:border-border dark:bg-background"
                placeholder="例如：大模型正在重塑软件开发"
              />
            </div>
            <button
              class="flex w-full items-center justify-between gap-2 rounded-2xl px-3.5 py-2 text-left text-[11px] transition-colors hover:bg-slate-50/80 dark:hover:bg-card"
              type="button"
              @click="promptPreviewExpanded = !promptPreviewExpanded"
            >
              <span class="font-medium text-slate-600 dark:text-muted-foreground">
                提示词预览 · 约 {{ remixPrompt.length }} 字
              </span>
              <ChevronDown class="size-3.5 text-muted-foreground transition-transform" :class="promptPreviewExpanded ? 'rotate-180' : ''" />
            </button>
            <pre v-if="promptPreviewExpanded" class="max-h-72 overflow-auto whitespace-pre-wrap break-words border-t border-gray-100 px-4 py-3 text-xs leading-relaxed text-slate-600 dark:border-border dark:text-muted-foreground">{{ remixPrompt }}</pre>
          </div>

          <DeepSeekRemixPanel :prompt="remixPrompt" />
        </div>
      </section>
    </div>
  </WorkflowPageShell>
</template>
