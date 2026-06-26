<script setup lang="ts">
/**
 * ProjectDistribute —— 「项目」内容类型的分发台。
 *
 * 流程：粘贴 GitHub 仓库信息（或 README 摘要）→ 勾选目标平台 →
 * AI 按各平台调性生成推广贴 → 复制 / 打开平台分发。
 * 实际多平台发布仍由 SyncBlog 插件承担，本页负责「准备好各平台文案」。
 */
import type { RepoIntake } from '@/constants/promoTemplates'
import { Copy, ExternalLink, Github, Loader2, Sparkles } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PanelShell } from '@/components/ui/layout'
import { Textarea } from '@/components/ui/textarea'
import WorkflowPageShell from '@/components/workflow/WorkflowPageShell.vue'
import WorkflowPageTitle from '@/components/workflow/WorkflowPageTitle.vue'
import WorkflowSectionTitle from '@/components/workflow/WorkflowSectionTitle.vue'
import { buildAIHeaders, resolveEndpointUrl, useAIFetch } from '@/composables/useAIFetch'
import { APP_NAME } from '@/constants/branding'
import { buildProjectPromoPrompt, PROMO_PLATFORMS } from '@/constants/promoTemplates'
import useAIConfigStore from '@/stores/aiConfig'
import { useUIStore } from '@/stores/ui'
import { copyPlain } from '@/utils/clipboard'
import { toast } from '@/utils/toast'

const aiConfigStore = useAIConfigStore()
const uiStore = useUIStore()
const { apiKey, endpoint, model, temperature, maxToken, type } = storeToRefs(aiConfigStore)
const { loading, abort, fetchSSE } = useAIFetch()

const repo = reactive<RepoIntake>({
  name: ``,
  url: ``,
  tagline: ``,
  stack: ``,
  highlights: ``,
  readme: ``,
})

/** 选中的目标平台 id */
const selected = ref<string[]>([`juejin`, `weibo`, `jike`])
/** 每个平台生成的推广贴正文 */
const results = reactive<Record<string, string>>({})
/** 当前正在生成的平台 id（用于 loading 态） */
const generatingId = ref<string | null>(null)

const canGenerate = computed(() =>
  Boolean((repo.name.trim() || repo.url.trim() || repo.readme.trim()) && selected.value.length),
)

function togglePlatform(id: string) {
  selected.value = selected.value.includes(id)
    ? selected.value.filter(x => x !== id)
    : [...selected.value, id]
}

function ensureAIConfigured(): boolean {
  if (!endpoint.value || !model.value) {
    toast.error(`请先在 AI 设置里配置接口与模型`)
    uiStore.aiDialogVisible = true
    return false
  }
  return true
}

async function generateAll() {
  if (!canGenerate.value || loading.value)
    return
  if (!ensureAIConfigured())
    return

  for (const id of selected.value) {
    const platform = PROMO_PLATFORMS.find(p => p.id === id)
    if (!platform)
      continue
    generatingId.value = id
    results[id] = ``
    try {
      await fetchSSE(
        resolveEndpointUrl(endpoint.value, `chat`),
        buildAIHeaders(apiKey.value, type.value),
        {
          model: model.value,
          messages: [{ role: `user`, content: buildProjectPromoPrompt(repo, platform) }],
          temperature: temperature.value,
          max_tokens: maxToken.value,
          stream: true,
        },
        { onDelta(content) { results[id] += content } },
      )
    }
    catch (e) {
      toast.error(`${platform.title} 生成失败：${(e as Error).message}`)
    }
  }
  generatingId.value = null
  toast.success(`推广贴已生成，可逐条复制并分发`)
}

async function copyResult(id: string) {
  try {
    await copyPlain(results[id] ?? ``)
    toast.success(`已复制 ${PROMO_PLATFORMS.find(p => p.id === id)?.title ?? ``} 文案`)
  }
  catch {
    toast.error(`复制失败`)
  }
}

onBeforeUnmount(() => abort())
</script>

