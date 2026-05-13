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

const showApiKeyPanel = computed(() => provider.value !== `hackernews`)
</script>

<template>
  <div class="gnews-fetch-rail flex flex-col gap-2">
    <div class="flex flex-wrap items-center gap-2">
      <Select v-model="provider">
        <SelectTrigger class="h-9 w-full rounded-lg border-slate-300 bg-white text-sm focus:ring-indigo-500 dark:border-border dark:bg-background sm:w-44">
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

      <Input
        id="gnews-q"
        v-model="searchQuery"
        class="h-9 min-w-[14rem] flex-1 text-sm"
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

    <div
      v-if="showApiKeyPanel"
      class="overflow-hidden rounded-xl border border-slate-200 bg-white/80 shadow-sm dark:border-border dark:bg-background/60"
    >
      <button
        class="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-slate-50 dark:hover:bg-muted/40"
        type="button"
        @click="configPanelExpanded = !configPanelExpanded"
      >
        <Settings2 class="size-3.5 shrink-0 text-muted-foreground" />
        <span class="shrink-0 text-xs font-medium">API Key</span>
        <span class="text-muted-foreground min-w-0 flex-1 truncate text-[11px] leading-tight">
          {{ configSummary }}
        </span>
        <span class="text-muted-foreground shrink-0 text-[10px]">
          {{ configPanelExpanded ? `收起` : `展开` }}
        </span>
      </button>
      <div
        v-show="configPanelExpanded"
        class="border-t border-border/50 px-3 pb-3 pt-3"
      >
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
      </div>
    </div>
  </div>
</template>
