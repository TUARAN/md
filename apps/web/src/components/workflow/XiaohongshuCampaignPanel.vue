<script setup lang="ts">
import type { XiaohongshuThemeId } from '@/constants/xiaohongshuCampaign'
import { Bot, Copy, ImagePlus, SendHorizontal, Sparkles } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PanelShell } from '@/components/ui/layout'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { buildAIHeaders, resolveEndpointUrl, useAIFetch } from '@/composables/useAIFetch'
import {
  buildXiaohongshuCaptionPrompt,
  buildXiaohongshuImagePrompt,
  getXiaohongshuTheme,
  XIAOHONGSHU_QUALITY_RULES,
  XIAOHONGSHU_THEMES,
} from '@/constants/xiaohongshuCampaign'
import useAIConfigStore from '@/stores/aiConfig'
import useAIImageConfigStore from '@/stores/aiImageConfig'
import { useEditorStore } from '@/stores/editor'
import { copyPlain } from '@/utils/clipboard'
import { toast } from '@/utils/toast'
import WorkflowSectionTitle from './WorkflowSectionTitle.vue'

const aiConfigStore = useAIConfigStore()
const imageConfigStore = useAIImageConfigStore()
const editorStore = useEditorStore()

const { apiKey, endpoint, model, temperature, maxToken, type } = storeToRefs(aiConfigStore)
const {
  apiKey: imageApiKey,
  endpoint: imageEndpoint,
  model: imageModel,
  size: imageSize,
  type: imageType,
} = storeToRefs(imageConfigStore)

const { loading: captionLoading, abort: abortCaption, fetchSSE } = useAIFetch()
const imageLoading = ref(false)
const imageAbortController = ref<AbortController | null>(null)

const selectedThemeId = ref<XiaohongshuThemeId>(`aiProductivity`)
const topic = ref(`AI 内容工作流`)
const audience = ref(`知识型创作者、独立开发者、运营同学`)
const angle = ref(`从真实工作流切入，讲清楚为什么值得长期使用`)
const takeaway = ref(`把选题、封面、配文和复盘串成一套可持续的内容系统`)
const generatedCaption = ref(``)
const generatedImageUrl = ref(``)

const activeTheme = computed(() => getXiaohongshuTheme(selectedThemeId.value))

const campaignInput = computed(() => ({
  topic: topic.value,
  audience: audience.value,
  angle: angle.value,
  takeaway: takeaway.value,
  theme: activeTheme.value,
}))

const imagePrompt = computed(() => buildXiaohongshuImagePrompt(campaignInput.value))
const captionPrompt = computed(() => buildXiaohongshuCaptionPrompt(campaignInput.value))

const markdownDraft = computed(() => {
  const imageBlock = generatedImageUrl.value
    ? `![${topic.value.trim() || activeTheme.value.title}](${generatedImageUrl.value})\n\n`
    : ``

  const body = generatedCaption.value.trim()
    ? generatedCaption.value.trim()
    : [
        `# ${topic.value.trim() || activeTheme.value.title}`,
        ``,
        `> ${takeaway.value.trim() || activeTheme.value.tagline}`,
        ``,
        captionPrompt.value,
      ].join(`\n`)

  return `${imageBlock}${body}`.trim()
})

function applyThemeDefaults() {
  audience.value = activeTheme.value.audience
  angle.value = activeTheme.value.captionAngle
  takeaway.value = activeTheme.value.tagline
  toast.success(`已套用专题默认策略`)
}

async function copyText(text: string, successText: string) {
  try {
    await copyPlain(text)
    toast.success(successText)
  }
  catch {
    toast.error(`复制失败`)
  }
}

async function generateCaption() {
  if (captionLoading.value)
    return
  generatedCaption.value = ``

  try {
    await fetchSSE(
      resolveEndpointUrl(endpoint.value, `chat`),
      buildAIHeaders(apiKey.value, type.value),
      {
        model: model.value,
        messages: [{ role: `user`, content: captionPrompt.value }],
        temperature: temperature.value,
        max_tokens: maxToken.value,
        stream: true,
      },
      {
        onDelta(content) {
          generatedCaption.value += content
        },
        onDone() {
          toast.success(`小红书配文已生成`)
        },
      },
    )
  }
  catch (error) {
    console.error(`小红书配文生成失败:`, error)
    toast.error(`配文生成失败，请检查 AI 对话配置`)
  }
}

