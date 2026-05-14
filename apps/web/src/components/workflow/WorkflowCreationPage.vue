<script setup lang="ts">
import { Bot, Copy, PenLine, SendHorizontal } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { APP_NAME } from '@/constants/branding'
import { useUIStore } from '@/stores/ui'
import { copyPlain } from '@/utils/clipboard'
import { store } from '@/utils/storage'
import { toast } from '@/utils/toast'
import WorkflowPageShell from './WorkflowPageShell.vue'
import WorkflowPageTitle from './WorkflowPageTitle.vue'
import WorkflowSectionTitle from './WorkflowSectionTitle.vue'

const uiStore = useUIStore()
const { creationDraftMarkdown } = storeToRefs(uiStore)
const { queueAiAssistantDraftMarkdown, toggleAIDialog } = uiStore

// ==================== 工作台选项 ====================
type TargetPlatform = `general` | `mp` | `juejin` | `zhihu` | `xiaohongshu` | `jike` | `x`
type LengthBucket = `short` | `medium` | `long`
type Tone = `solid` | `plain` | `sharp` | `lyrical`
type FixedTemplate = `none` | `insight` | `techCommunity`

const platformOptions: { value: TargetPlatform, label: string, snippet: string }[] = [
  { value: `general`, label: `通用（不指定平台）`, snippet: `` },
  { value: `mp`, label: `公众号`, snippet: `面向微信公众号：段落短、节奏明快；少代码块多图文穿插；避免过长嵌套列表；标题口语化、信息密度均衡。` },
  { value: `juejin`, label: `掘金 / CSDN`, snippet: `面向掘金 / CSDN 等技术社区：保留代码块、命令行示例、版本号与外链；可有「踩坑 / 实测 / 对比」小节；标题偏检索友好。` },
  { value: `zhihu`, label: `知乎`, snippet: `面向知乎：长段落叙事，可加入个人观点、行业对比与反例；开头给读者一句钩子；论据先于结论。` },
  { value: `xiaohongshu`, label: `小红书`, snippet: `面向小红书：标题带钩子；正文 800 字内；要点用 1️⃣ 2️⃣ 3️⃣ 分段；情绪标签与 emoji 适度；结尾给一个 CTA。` },
  { value: `jike`, label: `即刻`, snippet: `面向即刻：单条 200-500 字小观察体，口语化、信息密度高、有钩子；可保留 1-2 个原文链接。` },
  { value: `x`, label: `X · Twitter`, snippet: `面向 X：英文输出；先一条 280 字主推作为钩子，再展开 3-5 条 thread 续推；每条独立成立、避免硬切句。` },
]

const lengthOptions: { value: LengthBucket, label: string, snippet: string }[] = [
  { value: `short`, label: `短篇 ~800 字`, snippet: `目标字数约 800 字，单一主张、信息密度高。` },
  { value: `medium`, label: `中篇 1500-2500 字`, snippet: `目标字数 1500-2500 字，3-5 个小节，论点 + 论据 + 收尾。` },
  { value: `long`, label: `长篇 3000+ 字`, snippet: `目标字数 3000 字以上，完整骨架：背景 → 拆解 → 对比 → 趋势。` },
]

const toneOptions: { value: Tone, label: string, snippet: string }[] = [
  { value: `solid`, label: `干货`, snippet: `干货语气：结论先行、少寒暄、术语精确。` },
  { value: `plain`, label: `通俗科普`, snippet: `通俗语气：多用类比与生活化案例，避免学术腔。` },
  { value: `sharp`, label: `观点犀利`, snippet: `观点语气：立场鲜明、敢做对比与判断、可有反例。` },
  { value: `lyrical`, label: `叙事抒情`, snippet: `叙事语气：节奏与画面感，可有人物视角与时间线。` },
]

const platform = store.reactive<TargetPlatform>(`creation_platform`, `general`)
const lengthBucket = store.reactive<LengthBucket>(`creation_length`, `medium`)
const tone = store.reactive<Tone>(`creation_tone`, `solid`)
const templateTopic = store.reactive(`creation_template_topic`, ``)
const activeFixedTemplate = store.reactive<FixedTemplate>(`creation_active_fixed_template`, `none`)

// ==================== 提示词拼装 ====================
const activePlatform = computed(() => platformOptions.find(p => p.value === platform.value) ?? platformOptions[0])
const activeLength = computed(() => lengthOptions.find(l => l.value === lengthBucket.value) ?? lengthOptions[1])
const activeTone = computed(() => toneOptions.find(t => t.value === tone.value) ?? toneOptions[0])

