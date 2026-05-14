<script setup lang="ts">
import { AlertTriangle, Copy, Eye, FileText, RefreshCw, Wand2 } from 'lucide-vue-next'
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import WorkflowSectionTitle from '@/components/workflow/WorkflowSectionTitle.vue'
import { useGNewsFetchSession } from '@/composables/useGNewsFetchSession'

const previewContainerRef = useTemplateRef<HTMLElement>(`previewContainerRef`)

const {
  loading,
  formatted,
  meta,
  lastError,
  resultTab,
  previewHtml,
  provider,
  configPanelExpanded,
  fetchCurrentPage,
  copyMarkdownSource,
  goRemixWithAssistant,
  onPreviewClick,
  initPreviewRenderer,
  disposePreviewRenderer,
  runHighlightInPreview,
} = useGNewsFetchSession()

// 错误归类，给一句可操作的「下一步该做什么」
const errorHint = computed(() => {
  const msg = lastError.value
  if (!msg)
    return ``
  if (msg.includes(`API Key`) || msg.includes(`请填写`))
    return `点击右上「API Key · 展开」填入或更换 Key；GNews 也可直接换到「Hacker News」「本真 BenZhi」免 Key 源试一下。`
  if (msg.includes(`Failed to fetch`) || msg.includes(`未到达`))
    return `通常是浏览器拦截或代理不可达。可稍后重试，或先换到另一个资讯源观察。`
  if (msg.includes(`本页未返回`))
    return `当前关键词在本页没有命中，换关键词或回第 1 页再试。`
  return `换关键词 / 换资讯源 / 稍后重试。`
})

function handleOpenApiKey() {
  configPanelExpanded.value = true
}

const isFreeKeyProvider = computed(() => provider.value === `hackernews` || provider.value === `benzhi`)

watch(previewHtml, () => {
  if (!previewHtml.value.trim()) {
    return
  }
  nextTick(() => {
    runHighlightInPreview(previewContainerRef.value)
  })
})

onMounted(() => {
  initPreviewRenderer()
})

onBeforeUnmount(() => {
  disposePreviewRenderer()
})
</script>

<template>
  <div class="gnews-fetch-results flex min-h-0 flex-1 flex-col gap-4">
    <p
      v-if="meta"
      class="text-muted-foreground shrink-0 text-xs leading-relaxed"
    >
      {{ meta }}
    </p>
    <div
      v-if="lastError"
      class="shrink-0 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive"
      role="alert"
    >
      <div class="flex items-start gap-2">
        <AlertTriangle class="mt-0.5 size-4 shrink-0" />
        <div class="min-w-0 flex-1 space-y-1.5">
          <p class="break-words font-medium leading-snug">
            {{ lastError }}
          </p>
          <p
            v-if="errorHint"
            class="text-destructive/85 text-xs leading-relaxed"
          >
            {{ errorHint }}
          </p>
          <div class="flex flex-wrap gap-2 pt-1">
            <Button
              :disabled="loading"
              size="sm"
              type="button"
              variant="secondary"
              @click="fetchCurrentPage"
            >
              <RefreshCw class="mr-1.5 size-3.5" />
              重试本页
            </Button>
            <Button
              v-if="!isFreeKeyProvider"
              size="sm"
              type="button"
              variant="ghost"
              @click="handleOpenApiKey"
            >
              检查 API Key
            </Button>
          </div>
        </div>
      </div>
    </div>

    <div class="flex min-h-[200px] min-w-0 flex-1 shrink-0 flex-col space-y-2">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <WorkflowSectionTitle>
          整理结果（提示词材料）
        </WorkflowSectionTitle>
        <Button
          :disabled="!formatted.trim()"
          size="sm"
          type="button"
          variant="secondary"
          @click="goRemixWithAssistant"
        >
          <Wand2 class="mr-1.5 size-4 shrink-0" />
          去风格二创
        </Button>
      </div>
      <Tabs v-model="resultTab" class="w-full min-w-0">
        <TabsList class="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="preview">
            <span class="inline-flex items-center gap-1.5">
              <Eye class="size-4 shrink-0" />
              预览
            </span>
          </TabsTrigger>
          <TabsTrigger value="source">
            <span class="inline-flex items-center gap-1.5">
              <FileText class="size-4 shrink-0" />
              Markdown 源码
            </span>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="preview" class="mt-2 flex flex-col outline-none">
          <div
            class="gnews-md-preview max-h-[min(50vh,420px)] min-h-[220px] overflow-x-auto overflow-y-auto rounded-md border border-border/80 bg-muted/20 px-3 py-3 text-sm"
          >
            <div
              v-if="!formatted.trim()"
              class="text-muted-foreground py-8 text-center text-sm"
            >
              点击「获取资讯」后，此处将渲染可阅读的排版效果…
            </div>
            <div
              v-else
              ref="previewContainerRef"
              class="gnews-md-preview-inner [&_a]:text-primary [&_a]:underline-offset-2 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm [&_th]:border [&_th]:border-border [&_th]:bg-muted/50 [&_th]:px-2 [&_th]:py-1 [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_blockquote]:border-primary/30 [&_blockquote]:text-muted-foreground"
              @click="onPreviewClick"
              v-html="previewHtml"
            />
          </div>
        </TabsContent>
        <TabsContent value="source" class="relative mt-2 outline-none">
          <Button
            :disabled="!formatted.trim()"
            aria-label="复制 Markdown 源码"
            class="absolute right-1 top-1 z-10 size-8 shrink-0"
            size="icon"
            type="button"
            variant="ghost"
            @click="copyMarkdownSource"
          >
            <Copy class="size-4" />
          </Button>
          <Textarea
            :model-value="formatted"
            class="max-h-[min(50vh,420px)] min-h-[220px] resize-none pr-10 pt-10 font-mono text-sm"
            placeholder="点击「获取资讯」后，这里会显示整理好的 Markdown 源码…"
            readonly
          />
        </TabsContent>
      </Tabs>
    </div>
  </div>
</template>