async function generateImage() {
  if (imageLoading.value)
    return

  imageLoading.value = true
  imageAbortController.value = new AbortController()

  try {
    const res = await window.fetch(resolveEndpointUrl(imageEndpoint.value, `image`), {
      method: `POST`,
      headers: buildAIHeaders(imageApiKey.value, imageType.value),
      body: JSON.stringify({
        model: imageModel.value,
        prompt: imagePrompt.value,
        size: imageSize.value,
        n: 1,
      }),
      signal: imageAbortController.value.signal,
    })

    if (!res.ok)
      throw new Error(`${res.status}: ${await res.text()}`)

    const data = await res.json()
    const imageUrl = data?.data?.[0]?.url || data?.data?.[0]?.b64_json
    if (!imageUrl)
      throw new Error(`未收到有效图片`)

    generatedImageUrl.value = imageUrl.startsWith(`data:`) || imageUrl.startsWith(`http`)
      ? imageUrl
      : `data:image/png;base64,${imageUrl}`
    toast.success(`小红书封面图已生成`)
  }
  catch (error) {
    if ((error as Error).name !== `AbortError`) {
      console.error(`小红书封面生成失败:`, error)
      toast.error(`图片生成失败，请检查 AI 图像配置`)
    }
  }
  finally {
    imageLoading.value = false
    imageAbortController.value = null
  }
}

function cancelImage() {
  imageAbortController.value?.abort()
  imageAbortController.value = null
  imageLoading.value = false
}