const extraConstraints = computed(() => {
  const parts: string[] = []
  if (activePlatform.value.snippet)
    parts.push(activePlatform.value.snippet)
  parts.push(activeLength.value.snippet, activeTone.value.snippet)
  return parts
})

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
  const constraints = extraConstraints.value
  if (activeFixedTemplate.value !== `none`) {
    const fixedPrompt = activeFixedTemplate.value === `techCommunity`
      ? techCommunityTemplatePrompt.value
      : insightTemplatePrompt.value
    const lines = [fixedPrompt]
    if (constraints.length) {
      lines.push(
        ``,
        `本批附加约束：`,
        ...constraints.map((c, i) => `${i + 1}. ${c}`),
      )
    }
    lines.push(``, `参考素材：`, `---`, material || `{在这里粘贴资讯、提纲或原文}`)
    return lines.join(`\n`)
  }

  const lines = [
    `你是 ${APP_NAME} 的内容二创助手。请基于下方素材，写成一版可直接在编辑器里继续排版的 Markdown 正文。`,
    ``,
    `平台与风格：`,
    ...constraints.map((c, i) => `${i + 1}. ${c}`),
    ``,
    `硬性要求：`,
    `1. 事实、数据、人物、机构和链接须与素材一致，不要编造来源。`,
    `2. 保留可用的原文链接或来源说明，便于发布前核验。`,
    `3. 只输出 Markdown 正文，不要解释你的构思过程。`,
    ``,
    `素材：`,
    `---`,
    material || `{在这里粘贴资讯、提纲或原文}`,
  ]
  return lines.join(`\n`)
})

const activeTemplateFooterLabel = computed(() => {
  const platformLabel = activePlatform.value.label
  if (activeFixedTemplate.value === `techCommunity`)
    return `豆包 · 技术社区模版 → ${platformLabel}`
  if (activeFixedTemplate.value === `insight`)
    return `GPT · 通俗深度科普模版 → ${platformLabel}`
  return `通用二创 → ${platformLabel}`
})

// ==================== 动作 ====================
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
        承接「数据获取」素材：先选目标平台 / 篇幅 / 语气，再决定是否叠加长模版；右侧提示词会自动拼好，复制走或交给 AI。
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
          <div class="grid gap-2 sm:grid-cols-3">
            <div class="grid gap-1.5">
              <Label class="text-xs text-slate-500 dark:text-muted-foreground">目标平台</Label>
              <Select v-model="platform">
                <SelectTrigger class="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="option in platformOptions"
                    :key="option.value"
                    class="text-xs"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="grid gap-1.5">
              <Label class="text-xs text-slate-500 dark:text-muted-foreground">篇幅</Label>
              <Select v-model="lengthBucket">
                <SelectTrigger class="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="option in lengthOptions"
                    :key="option.value"
                    class="text-xs"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="grid gap-1.5">
              <Label class="text-xs text-slate-500 dark:text-muted-foreground">语气</Label>
              <Select v-model="tone">
                <SelectTrigger class="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="option in toneOptions"
                    :key="option.value"
                    class="text-xs"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div class="grid gap-1.5">
            <Label class="text-xs text-slate-500 dark:text-muted-foreground">模版主题（写入两条长模版里的「主题」占位，选了长模版才生效）</Label>
            <Input
              v-model="templateTopic"
              class="h-9 rounded-lg border-slate-200 bg-white text-sm focus-visible:ring-indigo-500 dark:border-border dark:bg-background"
              placeholder="例如：大模型正在重塑软件开发"
            />
          </div>

          <div class="grid gap-2">
            <div
              class="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-2.5 transition-colors"
              :class="[
                activeFixedTemplate === 'insight'
                  ? 'border-indigo-300 bg-indigo-50 dark:border-primary dark:bg-background'
                  : 'border-indigo-100 bg-indigo-50/60 dark:border-border dark:bg-background',
              ]"
            >
              <div>
                <div class="text-xs font-semibold text-indigo-800 dark:text-primary">
                  GPT · 通俗深度科普长文
                </div>
                <p class="mt-1 text-xs leading-relaxed text-slate-600 dark:text-muted-foreground">
                  适合 ChatGPT 网页端：行业洞察 + 大白话叙事，可按章节配图建议延展。
                </p>
              </div>
              <Button
                :variant="activeFixedTemplate === 'insight' ? 'default' : 'secondary'"
                class="h-8 shrink-0 rounded-lg px-3 text-xs font-semibold"
                type="button"
                @click="applyFixedTemplate('insight')"
              >
                {{ activeFixedTemplate === 'insight' ? '已套用' : '套用' }}
              </Button>
            </div>

            <div
              class="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-2.5 transition-colors"
              :class="[
                activeFixedTemplate === 'techCommunity'
                  ? 'border-violet-300 bg-violet-50 dark:border-primary dark:bg-card'
                  : 'border-violet-100 bg-violet-50/50 dark:border-border dark:bg-card',
              ]"
            >
              <div>
                <div class="text-xs font-semibold text-violet-900 dark:text-primary">
                  豆包 · 技术社区结构化长文
                </div>
                <p class="mt-1 text-xs leading-relaxed text-slate-600 dark:text-muted-foreground">
                  适合豆包等国内模型：掘金 / CSDN / InfoQ 式章节骨架，含工具链与代码块规范。
                </p>
              </div>
              <Button
                :variant="activeFixedTemplate === 'techCommunity' ? 'default' : 'secondary'"
                class="h-8 shrink-0 rounded-lg px-3 text-xs font-semibold"
                type="button"
                @click="applyFixedTemplate('techCommunity')"
              >
                {{ activeFixedTemplate === 'techCommunity' ? '已套用' : '套用' }}
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
            当前：{{ activeTemplateFooterLabel }} · {{ activeLength.label }} · {{ activeTone.label }}。生成后送进编辑器，再到「内容同步」排版核对。
          </p>
        </div>
      </section>
    </div>
  </WorkflowPageShell>
</template>
