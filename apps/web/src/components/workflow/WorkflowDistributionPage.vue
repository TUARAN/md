<script setup lang="ts">
/**
 * WorkflowDistributionPage —— workflow 第 4 步「宣发活跃」
 *
 * 左侧为可折叠平台侧栏，右侧显示当前平台策略。小红书的生图与配文
 * 生产入口在「风格二创」，本页只保留平台策略与跳转入口。
 */
import { ChevronLeft, ChevronRight, Eye, Megaphone, Target } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { getCreatorPlatformMatrix, getWorkflowCreator } from '@/constants/creators'
import { FAN_GROWTH_MILESTONES } from '@/constants/distributionFocus'
import {
  getDistributionStrategy,
  getPlatformGrowthSnapshot,
  listDistributionPlatformTypes,
} from '@/constants/distributionStrategies'
import { useUIStore } from '@/stores/ui'
import { getPlatformProfileTitle } from '@/utils/socialAccounts'
import IPReachTool from './IPReachTool.vue'
import WorkflowCreatorPicker from './WorkflowCreatorPicker.vue'
import WorkflowPageShell from './WorkflowPageShell.vue'
import WorkflowPageTitle from './WorkflowPageTitle.vue'
import WorkflowSectionTitle from './WorkflowSectionTitle.vue'

const uiStore = useUIStore()
const {
  workflowCreatorId,
  workflowDistributionPlatform,
  workflowMatrixDataSourceExpanded,
} = storeToRefs(uiStore)
const { setWorkflowDistributionPlatform } = uiStore
const router = useRouter()

const isPlatformRailCollapsed = ref(false)
const distributionModule = ref<`strategy` | `ipReach`>(`strategy`)

const creator = computed(() => getWorkflowCreator(workflowCreatorId.value))

const platformRows = computed(() => {
  const matrix = getCreatorPlatformMatrix(workflowCreatorId.value)
  const byType = new Map(matrix.map(row => [row.type, row]))
  return listDistributionPlatformTypes(workflowCreatorId.value, matrix.map(row => row.type))
    .map((type) => {
      const row = byType.get(type)
      return {
        type,
        title: getPlatformProfileTitle(type),
        url: row?.url ?? `#`,
        followers: row?.followers ?? `—`,
        reads: row?.reads ?? `—`,
      }
    })
})

const strategy = computed(() =>
  getDistributionStrategy(workflowCreatorId.value, workflowDistributionPlatform.value),
)

const growth = computed(() =>
  getPlatformGrowthSnapshot(workflowCreatorId.value, workflowDistributionPlatform.value),
)

const platformLabel = computed(() => getPlatformProfileTitle(workflowDistributionPlatform.value))
const isXiaohongshuSelected = computed(() => workflowDistributionPlatform.value === `xiaohongshu`)

function onSelectDistribution(platformType: string) {
  setWorkflowDistributionPlatform(platformType)
}

function goContentSync() {
  router.push({ name: `sync` })
}

function goXiaohongshuCreation() {
  router.push({ name: `creation`, query: { mode: `xiaohongshu` } })
}

function onMatrixDataSourceToggle(event: Event) {
  const details = event.target as HTMLDetailsElement
  workflowMatrixDataSourceExpanded.value = details.open
}
</script>

