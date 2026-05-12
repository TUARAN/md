<script setup lang="ts">
import type { RendererAPI } from '@md/shared/types'
import { highlightPendingBlocks, hljs, initRenderer } from '@md/core'
import { ChevronLeft, ChevronRight, Copy, Eye, FileText, Loader2, Newspaper, Settings2, Wand2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useGNews } from '@/composables/useGNews'
import useGNewsConfigStore from '@/stores/gnewsConfig'
import { useThemeStore } from '@/stores/theme'
import { useUIStore } from '@/stores/ui'
import { postProcessHtml, renderMarkdown } from '@/utils'
import { copyPlain } from '@/utils/clipboard'
import { toast } from '@/utils/toast'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits([`update:open`])

const dialogVisible = ref(props.open)
watch(() => props.open, (val) => {
  dialogVisible.value = val
})
watch(dialogVisible, val => emit(`update:open`, val))

const gnewsStore = useGNewsConfigStore()
const {
  apiKey: storedApiKey,
  searchQuery,
  lang,
  country,
  maxArticles,
  sortby,
  configPanelExpanded,
} = storeToRefs(gnewsStore)

const themeStore = useThemeStore()
const uiStore = useUIStore()
const { toggleGNewsDialog, toggleAIDialog, queueAiAssistantDraftMarkdown } = uiStore
const { isCiteStatus, legend, isCountStatus, isMacCodeBlock, isShowLineNumber } = storeToRefs(themeStore)
const { isDark } = storeToRefs(uiStore)

const { loading, abort, search } = useGNews()

const page = ref(1)
/** 最近一次成功请求时 GNews 报告的总命中量（用于估算是否还有下一页） */
const lastTotalArticles = ref<number | undefined>(undefined)
/** 最近一次成功请求返回的条数 */
const lastPageItemCount = ref(0)

const formatted = ref(``)
const meta = ref(``)
const lastError = ref(``)

/** 预览 / 源码切换；复制 Markdown 仅在源码 Tab 内提供 */
const resultTab = ref<`preview` | `source`>(`preview`)
const previewHtml = ref(``)
const previewContainerRef = useTemplateRef<HTMLElement>(`previewContainerRef`)

let panelRenderer: RendererAPI | null = null

function refreshGNewsPreview() {
  if (!panelRenderer) {
    return
  }
  const md = formatted.value.trim()
  if (!md) {
    previewHtml.value = ``
    return
  }

  panelRenderer.reset({
    citeStatus: isCiteStatus.value,
    legend: legend.value,
    countStatus: isCountStatus.value,
    isMacCodeBlock: isMacCodeBlock.value,
    isShowLineNumber: isShowLineNumber.value,
    themeMode: isDark.value ? `dark` : `light`,
  })

  const { html, readingTime } = renderMarkdown(md, panelRenderer)
  previewHtml.value = postProcessHtml(html, readingTime, panelRenderer)
}

watch(
  [formatted, isCiteStatus, legend, isCountStatus, isMacCodeBlock, isShowLineNumber, isDark],
  () => {
    refreshGNewsPreview()
  },
)

watch(previewHtml, () => {
  if (!previewHtml.value.trim()) {
    return
  }
  nextTick(() => {
    const el = previewContainerRef.value
    if (el) {
      highlightPendingBlocks(hljs, el)
    }
  })
})

const envKey = (import.meta.env.VITE_GNEWS_API_KEY ?? ``).trim()

const effectiveApiKey = computed(() => storedApiKey.value.trim() || envKey)

/** radix Select 不使用空字符串 value */
const langSelect = computed({
  get: () => lang.value || `_unset`,
  set: (v: string) => {
    lang.value = v === `_unset` ? `` : v
  },
})

const effectiveMax = computed(() => Math.min(100, Math.max(1, maxArticles.value)))

const hasNextPage = computed(() => {
  const n = lastPageItemCount.value
  const max = effectiveMax.value
  if (n <= 0)
    return false
  const total = lastTotalArticles.value
  if (total != null && total >= 0)
    return page.value * max < total
  return n >= max
})

const configSummary = computed(() => {
  const q = searchQuery.value.trim() || `未填关键词`
  const langLabel = lang.value ? lang.value.toUpperCase() : `不限语言`
  const cc = country.value.trim().toLowerCase()
  const nation = cc ? cc.toUpperCase() : `不限地区`
  const sortLabel = sortby.value === `publishedAt` ? `发布时间` : `相关度`
  return `${q} · ${langLabel} · ${nation} · 每页 ${maxArticles.value} · ${sortLabel}`
})

function resetPaginationState() {
  page.value = 1
  lastTotalArticles.value = undefined
  lastPageItemCount.value = 0
}

watch(searchQuery, () => {
  resetPaginationState()
})

watch([lang, country, maxArticles, sortby], () => {
  resetPaginationState()
})

