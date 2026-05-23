<script setup lang="ts">
import { ArrowLeft, ArrowRight, Check, ExternalLink, Minus, Sparkles, X } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { getCreatorOffer } from '@/constants/creatorOffer'
import { useUIStore } from '@/stores/ui'
import { CREATOR_CARD_HASH } from '@/utils/creatorRoutes'
import { getPlatformProfileTitle } from '@/utils/socialAccounts'

const props = defineProps<{
  creatorId: string
}>()

const router = useRouter()
const uiStore = useUIStore()

const SERVICE_ACCENT: Record<string, string> = {
  lite: `border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-900/40`,
  standard: `border-primary/40 bg-primary/[0.06] shadow-md ring-1 ring-primary/25 dark:bg-primary/10`,
  growth: `border-amber-200/80 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20`,
}

const offer = computed(() => getCreatorOffer(props.creatorId))

const homepageLabel = computed(() => {
  const url = offer.value?.homepage
  if (!url)
    return ``
  try {
    return new URL(url).hostname.replace(/^www\./, ``)
  }
  catch {
    return url
  }
})

watch(offer, (value) => {
  if (value)
    document.title = value.pageTitle
}, { immediate: true })

function goPlatformMatrix() {
  // 让 /matrix 用 creator-offer 页的 creatorId 加载,而不是上次缓存的
  uiStore.setWorkflowCreatorId(props.creatorId)
  router.push({ name: `matrix` })
}

function openHomepage() {
  const url = offer.value?.homepage
  if (url)
    window.open(url, `_blank`, `noopener,noreferrer`)
}

