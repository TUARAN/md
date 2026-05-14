<script setup lang="ts">
import { Bot, Copy, PenLine, SendHorizontal } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { APP_NAME } from '@/constants/branding'
import { useUIStore } from '@/stores/ui'
import { copyPlain } from '@/utils/clipboard'
import { toast } from '@/utils/toast'
import WorkflowPageShell from './WorkflowPageShell.vue'
import WorkflowPageTitle from './WorkflowPageTitle.vue'
import WorkflowSectionTitle from './WorkflowSectionTitle.vue'

const uiStore = useUIStore()
const { creationDraftMarkdown } = storeToRefs(uiStore)
const { queueAiAssistantDraftMarkdown, toggleAIDialog } = uiStore

const templateTopic = ref(`XXX`)
const activeFixedTemplate = ref<`none` | `insight` | `techCommunity`>(`none`)

const insightTemplatePrompt = computed(() =>
  `撰写一篇通俗深度科技科普长文，围绕通用人工智能、科技行业、大厂技术、AI 底层技术相关内容展开，从行业发展、技术演进视角切入，梳理技术 / 产品 / 生态的发展脉络、核心逻辑、解决的实际问题与行业意义；行文自然流畅，减少生硬分段分点，采用段落式结构化叙事，逻辑层层递进，文风偏向行业洞察 + 大白话科普，面向开发者与科技爱好者，避免过度学术化；文中在对应章节节点插入主题配图，搭配配图建议；叙事结构为先抛出大众普遍困惑，引出背景，逐个拆解核心要点，串联完整演进线，最后升华行业趋势。\n主题是：${templateTopic.value.trim() || `XXX`}`,
)

const techCommunityTemplatePrompt = computed(() =>
  [
    `请严格按照【通用技术社区博客标准模板】，撰写一篇面向掘金/CSDN/InfoQ的深度技术科普长文，主题聚焦大模型生态相关技术演变迭代，内容覆盖transformers、Hugging Face、ollama、LM Studio、GGUF/GPTQ/AWQ/EXL2/MLX/VMLX等工具与格式，梳理技术发展脉络、底层原理、落地场景、方案对比与行业意义。`,
    `写作约束：`,
    `1. 行文自然流畅，减少生硬分点、列表，采用长段落结构化叙事，逻辑层层递进；`,
    `2. 文风为行业洞察+通俗科普，兼顾专业性，不堆砌晦涩学术术语，面向AI开发者、技术爱好者；`,
    `3. 按章节节点插入对应主题配图，标注配图建议；`,
    `4. 叙事结构：抛出用户普遍困惑→行业背景引入→逐一代入技术/工具/格式拆解→梳理完整演进路线→对比优劣→落地实战视角→总结行业趋势；`,
    `5. 严格套用如下社区博客结构：标题→开篇引言（钩子+背景+预告）→基础铺垫→核心原理拆解→技术演变迭代分析→工具生态（ollama/lmstudio等）→常见问题→进阶趋势→总结展望→作者/版权声明；`,
    `6. 格式规范：标题层级清晰，重点内容加粗，代码/命令用代码块，控制篇幅2000–5000字。`,
    ``,
    `主题：${templateTopic.value.trim() || `__________`}`,
  ].join(`\n`),
)

