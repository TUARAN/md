<script setup lang="ts">
/**
 * WorkflowDistributionPage —— workflow「数据策略」
 *
 * 左侧为可折叠平台侧栏，右侧显示当前平台策略。小红书的风格化二创
 * 生产入口在「AI 创作」，本页只保留平台策略与跳转入口。
 */
import { ChevronLeft, ChevronRight, Copy, ExternalLink, Eye, IdCard, Megaphone, Target } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { PanelShell } from '@/components/ui/layout'
import { useWorkflowCreatorContext } from '@/composables/useWorkflowCreatorContext'
import { FAN_GROWTH_MILESTONES } from '@/constants/distributionFocus'
import {
  getDistributionStrategy,
  getPlatformGrowthSnapshot,
  listDistributionPlatformTypes,
} from '@/constants/distributionStrategies'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import { copyPlain } from '@/utils/clipboard'
import { creatorCardRoute } from '@/utils/creatorRoutes'
import { getPlatformProfileTitle } from '@/utils/socialAccounts'
import { toast } from '@/utils/toast'
import IPReachTool from './IPReachTool.vue'
import WorkflowCreatorPicker from './WorkflowCreatorPicker.vue'
import WorkflowPageShell from './WorkflowPageShell.vue'
import WorkflowPageTitle from './WorkflowPageTitle.vue'
import WorkflowSectionTitle from './WorkflowSectionTitle.vue'

const uiStore = useUIStore()
const authStore = useAuthStore()
const {
  activeCreatorId,
  offer: creatorOffer,
  creators,
  platformMatrix,
  creatorProfile,
} = useWorkflowCreatorContext()
const {
  workflowDistributionPlatform,
  workflowMatrixDataSourceExpanded,
} = storeToRefs(uiStore)
const { setWorkflowDistributionPlatform } = uiStore
const router = useRouter()

const isPlatformRailCollapsed = ref(false)
const distributionModule = ref<`strategy` | `ipReach`>(`strategy`)

const creator = computed(() => creators.value[0] ?? null)

