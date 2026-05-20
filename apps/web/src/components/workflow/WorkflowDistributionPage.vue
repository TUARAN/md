<script setup lang="ts">
import { ExternalLink, Megaphone, Target } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { getWorkflowCreator } from '@/constants/creators'
import { FAN_GROWTH_MILESTONES } from '@/constants/distributionFocus'
import {
  getDistributionStrategy,
  getPlatformGrowthSnapshot,
} from '@/constants/distributionStrategies'
import { useUIStore } from '@/stores/ui'
import { creatorPlatformMatrixRoute } from '@/utils/creatorRoutes'
import { getPlatformProfileTitle } from '@/utils/socialAccounts'
import WorkflowCreatorPicker from './WorkflowCreatorPicker.vue'
import WorkflowPageShell from './WorkflowPageShell.vue'
import WorkflowPageTitle from './WorkflowPageTitle.vue'
import WorkflowPlatformChannelPicker from './WorkflowPlatformChannelPicker.vue'
import WorkflowSectionTitle from './WorkflowSectionTitle.vue'

const uiStore = useUIStore()
const { workflowCreatorId, workflowDistributionPlatform } = storeToRefs(uiStore)
const { setWorkflowAppPage } = uiStore

const creator = computed(() => getWorkflowCreator(workflowCreatorId.value))

const strategy = computed(() =>
  getDistributionStrategy(workflowCreatorId.value, workflowDistributionPlatform.value),
)

const growth = computed(() =>
  getPlatformGrowthSnapshot(workflowCreatorId.value, workflowDistributionPlatform.value),
)

const platformLabel = computed(() => {
  if (workflowDistributionPlatform.value === `x`)
    return `X`
  return getPlatformProfileTitle(workflowDistributionPlatform.value)
})

function goPlatformMatrix() {
  setWorkflowAppPage(`matrix`)
}

function openFullMatrix() {
  window.open(creatorPlatformMatrixRoute(workflowCreatorId.value), `_blank`, `noopener,noreferrer`)
}

function goContentSync() {
  setWorkflowAppPage(`sync`)
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
        在平台矩阵梳理账号后，按创作者与渠道切换宣发策略；当前
        <span class="font-mono text-foreground">{{ workflowCreatorId }}</span>
        ·
        <span class="font-medium text-foreground">{{ platformLabel }}</span>
      </p>
      <div class="mt-3 space-y-3">
        <WorkflowCreatorPicker />
        <WorkflowPlatformChannelPicker />
      </div>
    </template>

    <div v-if="creator" class="space-y-5 pb-4">
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

      <section class="grid gap-4 md:grid-cols-2">
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
        <ol class="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
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
        <Button variant="outline" size="sm" @click="goPlatformMatrix">
          上一步：平台矩阵
        </Button>
        <Button variant="ghost" size="sm" class="text-muted-foreground" @click="goContentSync">
          内容同步
        </Button>
        <Button variant="outline" size="sm" @click="openFullMatrix">
          完整矩阵
          <ExternalLink class="ml-1.5 h-3.5 w-3.5" />
        </Button>
      </section>
    </div>

    <p v-else class="pb-4 text-sm text-muted-foreground">
      请先选择有效创作者 ID。
    </p>
  </WorkflowPageShell>
</template>
