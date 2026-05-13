<script setup lang="ts">
import { ChevronLeft, ChevronRight, Loader2, Settings2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
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
import { useGNewsFetchSession } from '@/composables/useGNewsFetchSession'

const {
  loading,
  abort,
  searchQuery,
  langSelect,
  country,
  maxArticles,
  sortby,
  configPanelExpanded,
  configSummary,
  storedApiKey,
  envKey,
  provider,
  sourceOptions,
  activeSource,
  isGNewsProxyEnabled,
  page,
  hasNextPage,
  fetchCurrentPage,
  fetchNextPage,
  fetchPrevPage,
  goFirstPage,
} = useGNewsFetchSession()
</script>

<template>
  <div class="gnews-fetch-rail flex flex-col gap-2.5">
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
        <div class="space-y-1">
          <Label class="text-xs text-muted-foreground">信息源</Label>
          <Select v-model="provider">
            <SelectTrigger class="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="source in sourceOptions"
                :key="source.value"
                class="text-xs"
                :value="source.value"
              >
                {{ source.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="space-y-1.5">
          <Label class="text-xs text-muted-foreground" for="gnews-key">{{ activeSource.keyLabel }}</Label>
          <p class="text-[11px] leading-relaxed text-muted-foreground">
            <template v-if="isGNewsProxyEnabled">
              {{ activeSource.note }}
            </template>
            <template v-else>
              免费注册后可获得 Key。
            </template>
            <a
              class="text-primary underline-offset-2 hover:underline"
              :href="activeSource.docsUrl"
              rel="noopener noreferrer"
              target="_blank"
            >获取 Key</a>
          </p>
          <PasswordInput
            id="gnews-key"
            v-model="storedApiKey"
            class="h-8 text-sm"
            :placeholder="isGNewsProxyEnabled ? `可留空` : envKey ? `可留空（已用环境变量 VITE_GNEWS_API_KEY）` : `粘贴 API Key`"
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
</template>