<template>
  <WorkflowPageShell>
    <template #header>
      <div class="mb-3 inline-flex rounded-full border border-border/70 bg-white/70 px-2.5 py-1 text-xs font-medium text-muted-foreground dark:bg-card">
        {{ APP_NAME }} · 项目分发
      </div>
      <WorkflowPageTitle>
        <template #icon>
          <Github />
        </template>
        项目推广分发
      </WorkflowPageTitle>
      <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
        粘贴 GitHub 仓库信息，AI 会按各平台调性生成推广贴；逐条复制或交给发布插件，一次把项目铺到掘金、微博、即刻、Show HN 等渠道。
      </p>
    </template>

    <div class="grid min-h-0 gap-4 lg:grid-cols-[22rem_minmax(0,1fr)] lg:items-start">
      <!-- 左：仓库接入 + 平台选择 -->
      <aside class="min-w-0 space-y-4 lg:sticky lg:top-3">
        <PanelShell tone="neutral" radius="md" padding="md" flat>
          <WorkflowSectionTitle>
            项目档案
          </WorkflowSectionTitle>
          <div class="mt-3 space-y-3">
            <div class="space-y-1">
              <Label class="text-xs">项目名</Label>
              <Input v-model="repo.name" placeholder="如：md / 内容同步智能体" />
            </div>
            <div class="space-y-1">
              <Label class="text-xs">仓库地址</Label>
              <Input v-model="repo.url" placeholder="https://github.com/owner/repo" />
            </div>
            <div class="space-y-1">
              <Label class="text-xs">一句话简介</Label>
              <Input v-model="repo.tagline" placeholder="它解决什么问题" />
            </div>
            <div class="space-y-1">
              <Label class="text-xs">技术栈</Label>
              <Input v-model="repo.stack" placeholder="如：Vue 3 + TypeScript + WXT" />
            </div>
            <div class="space-y-1">
              <Label class="text-xs">卖点 / 亮点（一行一个）</Label>
              <Textarea v-model="repo.highlights" :rows="3" placeholder="一键发布 30+ 平台&#10;本地浏览器登录态，免 API&#10;Markdown 即写即发" />
            </div>
            <div class="space-y-1">
              <Label class="text-xs">README 摘要（可选）</Label>
              <Textarea v-model="repo.readme" :rows="3" placeholder="粘贴 README 关键段落，帮助 AI 抓准卖点" />
            </div>
          </div>
        </PanelShell>

        <PanelShell tone="neutral" radius="md" padding="md" flat>
          <WorkflowSectionTitle>
            目标平台
          </WorkflowSectionTitle>
          <div class="mt-3 grid grid-cols-2 gap-2">
            <button
              v-for="p in PROMO_PLATFORMS"
              :key="p.id"
              type="button"
              class="flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-sm transition-colors"
              :class="selected.includes(p.id)
                ? 'border-primary/45 bg-primary/[0.08] text-primary ring-1 ring-primary/15'
                : 'border-border/70 text-muted-foreground hover:border-border hover:bg-muted/40 hover:text-foreground'"
              @click="togglePlatform(p.id)"
            >
              <span
                class="flex size-4 shrink-0 items-center justify-center rounded border text-[10px] font-semibold"
                :class="selected.includes(p.id) ? 'border-primary bg-primary text-primary-foreground' : 'border-border/70 text-transparent'"
              >✓</span>
              <span class="min-w-0 truncate">{{ p.title }}</span>
            </button>
          </div>
          <Button class="mt-4 w-full gap-1.5" :disabled="!canGenerate || loading" @click="generateAll">
            <Loader2 v-if="loading" class="size-4 animate-spin" />
            <Sparkles v-else class="size-4" />
            {{ loading ? '生成中…' : `生成 ${selected.length} 条推广贴` }}
          </Button>
          <button v-if="loading" type="button" class="mt-2 w-full text-xs text-muted-foreground underline-offset-2 hover:underline" @click="abort()">
            停止生成
          </button>
        </PanelShell>
      </aside>

      <!-- 右：生成结果 -->
      <main class="min-w-0 space-y-3">
        <div
          v-for="p in PROMO_PLATFORMS.filter(p => selected.includes(p.id))"
          :key="p.id"
          class="rounded-[16px] border border-border/80 bg-white/80 p-4 dark:bg-card"
        >
          <div class="flex items-center justify-between gap-2">
            <div class="min-w-0">
              <p class="flex items-center gap-1.5 text-sm font-semibold">
                {{ p.title }}
                <Loader2 v-if="generatingId === p.id" class="size-3.5 animate-spin text-primary" />
              </p>
              <p class="mt-0.5 text-[11px] text-muted-foreground">
                {{ p.shape }}
              </p>
            </div>
            <Button
              v-if="results[p.id]"
              type="button"
              variant="outline"
              size="sm"
              class="shrink-0 gap-1.5"
              @click="copyResult(p.id)"
            >
              <Copy class="size-3.5" />
              复制
            </Button>
          </div>
          <Textarea
            v-model="results[p.id]"
            :rows="6"
            class="mt-3 font-mono text-xs"
            :placeholder="generatingId === p.id ? '生成中…' : '点上方「生成推广贴」后这里出现可编辑的文案'"
          />
        </div>

        <p
          v-if="!selected.length"
          class="rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground"
        >
          先在左侧勾选至少一个目标平台。
        </p>

        <div class="flex items-center gap-2 rounded-xl border border-border/60 bg-muted/10 px-3 py-2.5 text-xs text-muted-foreground">
          <ExternalLink class="size-3.5 shrink-0" />
          复制文案后，用「下载插件」里的 SyncBlog 发布插件一键铺到各平台；英文渠道（Show HN / Reddit / Product Hunt）请手动发布。
        </div>
      </main>
    </div>
  </WorkflowPageShell>
</template>