async function runFetch() {
  lastError.value = ``
  formatted.value = ``

  const result = await search({
    q: searchQuery.value,
    apikey: effectiveApiKey.value,
    lang: lang.value || undefined,
    country: country.value.trim().toLowerCase() || undefined,
    max: effectiveMax.value,
    page: page.value,
    sortby: sortby.value,
  })

  if (result.error) {
    lastError.value = result.error
    lastPageItemCount.value = 0
    if (
      result.error.includes(`GNews API Key`)
      || result.error.includes(`VITE_GNEWS_API_KEY`)
    ) {
      configPanelExpanded.value = true
      nextTick(() => {
        document.getElementById(`gnews-key`)?.focus()
      })
    }
    toast.error(result.error)
    return
  }

  if (!result.formatted.trim()) {
    lastError.value = `本页未返回资讯，可尝试换关键词或翻页`
    lastPageItemCount.value = result.articles.length
    lastTotalArticles.value = result.totalArticles
    toast.warning(lastError.value)
    return
  }

  formatted.value = result.formatted
  lastTotalArticles.value = result.totalArticles
  lastPageItemCount.value = result.articles.length
  const total = result.totalArticles
  meta.value
    = total !== undefined
      ? `第 ${page.value} 页 · 约 ${total} 篇命中 · 本页 ${result.articles.length} 条`
      : `第 ${page.value} 页 · 本页 ${result.articles.length} 条`
  toast.success(`已整理 ${result.articles.length} 条资讯`)
}

function fetchCurrentPage() {
  void runFetch()
}

function fetchNextPage() {
  if (!hasNextPage.value) {
    toast.warning(`当前已是末页或本页条数未满，没有更多下一页`)
    return
  }
  page.value += 1
  void runFetch()
}

function fetchPrevPage() {
  if (page.value <= 1) {
    return
  }
  page.value -= 1
  void runFetch()
}

function goFirstPage() {
  if (page.value === 1) {
    void runFetch()
    return
  }
  page.value = 1
  void runFetch()
}

async function copyMarkdownSource() {
  if (!formatted.value.trim()) {
    toast.error(`暂无内容可复制`)
    return
  }
  try {
    await copyPlain(formatted.value)
    toast.success(`已复制 Markdown`)
  }
  catch {
    toast.error(`复制失败`)
  }
}

function goRemixWithAssistant() {
  if (!formatted.value.trim()) {
    toast.error(`请先获取资讯`)
    return
  }
  queueAiAssistantDraftMarkdown(formatted.value)
  toggleGNewsDialog(false)
  toggleAIDialog(true)
}