function insertDraftToEditor() {
  const draft = markdownDraft.value.trim()
  if (!draft) {
    toast.error(`暂无可插入内容`)
    return
  }
  if (!editorStore.editor) {
    toast.error(`请先打开排版发布页初始化编辑器`)
    return
  }
  editorStore.insertAtCursor(`\n\n${draft}\n`)
  toast.success(`已插入编辑器`)
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col gap-4">
    <section class="rounded-[18px] border border-rose-200 bg-rose-50/60 p-4 dark:border-rose-900/40 dark:bg-rose-950/20">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0">
          <p class="text-sm font-semibold text-rose-950 dark:text-rose-100">
            小红书高质量专题
          </p>
          <p class="mt-1 text-xs leading-relaxed text-rose-900/75 dark:text-rose-100/70">
            选中小红书平台后，在这里完成专题策略、GPT Image 封面提示词、配文和 Markdown 成稿。
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" class="border-rose-200 bg-white/80 dark:border-rose-900/50 dark:bg-background" @click="applyThemeDefaults">
          <Sparkles class="mr-1.5 size-3.5" />
          套用默认值
        </Button>
      </div>
    </section>

    <div class="grid min-h-0 gap-4 2xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.05fr)_minmax(18rem,0.72fr)]">
      <section class="grid gap-4">
        <PanelShell tone="neutral" radius="lg" padding="md" flat class="grid gap-3">
          <WorkflowSectionTitle>
            专题策略
          </WorkflowSectionTitle>
          <div class="grid gap-1.5">
            <Label class="text-xs text-muted-foreground">专题模块</Label>
            <Select v-model="selectedThemeId">
              <SelectTrigger class="h-9 rounded-lg bg-white dark:bg-background">
                <SelectValue placeholder="选择专题" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="theme in XIAOHONGSHU_THEMES" :key="theme.id" :value="theme.id">
                  {{ theme.title }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="rounded-xl border border-primary/20 bg-primary/[0.05] p-3">
            <p class="text-sm font-semibold text-foreground">
              {{ activeTheme.title }}
            </p>
            <p class="mt-1 text-xs leading-relaxed text-muted-foreground">
              {{ activeTheme.tagline }}
            </p>
          </div>

          <div class="grid gap-3">
            <div class="grid gap-1.5">
              <Label class="text-xs text-muted-foreground">选题</Label>
              <Input v-model="topic" class="h-9 rounded-lg bg-white dark:bg-background" />
            </div>
            <div class="grid gap-1.5">
              <Label class="text-xs text-muted-foreground">目标读者</Label>
              <Input v-model="audience" class="h-9 rounded-lg bg-white dark:bg-background" />
            </div>
            <div class="grid gap-1.5">
              <Label class="text-xs text-muted-foreground">切入角度</Label>
              <Textarea v-model="angle" class="min-h-20 resize-none rounded-lg bg-white text-sm dark:bg-background" />
            </div>
            <div class="grid gap-1.5">
              <Label class="text-xs text-muted-foreground">核心收获</Label>
              <Textarea v-model="takeaway" class="min-h-20 resize-none rounded-lg bg-white text-sm dark:bg-background" />
            </div>
          </div>
        </PanelShell>

        <PanelShell tone="neutral" radius="lg" padding="md" flat class="grid gap-3">
          <WorkflowSectionTitle>
            质量规则
          </WorkflowSectionTitle>
          <ul class="space-y-2 text-xs leading-relaxed text-muted-foreground">
            <li v-for="rule in XIAOHONGSHU_QUALITY_RULES" :key="rule" class="flex gap-2">
              <span class="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
              <span>{{ rule }}</span>
            </li>
          </ul>
        </PanelShell>
      </section>

      <section class="grid min-h-0 gap-4">
        <div class="flex min-h-0 flex-col gap-2">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <WorkflowSectionTitle>
              封面图提示词
            </WorkflowSectionTitle>
            <div class="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" @click="copyText(imagePrompt, '已复制图片提示词')">
                <Copy class="mr-1.5 size-3.5" />
                复制
              </Button>
              <Button v-if="imageLoading" type="button" variant="secondary" size="sm" @click="cancelImage">
                停止
              </Button>
              <Button v-else type="button" size="sm" @click="generateImage">
                <ImagePlus class="mr-1.5 size-3.5" />
                生成图片
              </Button>
            </div>
          </div>
          <Textarea :model-value="imagePrompt" readonly class="min-h-[190px] resize-none rounded-2xl bg-white/85 font-mono text-xs leading-relaxed dark:bg-background" />
        </div>

        <div class="flex min-h-0 flex-col gap-2">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <WorkflowSectionTitle>
              配文
            </WorkflowSectionTitle>
            <div class="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" @click="copyText(captionPrompt, '已复制配文提示词')">
                <Copy class="mr-1.5 size-3.5" />
                复制
              </Button>
              <Button v-if="captionLoading" type="button" variant="secondary" size="sm" @click="abortCaption">
                停止
              </Button>
              <Button v-else type="button" size="sm" @click="generateCaption">
                <Bot class="mr-1.5 size-3.5" />
                生成配文
              </Button>
            </div>
          </div>
          <Textarea v-model="generatedCaption" class="min-h-[260px] resize-none rounded-2xl bg-white/85 text-sm leading-relaxed dark:bg-background" placeholder="点击「生成配文」后会在这里流式输出，也可以手动编辑。" />
        </div>
      </section>

      <aside class="grid gap-4">
        <PanelShell as="section" tone="neutral" radius="lg" padding="md" flat class="grid gap-3">
          <WorkflowSectionTitle>
            图片预览
          </WorkflowSectionTitle>
          <div class="flex aspect-[4/5] items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted/30">
            <img v-if="generatedImageUrl" :src="generatedImageUrl" :alt="topic" class="h-full w-full object-cover">
            <div v-else class="px-4 text-center text-xs leading-relaxed text-muted-foreground">
              当前图片模型：{{ imageModel || '未配置' }}
            </div>
          </div>
          <Button type="button" variant="outline" class="h-9 rounded-lg" :disabled="!generatedImageUrl" @click="copyText(generatedImageUrl, '已复制图片地址')">
            <Copy class="mr-1.5 size-4" />
            复制图片地址
          </Button>
        </PanelShell>

        <PanelShell as="section" tone="neutral" radius="lg" padding="md" flat class="flex min-h-0 flex-col gap-3">
          <WorkflowSectionTitle>
            Markdown 成稿
          </WorkflowSectionTitle>
          <pre class="min-h-[180px] max-h-[320px] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-border/70 bg-background/80 p-3 text-xs leading-relaxed text-muted-foreground">{{ markdownDraft }}</pre>
          <div class="flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" @click="copyText(markdownDraft, '已复制 Markdown 成稿')">
              <Copy class="mr-1.5 size-3.5" />
              复制
            </Button>
            <Button type="button" size="sm" @click="insertDraftToEditor">
              <SendHorizontal class="mr-1.5 size-3.5" />
              插入编辑器
            </Button>
          </div>
        </PanelShell>
      </aside>
    </div>
  </div>
</template>