const remixPrompt = computed(() => {
  const material = creationDraftMarkdown.value.trim()
  if (activeFixedTemplate.value !== `none`) {
    const fixedPrompt = activeFixedTemplate.value === `techCommunity`
      ? techCommunityTemplatePrompt.value
      : insightTemplatePrompt.value
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

const activeTemplateFooterLabel = computed(() => {
  if (activeFixedTemplate.value === `techCommunity`)
    return `豆包 · 技术社区结构化模版`
  if (activeFixedTemplate.value === `insight`)
    return `GPT · 通俗深度科普模版`
  return `通用二创提示词`
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

function applyFixedTemplate(template: `insight` | `techCommunity`) {
  activeFixedTemplate.value = template
  const label = template === `techCommunity` ? `豆包 · 技术社区` : `GPT · 通俗科普`
  toast.success(`已套用${label}`)
}

function useGenericPrompt() {
  activeFixedTemplate.value = `none`
  toast.success(`已改用通用二创提示词`)
}

function openAssistantWithPrompt() {
  if (!creationDraftMarkdown.value.trim()) {
    toast.error(`请先粘贴素材，或从数据获取页送入材料`)
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
        风格二创
      </WorkflowPageTitle>
      <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
        承接数据获取页的材料；可选用面向 GPT Web 或豆包的长模版，再配合右侧提示词交给 AI。
      </p>
    </template>

    <div class="grid min-h-0 gap-4 pb-4 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.85fr)]">
      <section class="flex min-h-0 flex-col gap-3">
        <WorkflowSectionTitle>
          输入材料
        </WorkflowSectionTitle>
        <Textarea
          v-model="creationDraftMarkdown"
          class="min-h-[320px] flex-1 resize-none rounded-2xl border-gray-200 bg-white/90 font-mono text-sm leading-relaxed shadow-sm focus-visible:ring-indigo-500 dark:border-border dark:bg-background"
          placeholder="从「数据获取」页点击「去风格二创」会自动带入资讯材料；也可以在这里粘贴原文、提纲或参考资料。"
        />
      </section>

      <section class="flex min-h-0 flex-col gap-4">
        <div class="grid gap-3 rounded-[22px] border border-gray-200 bg-white/80 p-5 shadow-sm dark:border-border dark:bg-card">
          <div class="grid gap-1.5">
            <Label class="text-xs text-slate-500 dark:text-muted-foreground">模版主题（写入两条长模版里的「主题」占位）</Label>
            <Input
              v-model="templateTopic"
              class="h-9 rounded-lg border-slate-200 bg-white text-sm focus-visible:ring-indigo-500 dark:border-border dark:bg-background"
              placeholder="例如：大模型正在重塑软件开发"
            />
          </div>

          <div class="grid gap-2">
            <div class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-indigo-100 bg-indigo-50/60 p-2.5 dark:border-border dark:bg-background">
              <div>
                <div class="text-xs font-semibold text-indigo-800 dark:text-primary">
                  GPT · 通俗深度科普长文
                </div>
                <p class="mt-1 text-xs leading-relaxed text-slate-600 dark:text-muted-foreground">
                  适合 ChatGPT 网页端：行业洞察 + 大白话叙事，可按章节配图建议延展。
                </p>
              </div>
              <Button
                class="h-8 shrink-0 rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white hover:bg-indigo-700"
                type="button"
                @click="applyFixedTemplate('insight')"
              >
                套用
              </Button>
            </div>

            <div class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-violet-100 bg-violet-50/50 p-2.5 dark:border-border dark:bg-card">
              <div>
                <div class="text-xs font-semibold text-violet-900 dark:text-primary">
                  豆包 · 技术社区结构化长文
                </div>
                <p class="mt-1 text-xs leading-relaxed text-slate-600 dark:text-muted-foreground">
                  适合豆包等国内模型：掘金 / CSDN / InfoQ 式章节骨架，含工具链与代码块规范。
                </p>
              </div>
              <Button
                class="h-8 shrink-0 rounded-lg bg-violet-700 px-3 text-xs font-semibold text-white hover:bg-violet-800"
                type="button"
                @click="applyFixedTemplate('techCommunity')"
              >
                套用
              </Button>
            </div>
          </div>

          <button
            v-if="activeFixedTemplate !== 'none'"
            class="text-muted-foreground self-start text-[11px] underline-offset-4 hover:text-foreground hover:underline"
            type="button"
            @click="useGenericPrompt"
          >
            改用通用二创提示词
          </button>
        </div>

        <div class="flex min-h-0 flex-1 flex-col gap-2">
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

          <pre class="min-h-[220px] flex-1 overflow-auto whitespace-pre-wrap break-words rounded-2xl border border-gray-200 bg-white/80 p-4 text-xs leading-relaxed text-slate-600 shadow-sm dark:border-border dark:bg-background dark:text-muted-foreground">{{ remixPrompt }}</pre>

          <p class="flex items-start gap-1.5 rounded-2xl border border-slate-200 bg-white/70 px-3 py-2 text-xs leading-relaxed text-slate-600 dark:border-border dark:bg-card dark:text-muted-foreground">
            <SendHorizontal class="mt-0.5 size-3.5 shrink-0 text-indigo-600" />
            当前：{{ activeTemplateFooterLabel }}。未点「套用」时为通用二创。生成后可插入编辑器，再到「内容同步」排版核对。
          </p>
        </div>
      </section>
    </div>
  </WorkflowPageShell>
</template>
