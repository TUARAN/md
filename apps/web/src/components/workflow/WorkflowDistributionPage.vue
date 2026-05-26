<script setup lang="ts">
/**
 * WorkflowDistributionPage —— workflow 第 4 步「宣发活跃」
 *
 * 2026-05 合并: 把原 /matrix「平台矩阵」并入本页, 左右分栏:
 *  - 左列  : `<CreatorProfileBody>` 平台账号矩阵 + 数据来源说明 + 创作者切换
 *  - 右列  : 当前选中平台的宣发策略 (打法要点 / 近期动作 / 粉丝阶梯), sticky
 * 移动端  : 上下纵向铺叠, 右列在下
 * 选择行为: 点击左列卡片直接更新 `ui.workflowDistributionPlatform`,
 *           右列实时刷新, 不再跨页跳转
 */
import { Megaphone, Target } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import CreatorProfileBody from '@/components/creator-profile/CreatorProfileBody.vue'
import { Button } from '@/components/ui/button'
import { getWorkflowCreator } from '@/constants/creators'
import { FAN_GROWTH_MILESTONES } from '@/constants/distributionFocus'
import {
  getDistributionStrategy,
  getPlatformGrowthSnapshot,
} from '@/constants/distributionStrategies'
import { useUIStore } from '@/stores/ui'
import { getPlatformProfileTitle } from '@/utils/socialAccounts'
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

const creator = computed(() => getWorkflowCreator(workflowCreatorId.value))

const strategy = computed(() =>
  getDistributionStrategy(workflowCreatorId.value, workflowDistributionPlatform.value),
)

const growth = computed(() =>
  getPlatformGrowthSnapshot(workflowCreatorId.value, workflowDistributionPlatform.value),
)

const platformLabel = computed(() => getPlatformProfileTitle(workflowDistributionPlatform.value))

function onSelectDistribution(platformType: string) {
  setWorkflowDistributionPlatform(platformType)
}

function goContentSync() {
  router.push({ name: `sync` })
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
        左侧梳理平台矩阵, 点任意账号卡即可在右侧切换当前
        <span class="font-mono text-foreground">{{ workflowCreatorId }}</span>
        ·
        <span class="font-medium text-foreground">{{ platformLabel }}</span>
        的策略。
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
            并登录目标平台后，于本页点「重新检测账号」(空状态下出现),扩展会把主页/粉丝/阅读写入本地缓存。
          </p>
          <p>
            <span class="font-medium text-foreground">限制与兜底：</span>
            部分平台无法统计全量阅读、或主页/个人中心难以稳定抓取，此时仅显示已缓存字段。
          </p>
          <p>
            <span class="font-medium text-foreground">创作者 ID：</span>
            默认维护 <span class="font-mono text-foreground">tuaran</span> (安东尼)。其他创作者通过
            <code class="rounded bg-muted px-1 py-px text-[10px]">socialAccounts.ts</code>
            /
            <code class="rounded bg-muted px-1 py-px text-[10px]">creatorOffer/</code>
            PR 接入。
            <a
              href="https://github.com/TUARAN/md/blob/main/docs/creator-profile-urls.md"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary hover:underline"
            >详见文档</a>
          </p>
        </div>
      </details>
      <div class="mt-3">
        <WorkflowCreatorPicker />
      </div>
    </template>

    <div v-if="creator" class="flex flex-col gap-5 pb-4 lg:grid lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-start lg:gap-6">
      <!-- 左列: 平台矩阵 -->
      <div class="min-w-0">
        <CreatorProfileBody
          :enable-workflow-actions="true"
          :show-stats="false"
          :show-all-platforms="true"
          @select-distribution="onSelectDistribution"
        />
      </div>

      <!-- 右列: 单平台宣发策略 (sticky on lg) -->
      <aside class="min-w-0 space-y-4 lg:sticky lg:top-3">
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
      </aside>
    </div>

    <p v-else class="pb-4 text-sm text-muted-foreground">
      请先选择有效创作者 ID。
    </p>
  </WorkflowPageShell>
</template>
