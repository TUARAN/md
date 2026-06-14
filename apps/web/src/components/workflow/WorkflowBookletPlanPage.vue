<script setup lang="ts">
import type { PublishLabProductTier } from '@/constants/publishlab'
import {
  BadgeDollarSign,
  CheckCircle2,
  Copy,
  FileText,
} from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { computed, nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { PanelShell } from '@/components/ui/layout'
import {
  buildPublishLabTierMarkdown,
  PUBLISH_LAB_CHANNELS,
  PUBLISH_LAB_FOUR_WEEK_PLAN,
  PUBLISH_LAB_PIPELINE,
  PUBLISH_LAB_PRODUCT_TIERS,
} from '@/constants/publishlab'
import { useEditorStore } from '@/stores/editor'
import { usePostStore } from '@/stores/post'
import { copyPlain } from '@/utils/clipboard'
import { toast } from '@/utils/toast'
import WorkflowPageShell from './WorkflowPageShell.vue'
import WorkflowPageTitle from './WorkflowPageTitle.vue'
import WorkflowSectionTitle from './WorkflowSectionTitle.vue'

const router = useRouter()
const postStore = usePostStore()
const editorStore = useEditorStore()
const { currentPostId } = storeToRefs(postStore)

const selectedTierId = ref(PUBLISH_LAB_PRODUCT_TIERS[1]?.id ?? PUBLISH_LAB_PRODUCT_TIERS[0]?.id ?? ``)

const selectedTier = computed(() =>
  PUBLISH_LAB_PRODUCT_TIERS.find(tier => tier.id === selectedTierId.value) ?? PUBLISH_LAB_PRODUCT_TIERS[0],
)

const selectedTierMarkdown = computed(() => selectedTier.value ? buildPublishLabTierMarkdown(selectedTier.value) : ``)

async function copyMarkdown(markdown: string, label: string) {
  try {
    await copyPlain(markdown)
    toast.success(`已复制${label}`)
  }
  catch {
    toast.error(`复制失败`)
  }
}

async function createEditorPost(title: string, markdown: string) {
  const content = markdown.trim()
  if (!content) {
    toast.error(`没有可写入的内容`)
    return
  }

  postStore.addPost(title)
  const postId = currentPostId.value
  if (postId)
    postStore.updatePostContent(postId, content)

  await router.push({ name: `sync` })
  await nextTick()
  editorStore.importContent(content)
  toast.success(`已生成编辑器文稿`)
}

function createTierPost(tier: PublishLabProductTier) {
  createEditorPost(`PublishLab · ${tier.name}变现方案`, buildPublishLabTierMarkdown(tier))
}
</script>

<template>
  <WorkflowPageShell>
    <template #header>
      <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div class="min-w-0 space-y-3">
          <div class="inline-flex rounded-full border border-border/70 bg-white/70 px-2.5 py-1 text-xs font-medium text-muted-foreground dark:bg-card">
            PublishLab · 小册线
          </div>
          <WorkflowPageTitle>
            <template #icon>
              <BadgeDollarSign />
            </template>
            内容策划
          </WorkflowPageTitle>
          <p class="max-w-3xl text-sm leading-relaxed text-muted-foreground">
            把一组文章、教程或方法论定成可售卖的内容产品，明确产品形态、生产管线、渠道和 4 周执行计划。
          </p>
          <p class="text-sm font-medium text-foreground">
            这里不处理单篇文章排版发布，只负责小册的产品定义和交付路径。
          </p>
        </div>

        <div class="rounded-2xl border border-border/80 bg-white/80 p-4 shadow-sm dark:bg-card">
          <div class="text-xs font-semibold uppercase text-muted-foreground">
            当前分工
          </div>
          <div class="mt-3 space-y-2 text-sm">
            <div class="flex items-start gap-2">
              <span class="mt-1 size-2 rounded-full bg-primary" />
              <div>
                <div class="font-semibold text-foreground">
                  PublishLab
                </div>
                <div class="text-xs leading-relaxed text-muted-foreground">
                  负责小册、课程、训练营等系统内容资产。
                </div>
              </div>
            </div>
            <div class="flex items-start gap-2">
              <span class="mt-1 size-2 rounded-full bg-emerald-500" />
              <div>
                <div class="font-semibold text-foreground">
                  Syncblog
                </div>
                <div class="text-xs leading-relaxed text-muted-foreground">
                  负责单篇文章的排版、矩阵分发和复盘。
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div class="grid gap-4 pb-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(26rem,1fr)]">
      <section class="space-y-4">
        <WorkflowSectionTitle>
          产品层级
        </WorkflowSectionTitle>

        <div class="grid gap-3 sm:grid-cols-2">
          <button
            v-for="tier in PUBLISH_LAB_PRODUCT_TIERS"
            :key="tier.id"
            type="button"
            class="rounded-2xl border bg-white/85 p-4 text-left shadow-sm transition-colors dark:bg-background"
            :class="selectedTierId === tier.id ? 'border-primary/50 ring-2 ring-primary/15' : 'border-border/80 hover:border-primary/35'"
            @click="selectedTierId = tier.id"
          >
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="text-sm font-semibold text-foreground">
                  {{ tier.name }}
                </div>
                <div class="mt-1 text-xs text-muted-foreground">
                  {{ tier.format }}
                </div>
              </div>
              <div class="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                {{ tier.price }}
              </div>
            </div>
            <p class="mt-3 text-xs leading-relaxed text-muted-foreground">
              {{ tier.goal }}
            </p>
            <div class="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
              <CheckCircle2 class="size-3.5 text-emerald-600" />
              {{ tier.cycle }} · {{ tier.aiRole }}
            </div>
          </button>
        </div>

        <PanelShell tone="primary" radius="xl">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div class="text-sm font-semibold text-foreground">
                当前方案：{{ selectedTier?.name }} · {{ selectedTier?.format }}
              </div>
              <p class="mt-1 text-sm leading-relaxed text-muted-foreground">
                {{ selectedTier?.goal }}
              </p>
            </div>
            <div class="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="secondary" @click="copyMarkdown(selectedTierMarkdown, '变现方案')">
                <Copy class="mr-1.5 size-3.5" />
                复制
              </Button>
              <Button v-if="selectedTier" type="button" size="sm" @click="createTierPost(selectedTier)">
                <FileText class="mr-1.5 size-3.5" />
                生成方案草稿
              </Button>
            </div>
          </div>
        </PanelShell>
      </section>

      <section class="space-y-4">
        <WorkflowSectionTitle>
          生产管线
        </WorkflowSectionTitle>

        <div class="grid gap-3">
          <div
            v-for="(step, index) in PUBLISH_LAB_PIPELINE"
            :key="step.id"
            class="grid gap-3 rounded-2xl border border-border/80 bg-white/85 p-4 shadow-sm dark:bg-background sm:grid-cols-[4rem_1fr]"
          >
            <div class="flex items-center gap-2 sm:block">
              <div class="inline-flex size-9 items-center justify-center rounded-xl bg-foreground text-sm font-semibold text-background">
                {{ index + 1 }}
              </div>
              <div class="text-sm font-semibold text-foreground sm:mt-2">
                {{ step.title }}
              </div>
            </div>
            <div>
              <p class="text-sm leading-relaxed text-foreground">
                {{ step.action }}
              </p>
              <p class="mt-1 text-xs leading-relaxed text-muted-foreground">
                输出：{{ step.output }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section class="space-y-4 xl:col-span-2">
        <WorkflowSectionTitle>
          渠道与 4 周执行计划
        </WorkflowSectionTitle>
        <div class="grid gap-4 lg:grid-cols-2">
          <PanelShell>
            <div class="grid gap-3 sm:grid-cols-2">
              <div v-for="channel in PUBLISH_LAB_CHANNELS" :key="channel.id" class="rounded-xl bg-muted/35 p-3">
                <div class="text-sm font-semibold text-foreground">
                  {{ channel.title }}
                </div>
                <div class="mt-1 text-xs text-muted-foreground">
                  {{ channel.platforms.join(' / ') }}
                </div>
                <p class="mt-2 text-xs leading-relaxed text-muted-foreground">
                  {{ channel.strategy }}
                </p>
              </div>
            </div>
          </PanelShell>

          <PanelShell>
            <div class="grid gap-3">
              <div v-for="week in PUBLISH_LAB_FOUR_WEEK_PLAN" :key="week.week" class="grid gap-2 rounded-xl bg-muted/35 p-3 sm:grid-cols-[4rem_1fr]">
                <div class="text-sm font-semibold text-primary">
                  {{ week.week }}
                </div>
                <div>
                  <div class="text-sm font-semibold text-foreground">
                    {{ week.target }}
                  </div>
                  <div class="mt-1 flex flex-wrap gap-1.5">
                    <span v-for="action in week.actions" :key="action" class="rounded-full bg-background px-2 py-1 text-[11px] text-muted-foreground dark:bg-card">
                      {{ action }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </PanelShell>
        </div>
      </section>
    </div>
  </WorkflowPageShell>
</template>
