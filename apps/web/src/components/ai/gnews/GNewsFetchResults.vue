<script setup lang="ts">
import { Copy, Eye, FileText, Wand2 } from 'lucide-vue-next'
import GNewsArticleCard from '@/components/ai/gnews/GNewsArticleCard.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import WorkflowSectionTitle from '@/components/workflow/WorkflowSectionTitle.vue'
import { useGNewsFetchSession } from '@/composables/useGNewsFetchSession'

const {
  formatted,
  articles,
  lastProviderLabel,
  meta,
  lastError,
  maxArticles,
  sortby,
  resultTab,
  copyMarkdownSource,
  goRemixWithAssistant,
} = useGNewsFetchSession()
</script>

<template>
  <div class="gnews-fetch-results flex min-h-0 flex-1 flex-col gap-4">
    <div
      class="flex shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-4 sm:gap-y-1"
    >
      <p
        v-if="meta"
        class="text-muted-foreground text-xs leading-relaxed"
      >
        {{ meta }}
      </p>
      <div
        class="flex flex-wrap items-center gap-2 sm:justify-end"
      >
        <div class="inline-flex items-center gap-1.5">
          <span class="text-muted-foreground whitespace-nowrap text-[11px]">每页</span>
          <Input
            id="gnews-result-max"
            v-model.number="maxArticles"
            class="h-8 w-[3.25rem] px-2 text-center text-xs tabular-nums"
            max="100"
            min="1"
            type="number"
          />
        </div>
        <div class="inline-flex items-center gap-1.5">
          <span class="text-muted-foreground whitespace-nowrap text-[11px]">排序</span>
          <Select v-model="sortby">
            <SelectTrigger
              id="gnews-result-sort"
              class="h-8 w-[6.75rem] text-xs"
            >
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
    <p
      v-if="lastError"
      class="text-destructive shrink-0 text-sm"
    >
      {{ lastError }}
    </p>

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
          去 AI 改写
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
            class="max-h-[min(60vh,520px)] min-h-[220px] overflow-y-auto rounded-md border border-border/80 bg-muted/20 p-3"
          >
            <div
              v-if="articles.length === 0"
              class="text-muted-foreground py-8 text-center text-sm"
            >
              点击「获取资讯」后，此处将以卡片形式展示检索到的资讯…
            </div>
            <div v-else class="flex flex-col gap-3">
              <div
                v-if="lastProviderLabel"
                class="text-muted-foreground text-[11px] leading-relaxed"
              >
                本素材来自 <span class="text-foreground font-medium">{{ lastProviderLabel }}</span> 检索结果，写作或二创前请对照原文核对事实与数据（摘要 / 节选可能经过 API 截断）。
              </div>
              <GNewsArticleCard
                v-for="(article, idx) in articles"
                :key="`${article.url}-${idx}`"
                :article="article"
                :index="idx"
              />
            </div>
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