function onPreviewClick(e: MouseEvent) {
  const a = (e.target as HTMLElement | null)?.closest(`a`)
  const href = a?.getAttribute(`href`)?.trim()
  if (!href || !/^https?:\/\//i.test(href))
    return
  e.preventDefault()
  window.open(href, `_blank`, `noopener,noreferrer`)
}

onMounted(() => {
  panelRenderer = initRenderer({
    isMacCodeBlock: isMacCodeBlock.value,
    isShowLineNumber: isShowLineNumber.value,
  })
  refreshGNewsPreview()
})

onBeforeUnmount(() => {
  abort()
  panelRenderer = null
})
</script>

<template>
  <Dialog v-model:open="dialogVisible">
    <DialogContent
      class="gnews-fetch-panel bg-card text-card-foreground flex flex-col w-[95vw] max-h-[90vh] sm:max-h-[85vh] sm:max-w-2xl overflow-y-auto gap-4"
    >
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <Newspaper class="h-5 w-5" />
          资讯获取（GNews）
        </DialogTitle>
        <DialogDescription>
          使用
          <a
            class="text-primary underline-offset-4 hover:underline"
            href="https://gnews.io/"
            rel="noopener noreferrer"
            target="_blank"
          >GNews</a>
          按关键词检索，固定条数整理成可供后续二创的参考文案。免费档通常仅允许由 localhost 跨域请求；线上部署需升级套餐或配置反向代理。
        </DialogDescription>
      </DialogHeader>

      <div class="flex flex-col gap-2.5">
        <div class="flex flex-wrap items-center gap-2">
          <Input
            id="gnews-q"
            v-model="searchQuery"
            class="h-9 min-w-[9rem] flex-1 text-sm"
            placeholder="关键词，例如 大模型"
            @keydown.enter.prevent="fetchCurrentPage"
          />
          <Button
            :disabled="loading"
            class="h-9 shrink-0 px-3 text-sm"
            type="button"
            @click="fetchCurrentPage"
          >
            <Loader2
              v-if="loading"
              class="mr-1.5 size-4 animate-spin"
            />
            获取
          </Button>
          <div class="flex items-center gap-0.5 rounded-md border border-border/70 bg-background/50 p-0.5">
            <Button
              :disabled="loading || page <= 1"
              class="size-8 p-0"
              title="上一页"
              type="button"
              variant="ghost"
              @click="fetchPrevPage"
            >
              <ChevronLeft class="size-4" />
            </Button>
            <span class="text-muted-foreground min-w-[2.75rem] px-0.5 text-center text-xs tabular-nums">
              {{ page }} / 页
            </span>
            <Button
              :disabled="loading || !hasNextPage"
              class="size-8 p-0"
              title="下一页"
              type="button"
              variant="ghost"
              @click="fetchNextPage"
            >
              <ChevronRight class="size-4" />
            </Button>
          </div>
          <Button
            v-if="page > 1"
            :disabled="loading"
            class="h-8 shrink-0 px-2 text-xs"
            type="button"
            variant="ghost"
            @click="goFirstPage"
          >
            回第 1 页
          </Button>
          <Button
            :disabled="loading"
            class="h-9 shrink-0 px-2 text-xs text-muted-foreground"
            type="button"
            variant="ghost"
            @click="abort"
          >
            取消
          </Button>
        </div>

        <div class="overflow-hidden rounded-lg border border-border/60 bg-muted/15">
          <button
            class="flex w-full items-center gap-2 px-2.5 py-2 text-left transition-colors hover:bg-muted/40"
            type="button"
            @click="configPanelExpanded = !configPanelExpanded"
          >
            <Settings2 class="size-3.5 shrink-0 text-muted-foreground" />
            <span class="shrink-0 text-xs font-medium">检索配置</span>
            <span class="text-muted-foreground min-w-0 flex-1 truncate text-[11px] leading-tight">
              {{ configSummary }}
            </span>
            <span class="text-muted-foreground shrink-0 text-[10px]">
              {{ configPanelExpanded ? `收起` : `展开` }}
            </span>
          </button>
          <div
            v-show="configPanelExpanded"
            class="space-y-2 border-t border-border/50 px-2.5 pb-2.5 pt-2"
          >
            <div class="space-y-1.5">
              <Label class="text-xs text-muted-foreground" for="gnews-key">API Key</Label>
              <p class="text-[11px] leading-relaxed text-muted-foreground">
                免费注册后可获得 Key。
                <a
                  class="text-primary underline-offset-2 hover:underline"
                  href="https://gnews.io/"
                  rel="noopener noreferrer"
                  target="_blank"
                >在 gnews.io 获取</a>
              </p>
              <PasswordInput
                id="gnews-key"
                v-model="storedApiKey"
                class="h-8 text-sm"
                :placeholder="envKey ? `可留空（已用环境变量 VITE_GNEWS_API_KEY）` : `粘贴 API Key`"
              />
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div class="space-y-1">
                <Label class="text-xs text-muted-foreground">语言</Label>
                <Select v-model="langSelect">
                  <SelectTrigger class="h-8 text-xs">
                    <SelectValue placeholder="不限" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem class="text-xs" value="_unset">
                      不限
                    </SelectItem>
                    <SelectItem class="text-xs" value="zh">
                      中文 zh
                    </SelectItem>
                    <SelectItem class="text-xs" value="en">
                      English en
                    </SelectItem>
                    <SelectItem class="text-xs" value="ja">
                      日本語 ja
                    </SelectItem>
                    <SelectItem class="text-xs" value="fr">
                      Français fr
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="space-y-1">
                <Label class="text-xs text-muted-foreground" for="gnews-country">国家 ISO2</Label>
                <Input
                  id="gnews-country"
                  v-model="country"
                  class="h-8 text-xs"
                  maxlength="2"
                  placeholder="如 cn，留空不限"
                />
              </div>
              <div class="space-y-1">
                <Label class="text-xs text-muted-foreground" for="gnews-max">每页条数</Label>
                <Input
                  id="gnews-max"
                  v-model.number="maxArticles"
                  class="h-8 text-xs"
                  max="100"
                  min="1"
                  type="number"
                />
              </div>
              <div class="space-y-1">
                <Label class="text-xs text-muted-foreground">排序</Label>
                <Select v-model="sortby">
                  <SelectTrigger class="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem class="text-xs" value="publishedAt">
                      发布时间
                    </SelectItem>
                    <SelectItem class="text-xs" value="relevance">
                      相关度
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p
        v-if="meta"
        class="text-muted-foreground text-xs"
      >
        {{ meta }}
      </p>
      <p
        v-if="lastError"
        class="text-destructive text-sm"
      >
        {{ lastError }}
      </p>

      <div class="space-y-2 shrink-0 min-h-[200px] flex flex-col flex-1">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <Label class="text-base">
            整理结果（提示词材料）
          </Label>
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
        <Tabs v-model="resultTab" class="w-full">
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
              class="gnews-md-preview min-h-[220px] max-h-[min(50vh,420px)] overflow-y-auto overflow-x-auto rounded-md border border-border/80 bg-muted/20 px-3 py-3 text-sm"
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
              class="min-h-[220px] max-h-[min(50vh,420px)] resize-none pr-10 pt-10 font-mono text-sm"
              placeholder="点击「获取资讯」后，这里会显示整理好的 Markdown 源码…"
              readonly
            />
          </TabsContent>
        </Tabs>
      </div>
    </DialogContent>
  </Dialog>
</template>