const platformRows = computed(() => {
  const matrix = platformMatrix.value
  const byType = new Map(matrix.map(row => [row.type, row]))
  return listDistributionPlatformTypes(activeCreatorId.value, matrix.map(row => row.type))
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

const selectedPlatformRow = computed(() =>
  platformRows.value.find(row => row.type === workflowDistributionPlatform.value) ?? null,
)

const strategy = computed(() =>
  getDistributionStrategy(activeCreatorId.value, workflowDistributionPlatform.value),
)

const growth = computed(() =>
  getPlatformGrowthSnapshot(
    activeCreatorId.value,
    workflowDistributionPlatform.value,
    selectedPlatformRow.value,
  ),
)

const platformLabel = computed(() => getPlatformProfileTitle(workflowDistributionPlatform.value))
const isXiaohongshuSelected = computed(() => workflowDistributionPlatform.value === `xiaohongshu`)
const creatorCardSharePath = computed(() => {
  if (creatorProfile.brandShareRoutePath)
    return creatorProfile.brandShareRoutePath
  return creatorCardRoute(activeCreatorId.value)
})
const creatorCardShareUrl = computed(() => {
  if (creatorProfile.brandShareUrl)
    return creatorProfile.brandShareUrl
  if (typeof window === `undefined`)
    return creatorCardSharePath.value
  return new URL(creatorCardSharePath.value, window.location.origin).toString()
})
const creatorCardCopy = computed(() => {
  const offer = creatorOffer.value
  if (!creator.value || !offer)
    return ``

  return [
    `${creator.value.displayName} · 创作名片`,
    offer.tagline,
    `全平台粉丝 ${offer.reachSummary.followers}，历史阅读 ${offer.reachSummary.reads}，覆盖 ${offer.reachSummary.platformCount} 个主要内容平台。`,
    `适合：${offer.brandFit.good.slice(0, 3).join(` / `)}`,
    `合作入口：${creatorCardShareUrl.value}`,
  ].join(`\n`)
})
const checkinDone = ref<Record<string, boolean>>({})
const checkinSyncMode = ref<`local` | `d1`>(`local`)

function todayLocalDate(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, `0`)
  const day = String(d.getDate()).padStart(2, `0`)
  return `${year}-${month}-${day}`
}

const checkinDate = computed(() => todayLocalDate())

const checkinParams = computed(() => {
  const params = new URLSearchParams({
    creatorId: activeCreatorId.value,
    platformType: workflowDistributionPlatform.value,
    date: checkinDate.value,
  })
  return params.toString()
})

const checkinStorageKey = computed(() =>
  `workflow.distribution.checkin.${activeCreatorId.value}.${workflowDistributionPlatform.value}.${checkinDate.value}`,
)

const checkinItems = computed(() => strategy.value.growthPlan?.checkinItems ?? [])
const checkinProgress = computed(() => {
  const total = checkinItems.value.length
  if (!total)
    return { done: 0, total, percent: 0 }
  const done = checkinItems.value.filter(item => checkinDone.value[item.id]).length
  return { done, total, percent: Math.round((done / total) * 100) }
})

function loadLocalCheckinState() {
  if (typeof window === `undefined`) {
    checkinDone.value = {}
    return
  }
  try {
    const raw = window.localStorage.getItem(checkinStorageKey.value)
    checkinDone.value = raw ? JSON.parse(raw) : {}
  }
  catch {
    checkinDone.value = {}
  }
}

function saveLocalCheckinState() {
  if (typeof window === `undefined`)
    return
  window.localStorage.setItem(checkinStorageKey.value, JSON.stringify(checkinDone.value))
}

async function loadCheckinState() {
  if (!authStore.isAuthenticated) {
    checkinSyncMode.value = `local`
    loadLocalCheckinState()
    return
  }

  try {
    const res = await fetch(`/api/distribution/checkins?${checkinParams.value}`, {
      method: `GET`,
      credentials: `same-origin`,
      headers: { Accept: `application/json` },
    })
    if (!res.ok)
      throw new Error(`checkins ${res.status}`)
    const data = await res.json() as { checkins?: Record<string, boolean> }
    checkinDone.value = data.checkins ?? {}
    checkinSyncMode.value = `d1`
  }
  catch {
    checkinSyncMode.value = `local`
    loadLocalCheckinState()
  }
}

async function toggleCheckin(id: string) {
  const nextDone = !checkinDone.value[id]
  checkinDone.value = {
    ...checkinDone.value,
    [id]: nextDone,
  }

  if (authStore.isAuthenticated) {
    try {
      const res = await fetch(`/api/distribution/checkins?${checkinParams.value}`, {
        method: `PUT`,
        credentials: `same-origin`,
        headers: {
          'Accept': `application/json`,
          'Content-Type': `application/json`,
        },
        body: JSON.stringify({ itemId: id, done: nextDone }),
      })
      if (res.ok) {
        checkinSyncMode.value = `d1`
        return
      }
    }
    catch {}
  }

  checkinSyncMode.value = `local`
  saveLocalCheckinState()
}

watch(
  [checkinStorageKey, () => authStore.isAuthenticated],
  () => void loadCheckinState(),
  { immediate: true },
)

function onSelectDistribution(platformType: string) {
  setWorkflowDistributionPlatform(platformType)
}

function goContentSync() {
  router.push({ name: `sync` })
}

function goXiaohongshuCreation() {
  router.push({ name: `creation`, query: { mode: `xiaohongshu` } })
}

function requireAuthForCreatorCard(action: string) {
  if (!authStore.isAuthenticated) {
    toast.error(`登录后即可${action}`)
    authStore.startLogin()
    return false
  }
  if (!creatorOffer.value) {
    toast.error(`请先录入平台账号信息`)
    return false
  }
  return true
}

async function copyCreatorCardLink() {
  if (!requireAuthForCreatorCard(`复制分享链接`))
    return
  if (!creatorProfile.profile?.shareEnabled) {
    toast.error(`请先在设置 → 创作名片中开启品牌方分享`)
    return
  }
  try {
    await copyPlain(creatorCardShareUrl.value)
    toast.success(`品牌方分享链接已复制`)
  }
  catch {
    toast.error(`复制失败，请手动复制链接`)
  }
}

async function copyCreatorCardPitch() {
  if (!requireAuthForCreatorCard(`复制宣传文案`))
    return
  if (!creatorCardCopy.value)
    return
  try {
    await copyPlain(creatorCardCopy.value)
    toast.success(`宣传文案已复制`)
  }
  catch {
    toast.error(`复制失败，请手动复制文案`)
  }
}

function openCreatorCard() {
  if (!requireAuthForCreatorCard(`打开创作名片`))
    return
  window.open(creatorCardShareUrl.value, `_blank`, `noopener,noreferrer`)
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
        多平台发布
      </WorkflowPageTitle>
      <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
        围绕当前文章管理发布平台、账号动作、访问检测和复盘节奏；当前
        <span class="font-mono text-foreground">{{ activeCreatorId }}</span>
        ·
        <span class="font-medium text-foreground">{{ platformLabel }}</span>
        的分发动作会在下方展示。
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
            <span class="font-medium">SyncBlog 发布插件</span>
            并登录目标平台后，扩展会把主页 / 粉丝 / 阅读写入本地缓存。
          </p>
          <p>
            <span class="font-medium text-foreground">限制与兜底：</span>
            部分平台无法统计全量阅读，或主页 / 个人中心难以稳定抓取，此时仅显示已缓存字段。
          </p>
        </div>
      </details>
      <div v-if="authStore.isAuthenticated" class="mt-3">
        <WorkflowCreatorPicker />
      </div>
      <p
        v-else
        class="mt-3 rounded-lg border border-dashed border-border bg-muted/20 px-3 py-2 text-xs leading-relaxed text-muted-foreground"
      >
        登录后可创建并查看
        <strong class="text-foreground">你的创作名片</strong>
        与平台策略；站长预设标签仅绑定站长账号。
        <button type="button" class="ml-1 font-medium text-primary underline underline-offset-2" @click="authStore.startLogin()">
          登录 / 注册
        </button>
      </p>
      <section
        v-if="authStore.isAuthenticated && !creatorOffer"
        class="mt-3 rounded-xl border border-dashed border-primary/30 bg-primary/[0.04] px-3 py-3 text-sm dark:bg-primary/10"
      >
        <p class="font-medium">
          还没有创作名片
        </p>
        <p class="mt-1 text-xs leading-relaxed text-muted-foreground">
          在编辑器顶栏「发布」中检测到平台账号，或在设置 → 创作名片中手动录入，名片与平台矩阵会自动生成。
        </p>
        <div class="mt-2 flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" @click="router.push({ name: 'settings', hash: '#creator' })">
            前往设置
          </Button>
          <Button type="button" size="sm" @click="router.push({ name: 'sync' })">
            打开编辑器检测账号
          </Button>
        </div>
      </section>

      <section
        v-if="authStore.isAuthenticated && creator && creatorOffer"
        class="mt-3 rounded-xl border border-primary/20 bg-primary/[0.04] px-3 py-3 dark:bg-primary/10"
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex min-w-0 items-center gap-3">
            <div class="flex size-10 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-background/80 text-sm font-semibold text-primary">
              {{ creator.displayName.slice(0, 1) }}
            </div>
            <div class="min-w-0">
              <p class="flex items-center gap-1.5 text-xs font-medium text-primary">
                <IdCard class="h-3.5 w-3.5" />
                创作名片
              </p>
              <p class="mt-0.5 truncate text-sm font-semibold">
                {{ creatorOffer.pageTitle }}
              </p>
              <p class="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                {{ creatorOffer.tagline }}
              </p>
            </div>
          </div>
          <div class="grid w-full grid-cols-3 gap-2 text-xs sm:w-auto sm:min-w-[18rem]">
            <div class="rounded-lg border border-primary/15 bg-background/70 px-2.5 py-1.5">
              <p class="text-[10px] text-muted-foreground">
                粉丝
              </p>
              <p class="mt-0.5 font-semibold tabular-nums">
                {{ creatorOffer.reachSummary.followers }}
              </p>
            </div>
            <div class="rounded-lg border border-primary/15 bg-background/70 px-2.5 py-1.5">
              <p class="text-[10px] text-muted-foreground">
                阅读
              </p>
              <p class="mt-0.5 font-semibold tabular-nums">
                {{ creatorOffer.reachSummary.reads }}
              </p>
            </div>
            <div class="rounded-lg border border-primary/15 bg-background/70 px-2.5 py-1.5">
              <p class="text-[10px] text-muted-foreground">
                平台
              </p>
              <p class="mt-0.5 font-semibold tabular-nums">
                {{ creatorOffer.reachSummary.platformCount }}
              </p>
            </div>
          </div>
          <div class="flex shrink-0 flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" @click="copyCreatorCardPitch">
              <Copy class="mr-1.5 h-3.5 w-3.5" />
              复制文案
            </Button>
            <Button type="button" variant="outline" size="sm" @click="copyCreatorCardLink">
              <Copy class="mr-1.5 h-3.5 w-3.5" />
              复制分享链接
            </Button>
            <Button type="button" size="sm" @click="openCreatorCard">
              <ExternalLink class="mr-1.5 h-3.5 w-3.5" />
              {{ creatorProfile.profile?.shareEnabled ? '预览分享页' : '打开名片' }}
            </Button>
          </div>
        </div>
      </section>
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
              <span v-if="authStore.isAuthenticated" class="mt-0.5 block truncate text-[11px] text-muted-foreground">
                粉丝 {{ row.followers }} · 阅读 {{ row.reads }}
              </span>
              <span v-else class="mt-0.5 block truncate text-[11px] text-muted-foreground">
                登录后可见
              </span>
            </span>
          </button>
        </nav>
      </aside>

      <main class="min-w-0">
        <div class="mb-4 inline-flex rounded-lg border border-border/80 bg-white/80 p-1 dark:bg-card" aria-label="发布模块">
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
              <div v-if="growth.row && authStore.isAuthenticated" class="shrink-0 text-right text-sm">
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
            v-if="strategy.growthPlan"
            class="rounded-[18px] border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/40 dark:bg-amber-950/20"
          >
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="text-sm font-semibold text-amber-950 dark:text-amber-100">
                  {{ strategy.growthPlan.title }}
                </p>
                <p class="mt-1 text-xs leading-relaxed text-amber-900/75 dark:text-amber-100/70">
                  {{ strategy.growthPlan.rationale }}
                </p>
              </div>
              <div class="shrink-0 rounded-xl border border-amber-300/70 bg-white/70 px-3 py-2 text-right dark:border-amber-800/70 dark:bg-background/30">
                <p class="text-[11px] text-amber-900/70 dark:text-amber-100/65">
                  目标
                </p>
                <p class="mt-0.5 text-base font-semibold tabular-nums text-amber-950 dark:text-amber-100">
                  {{ strategy.growthPlan.target }}
                </p>
              </div>
            </div>

            <p class="mt-3 rounded-xl border border-amber-200/80 bg-white/60 px-3 py-2 text-xs leading-relaxed text-amber-900/80 dark:border-amber-900/50 dark:bg-background/25 dark:text-amber-100/75">
              {{ strategy.growthPlan.estimate }}
            </p>

            <div class="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <div
                v-for="item in strategy.growthPlan.dailyScore"
                :key="item.label"
                class="rounded-xl border border-amber-200/80 bg-white/70 p-3 dark:border-amber-900/50 dark:bg-background/25"
              >
                <p class="text-[11px] font-medium text-amber-900/70 dark:text-amber-100/65">
                  {{ item.label }}
                </p>
                <p class="mt-1 text-lg font-semibold tabular-nums text-amber-950 dark:text-amber-100">
                  {{ item.value }}
                </p>
                <p class="mt-1 text-[11px] leading-snug text-amber-900/70 dark:text-amber-100/65">
                  {{ item.detail }}
                </p>
              </div>
            </div>

            <div class="mt-3 grid gap-3 lg:grid-cols-2">
              <div>
                <p class="text-xs font-semibold text-amber-950 dark:text-amber-100">
                  每日打卡
                </p>
                <ul class="mt-2 space-y-1.5 text-xs leading-relaxed text-amber-900/75 dark:text-amber-100/70">
                  <li v-for="item in strategy.growthPlan.checklist" :key="item" class="flex gap-1.5">
                    <span>·</span>
                    <span>{{ item }}</span>
                  </li>
                </ul>
              </div>
              <div>
                <p class="text-xs font-semibold text-amber-950 dark:text-amber-100">
                  合规边界
                </p>
                <ul class="mt-2 space-y-1.5 text-xs leading-relaxed text-amber-900/75 dark:text-amber-100/70">
                  <li v-for="item in strategy.growthPlan.guardrails" :key="item" class="flex gap-1.5">
                    <span>·</span>
                    <span>{{ item }}</span>
                  </li>
                </ul>
              </div>
            </div>

            <div v-if="checkinItems.length" class="mt-4 rounded-xl border border-amber-200/80 bg-white/65 p-3 dark:border-amber-900/50 dark:bg-background/25">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <p class="text-xs font-semibold text-amber-950 dark:text-amber-100">
                  今日执行打卡
                </p>
                <p class="text-[11px] tabular-nums text-amber-900/70 dark:text-amber-100/65">
                  {{ checkinProgress.done }} / {{ checkinProgress.total }} · {{ checkinProgress.percent }}%
                  · {{ checkinSyncMode === 'd1' ? '已同步 D1' : '本地保存' }}
                </p>
              </div>
              <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-amber-200/70 dark:bg-amber-900/50">
                <div
                  class="h-full rounded-full bg-amber-500 transition-all"
                  :style="{ width: `${checkinProgress.percent}%` }"
                />
              </div>
              <div class="mt-3 grid gap-2">
                <button
                  v-for="item in checkinItems"
                  :key="item.id"
                  type="button"
                  class="flex w-full items-start gap-2 rounded-lg border px-3 py-2 text-left transition-colors"
                  :class="checkinDone[item.id]
                    ? 'border-amber-300 bg-amber-100/70 text-amber-950 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-50'
                    : 'border-amber-200/80 bg-white/70 text-amber-950 hover:border-amber-300 dark:border-amber-900/50 dark:bg-background/20 dark:text-amber-100'"
                  @click="toggleCheckin(item.id)"
                >
                  <span
                    class="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px] font-semibold"
                    :class="checkinDone[item.id]
                      ? 'border-amber-600 bg-amber-500 text-white'
                      : 'border-amber-400/80 bg-white/60 text-transparent dark:bg-background/30'"
                  >
                    ✓
                  </span>
                  <span class="min-w-0">
                    <span class="block text-xs font-medium">{{ item.label }}</span>
                    <span class="mt-0.5 block text-[11px] leading-snug text-amber-900/70 dark:text-amber-100/65">
                      {{ item.detail }}
                    </span>
                  </span>
                </button>
              </div>
            </div>
          </section>

          <section
            v-if="isXiaohongshuSelected"
            class="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-rose-200 bg-rose-50/70 p-4 text-sm dark:border-rose-900/40 dark:bg-rose-950/20"
          >
            <div class="min-w-0">
              <p class="font-semibold text-rose-950 dark:text-rose-100">
                小红书内容生产放在 AI 创作
              </p>
              <p class="mt-1 text-xs leading-relaxed text-rose-900/75 dark:text-rose-100/70">
                当前页保留平台节奏、打法和复盘；小红书风格提示词生成与 Markdown 成稿到「AI 创作 · 小红书风格」完成。
              </p>
            </div>
            <Button type="button" size="sm" class="shrink-0" @click="goXiaohongshuCreation">
              去生成小红书风格
            </Button>
          </section>

          <section class="grid gap-4 sm:grid-cols-2">
            <PanelShell tone="neutral" radius="md" padding="md" flat class="sm:col-span-2">
              <WorkflowSectionTitle>
                平台 Tips
              </WorkflowSectionTitle>
              <ul class="mt-2 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
                <li v-for="item in strategy.tips" :key="item" class="flex gap-1.5">
                  <span class="text-primary">·</span>
                  <span>{{ item }}</span>
                </li>
              </ul>
            </PanelShell>
            <PanelShell tone="neutral" radius="md" padding="md" flat>
              <WorkflowSectionTitle>
                打法要点
              </WorkflowSectionTitle>
              <ul class="mt-2 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
                <li v-for="item in strategy.tactics" :key="item" class="flex gap-1.5">
                  <span class="text-primary">·</span>
                  <span>{{ item }}</span>
                </li>
              </ul>
            </PanelShell>
            <PanelShell tone="neutral" radius="md" padding="md" flat>
              <WorkflowSectionTitle>
                近期动作
              </WorkflowSectionTitle>
              <ul class="mt-2 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
                <li v-for="item in strategy.nextActions" :key="item" class="flex gap-1.5">
                  <span class="text-primary">→</span>
                  <span>{{ item }}</span>
                </li>
              </ul>
            </PanelShell>
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
              上一步：排版预览
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