<template>
  <WorkflowPageShell>
    <template #header>
      <WorkflowPageTitle>
        <template #icon>
          <Megaphone />
        </template>
        宣发活跃
      </WorkflowPageTitle>
      <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
        左侧切换分发平台，右侧可在平台策略与 IP 访达工具之间切换；当前
        <span class="font-mono text-foreground">{{ workflowCreatorId }}</span>
        ·
        <span class="font-medium text-foreground">{{ platformLabel }}</span>
        的策略会在下方展示。
      </p>
      <details
        class="mt-2 rounded-lg border border-border/50 bg-muted/10 text-xs leading-relaxed text-muted-foreground"
        :open="workflowMatrixDataSourceExpanded"
        @toggle="onMatrixDataSourceToggle"
      >
        <summary class="cursor-pointer px-3 py-2 font-medium text-foreground/90">
          数据从哪来？
        </summary>
        <div class="space-y-2 border-t border-border/40 px-3 py-2.5">
          <p>
            <span class="font-medium text-foreground">常规路径：</span>
            在浏览器安装
            <span class="font-medium">COSE</span>
            并登录目标平台后，扩展会把主页 / 粉丝 / 阅读写入本地缓存。
          </p>
          <p>
            <span class="font-medium text-foreground">限制与兜底：</span>
            部分平台无法统计全量阅读，或主页 / 个人中心难以稳定抓取，此时仅显示已缓存字段。
          </p>
        </div>
      </details>
      <div class="mt-3">
        <WorkflowCreatorPicker />
      </div>
    </template>

    <div
      v-if="creator"
      class="grid min-h-0 gap-4 pb-4 lg:items-start"
      :class="isPlatformRailCollapsed
        ? 'lg:grid-cols-[4.75rem_minmax(0,1fr)]'
        : 'lg:grid-cols-[19rem_minmax(0,1fr)]'"
    >
      <aside class="min-w-0 rounded-[18px] border border-border/80 bg-white/80 p-3 dark:bg-card lg:sticky lg:top-3">
        <div class="flex items-center justify-between gap-2">
          <div v-if="!isPlatformRailCollapsed" class="min-w-0">
            <p class="text-sm font-semibold">
              平台
            </p>
            <p class="mt-0.5 text-xs text-muted-foreground">
              {{ platformRows.length }} 个渠道
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            class="h-8 w-8 shrink-0"
            :title="isPlatformRailCollapsed ? '展开平台侧栏' : '折叠平台侧栏'"
            :aria-label="isPlatformRailCollapsed ? '展开平台侧栏' : '折叠平台侧栏'"
            @click="isPlatformRailCollapsed = !isPlatformRailCollapsed"
          >
            <ChevronRight v-if="isPlatformRailCollapsed" class="size-4" />
            <ChevronLeft v-else class="size-4" />
          </Button>
        </div>

        <nav class="mt-3 grid gap-1.5" aria-label="宣发平台">
          <button
            v-for="row in platformRows"
            :key="row.type"
            type="button"
            class="group flex min-h-11 w-full items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition-colors"
            :class="workflowDistributionPlatform === row.type
              ? 'border-primary/45 bg-primary/[0.08] text-primary ring-1 ring-primary/15'
              : 'border-transparent text-muted-foreground hover:border-border hover:bg-muted/40 hover:text-foreground'"
            :title="row.title"
            @click="onSelectDistribution(row.type)"
          >
            <span class="flex size-8 shrink-0 items-center justify-center rounded-lg border border-current/15 bg-background/70 text-xs font-semibold">
              {{ row.title.slice(0, 1) }}
            </span>
            <span v-if="!isPlatformRailCollapsed" class="min-w-0 flex-1">
              <span class="block truncate text-sm font-medium">{{ row.title }}</span>
              <span class="mt-0.5 block truncate text-[11px] text-muted-foreground">
                粉丝 {{ row.followers }} · 阅读 {{ row.reads }}
              </span>
            </span>
          </button>
        </nav>
      </aside>

      <main class="min-w-0">
        <div class="mb-4 inline-flex rounded-lg border border-border/80 bg-white/80 p-1 dark:bg-card" aria-label="宣发活跃模块">
          <button
            type="button"
            class="inline-flex min-h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors"
            :class="distributionModule === 'strategy'
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'"
            @click="distributionModule = 'strategy'"
          >
            <Target class="h-4 w-4" />
            平台策略
          </button>
          <button
            type="button"
            class="inline-flex min-h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-colors"
            :class="distributionModule === 'ipReach'
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'"
            @click="distributionModule = 'ipReach'"
          >
            <Eye class="h-4 w-4" />
            IP 访达工具
          </button>
        </div>

        <IPReachTool v-if="distributionModule === 'ipReach'" />

        <div v-else class="min-w-0 space-y-4">
          <section class="rounded-[18px] border border-primary/25 bg-primary/[0.05] p-4 dark:bg-primary/10">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0 flex-1">
                <p class="flex flex-wrap items-center gap-2">
                  <span class="flex items-center gap-1.5 text-xs font-medium text-primary">
                    <Target class="h-3.5 w-3.5" />
                    {{ strategy.title }}
                  </span>
                  <span
                    v-if="strategy.badge"
                    class="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary"
                  >
                    {{ strategy.badge }}
                  </span>
                </p>
                <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {{ strategy.summary }}
                </p>
                <p class="mt-2 text-xs text-muted-foreground">
                  <span class="font-medium text-foreground">节奏：</span>{{ strategy.cadence }}
                </p>
              </div>
              <div v-if="growth.row" class="shrink-0 text-right text-sm">
                <p class="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  粉丝阶段
                </p>
                <p class="mt-0.5 text-base font-semibold tabular-nums">
                  {{ growth.milestone.range }}
                </p>
                <p class="text-xs text-muted-foreground">
                  {{ growth.milestone.title }}
                </p>
                <p class="mt-1 text-[11px] tabular-nums text-muted-foreground">
                  粉丝 {{ growth.row.followers }} · 阅读 {{ growth.row.reads }}
                </p>
              </div>
              <div v-else class="shrink-0 text-right text-sm">
                <p class="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  粉丝阶段
                </p>
                <p class="mt-0.5 text-base font-semibold">
                  {{ growth.milestone.range }}
                </p>
                <p class="text-xs text-muted-foreground">
                  {{ growth.milestone.title }}
                </p>
              </div>
            </div>
          </section>

          <section
            v-if="isXiaohongshuSelected"
            class="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-rose-200 bg-rose-50/70 p-4 text-sm dark:border-rose-900/40 dark:bg-rose-950/20"
          >
            <div class="min-w-0">
              <p class="font-semibold text-rose-950 dark:text-rose-100">
                小红书内容生产放在风格二创
              </p>
              <p class="mt-1 text-xs leading-relaxed text-rose-900/75 dark:text-rose-100/70">
                当前页保留平台节奏、打法和复盘；封面生图、配文和 Markdown 成稿到「风格二创 · 小红书图文」完成。
              </p>
            </div>
            <Button type="button" size="sm" class="shrink-0" @click="goXiaohongshuCreation">
              去生成小红书图文
            </Button>
          </section>

          <section class="grid gap-4 sm:grid-cols-2">
            <div class="rounded-xl border border-border/80 bg-white/80 p-4 dark:bg-card">
              <WorkflowSectionTitle>
                打法要点
              </WorkflowSectionTitle>
              <ul class="mt-2 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
                <li v-for="item in strategy.tactics" :key="item" class="flex gap-1.5">
                  <span class="text-primary">·</span>
                  <span>{{ item }}</span>
                </li>
              </ul>
            </div>
            <div class="rounded-xl border border-border/80 bg-white/80 p-4 dark:bg-card">
              <WorkflowSectionTitle>
                近期动作
              </WorkflowSectionTitle>
              <ul class="mt-2 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
                <li v-for="item in strategy.nextActions" :key="item" class="flex gap-1.5">
                  <span class="text-primary">→</span>
                  <span>{{ item }}</span>
                </li>
              </ul>
            </div>
          </section>

          <section>
            <WorkflowSectionTitle>
              粉丝量成长阶梯
            </WorkflowSectionTitle>
            <p class="mt-1 text-xs text-muted-foreground">
              以当前渠道粉丝数为锚（{{ platformLabel }}）。
            </p>
            <ol class="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              <li
                v-for="step in FAN_GROWTH_MILESTONES"
                :key="step.id"
                class="rounded-xl border px-3 py-2.5"
                :class="growth.milestoneId === step.id
                  ? 'border-primary/40 bg-primary/[0.08] ring-1 ring-primary/20'
                  : 'border-border/80 bg-white/70 dark:bg-background/40'"
              >
                <p
                  class="text-xs font-semibold tabular-nums"
                  :class="growth.milestoneId === step.id ? 'text-primary' : 'text-foreground'"
                >
                  {{ step.range }}
                </p>
                <p class="mt-0.5 text-sm font-medium">
                  {{ step.title }}
                </p>
                <p class="mt-1 text-[11px] leading-snug text-muted-foreground">
                  {{ step.summary }}
                </p>
              </li>
            </ol>
          </section>

          <section class="flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
            <Button variant="outline" size="sm" @click="goContentSync">
              上一步：内容同步
            </Button>
          </section>
        </div>
      </main>
    </div>

    <p v-else class="pb-4 text-sm text-muted-foreground">
      请先选择有效创作者 ID。
    </p>
  </WorkflowPageShell>
</template>