onMounted(() => {
  if (window.location.hash.replace(/^#/, ``) === CREATOR_CARD_HASH) {
    nextTick(() => {
      document.getElementById(CREATOR_CARD_HASH)?.scrollIntoView({ block: `start` })
    })
  }
})
</script>

<template>
  <main
    v-if="offer"
    :id="CREATOR_CARD_HASH"
    class="min-h-[100dvh] overflow-y-auto bg-[#e8eaef] text-foreground dark:bg-[#0c0f14]"
  >
    <div class="mx-auto max-w-6xl px-3 py-3 sm:px-5 sm:py-4">
      <!-- 顶栏 -->
      <nav class="mb-3 flex shrink-0 items-center justify-between gap-2">
        <Button variant="ghost" size="sm" class="h-8 text-muted-foreground" @click="goPlatformMatrix">
          <ArrowLeft class="mr-1.5 h-4 w-4" />
          平台矩阵
        </Button>
        <span class="font-mono text-[11px] text-muted-foreground">{{ offer.id }} · 创作名片</span>
      </nav>

      <!-- Hero：视觉重心 -->
      <header class="creator-offer-hero relative shrink-0 overflow-hidden rounded-2xl px-5 py-6 text-white shadow-lg sm:px-8 sm:py-7">
        <div class="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div class="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-emerald-400/20 blur-3xl" />

        <div class="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div class="max-w-xl">
            <p class="text-xs font-medium tracking-widest text-white/70 uppercase">
              {{ offer.subheadline }}
            </p>
            <h1 class="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
              {{ offer.headline }}
            </h1>
            <p class="mt-2 text-sm leading-relaxed text-white/80">
              {{ offer.tagline }}
            </p>
          </div>

          <div class="flex flex-wrap gap-6 lg:justify-end">
            <div>
              <p class="text-[11px] tracking-wide text-white/60 uppercase">
                粉丝（约）
              </p>
              <p class="mt-0.5 text-3xl font-semibold tabular-nums tracking-tight">
                {{ offer.reachSummary.followers }}
              </p>
            </div>
            <div>
              <p class="text-[11px] tracking-wide text-white/60 uppercase">
                阅读（约）
              </p>
              <p class="mt-0.5 text-3xl font-semibold tabular-nums tracking-tight">
                {{ offer.reachSummary.reads }}
              </p>
            </div>
          </div>
        </div>

        <div class="relative mt-5 flex flex-wrap gap-2">
          <Button class="bg-white text-slate-900 hover:bg-white/90" @click="openHomepage">
            预约合作
            <ExternalLink class="ml-2 h-4 w-4" />
          </Button>
          <Button variant="secondary" class="border-0 bg-white/15 text-white hover:bg-white/25" @click="goPlatformMatrix">
            查看平台矩阵
            <ArrowRight class="ml-2 h-4 w-4" />
          </Button>
        </div>
        <p class="relative mt-3 text-[11px] text-white/55">
          个人快照口径 · {{ offer.reachSummary.platformCount }} 个展示平台 · 同步能力 {{ offer.reachSummary.syncCapability }} 平台
        </p>
      </header>

      <!-- 服务档位：三卡（主内容区） -->
      <section class="mt-4 shrink-0">
        <div class="mb-2 flex items-center gap-2">
          <Sparkles class="h-4 w-4 text-primary" />
          <h2 class="text-sm font-semibold">
            服务档位
          </h2>
          <span class="text-xs text-muted-foreground">{{ offer.displayName }}本人交付</span>
        </div>

        <div class="grid gap-3 md:grid-cols-3">
          <article
            v-for="service in offer.services"
            :key="service.id"
            class="flex flex-col rounded-xl border p-4 transition-shadow"
            :class="SERVICE_ACCENT[service.id]"
          >
            <div v-if="service.id === 'standard'" class="mb-2 inline-flex w-fit items-center rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
              推荐
            </div>
            <h3 class="text-sm font-semibold leading-snug">
              {{ service.name }}
            </h3>
            <p class="mt-1 text-xs text-muted-foreground">
              {{ service.timeline }}
            </p>
            <p class="mt-2 flex-1 text-xs leading-relaxed text-muted-foreground">
              {{ service.summary }}
            </p>
            <ul class="mt-3 space-y-1 border-t border-border/60 pt-3 text-xs text-foreground/90">
              <li v-for="item in service.deliverables" :key="item" class="flex gap-1.5">
                <Check class="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                <span>{{ item }}</span>
              </li>
            </ul>
            <p class="mt-3 rounded-md bg-background/60 px-2 py-1.5 text-[11px] leading-snug text-muted-foreground dark:bg-background/30">
              适合：{{ service.fit }}
            </p>
          </article>
        </div>
      </section>

      <!-- 次级信息：两列 -->
      <div class="mt-4 grid min-h-0 flex-1 gap-3 lg:grid-cols-5">
        <!-- 平台链接 -->
        <section class="rounded-xl border border-border/80 bg-background p-4 shadow-sm dark:bg-card lg:col-span-2">
          <h2 class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            内容平台
          </h2>
          <div class="mt-3 grid grid-cols-[minmax(0,1fr)_4.5rem_4.5rem] gap-x-2 gap-y-1.5">
            <span />
            <span class="text-right text-[10px] font-medium text-muted-foreground">粉丝</span>
            <span class="text-right text-[10px] font-medium text-muted-foreground">阅读</span>
            <template v-for="row in offer.platformMatrix" :key="row.type">
              <a
                :href="row.url"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex min-w-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                {{ getPlatformProfileTitle(row.type) }}
                <ExternalLink class="h-3 w-3 shrink-0 opacity-60" />
              </a>
              <span class="text-right text-[11px] tabular-nums text-muted-foreground">{{ row.followers }}</span>
              <span class="text-right text-[11px] tabular-nums text-muted-foreground">{{ row.reads }}</span>
            </template>
          </div>
        </section>

        <!-- ROI + 合作 -->
        <section class="rounded-xl border border-border/80 bg-background p-4 shadow-sm dark:bg-card lg:col-span-3">
          <div class="grid gap-4 sm:grid-cols-2">
            <div>
              <h2 class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                转化示意
              </h2>
              <div class="mt-2 space-y-1.5 text-xs">
                <p class="text-[10px] leading-snug text-muted-foreground">
                  曝光示意基数（单篇合作粗算）
                </p>
                <div
                  v-for="item in offer.funnel.exposureBasis"
                  :key="item.label"
                  class="rounded-lg bg-muted/50 px-2.5 py-1.5"
                >
                  <div class="flex items-baseline justify-between gap-2">
                    <span class="text-muted-foreground">{{ item.label }}</span>
                    <span class="shrink-0 font-medium tabular-nums">{{ item.value }}</span>
                  </div>
                  <p v-if="item.note" class="mt-0.5 text-[10px] leading-snug text-muted-foreground/80">
                    {{ item.note }}
                  </p>
                </div>
                <div class="flex items-center justify-center text-[10px] text-muted-foreground">
                  ↓ CTR {{ offer.funnel.ctrRange }}
                </div>
                <div class="flex items-center justify-center text-[10px] text-muted-foreground">
                  ↓ 留资 {{ offer.funnel.leadRateRange }} · 成交 {{ offer.funnel.closeRateRange }}
                </div>
                <p class="rounded-md bg-muted/30 px-2 py-1.5 font-mono text-[10px] leading-snug text-muted-foreground">
                  ROI = (线索×成交率×客单价−合作费) / 合作费
                </p>
              </div>
            </div>
            <div>
              <h2 class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                合作模式
              </h2>
              <ul class="mt-2 space-y-2 text-xs">
                <li v-for="mode in offer.modes" :key="mode.name">
                  <span class="font-medium">{{ mode.name }}</span>
                  <span class="text-muted-foreground"> — {{ mode.desc }}</span>
                </li>
              </ul>
              <p class="mt-2 text-[10px] leading-relaxed text-muted-foreground">
                {{ offer.workflow.join(' → ') }}
              </p>
            </div>
          </div>

          <div class="mt-4 border-t border-border/60 pt-3">
            <h2 class="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              品牌适配
            </h2>
            <div class="mt-2 grid gap-2 sm:grid-cols-3">
              <div class="rounded-lg bg-emerald-500/10 px-2.5 py-2">
                <p class="flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                  <Check class="h-3 w-3" /> 更适合
                </p>
                <ul class="mt-1 space-y-0.5 text-[11px] leading-snug text-muted-foreground">
                  <li v-for="item in offer.brandFit.good" :key="item">
                    {{ item }}
                  </li>
                </ul>
              </div>
              <div class="rounded-lg bg-amber-500/10 px-2.5 py-2">
                <p class="flex items-center gap-1 text-[11px] font-medium text-amber-800 dark:text-amber-400">
                  <Minus class="h-3 w-3" /> 需谨慎
                </p>
                <ul class="mt-1 space-y-0.5 text-[11px] leading-snug text-muted-foreground">
                  <li v-for="item in offer.brandFit.caution" :key="item">
                    {{ item }}
                  </li>
                </ul>
              </div>
              <div class="rounded-lg bg-red-500/10 px-2.5 py-2">
                <p class="flex items-center gap-1 text-[11px] font-medium text-red-700 dark:text-red-400">
                  <X class="h-3 w-3" /> 不适合
                </p>
                <ul class="mt-1 space-y-0.5 text-[11px] leading-snug text-muted-foreground">
                  <li v-for="item in offer.brandFit.bad" :key="item">
                    {{ item }}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>

      <footer class="mt-3 shrink-0 text-center text-[10px] text-muted-foreground">
        {{ offer.contactHint }} ·
        <button v-if="homepageLabel" type="button" class="text-primary hover:underline" @click="openHomepage">
          {{ homepageLabel }}
        </button>
      </footer>
    </div>
  </main>

  <main v-else class="flex min-h-[100dvh] items-center justify-center bg-background px-4">
    <div class="max-w-md text-center">
      <h1 class="text-xl font-semibold">
        未找到该创作者
      </h1>
      <p class="mt-2 text-sm text-muted-foreground">
        暂无 <span class="font-mono">{{ creatorId }}</span> 的创作名片数据。
      </p>
      <Button class="mt-4" variant="outline" @click="goPlatformMatrix">
        返回平台矩阵
      </Button>
    </div>
  </main>
</template>

<style scoped>
.creator-offer-hero {
  background: linear-gradient(135deg, #1a2332 0%, #243044 45%, #1e3a2f 100%);
}

.dark .creator-offer-hero {
  background: linear-gradient(135deg, #0f1419 0%, #1a2433 50%, #142820 100%);
}
</style>
