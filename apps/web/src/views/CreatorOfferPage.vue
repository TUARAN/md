<script setup lang="ts">
import { ArrowLeft, ArrowRight, Check, ExternalLink, Minus, X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { getCreatorOffer } from '@/constants/creatorOffer'
import { SOCIAL_ACCOUNTS_ROUTE } from '@/stores/socialAccounts'
import { creatorOfferRoute } from '@/utils/creatorRoutes'

const props = defineProps<{
  creatorId: string
}>()

const offer = computed(() => getCreatorOffer(props.creatorId))

onMounted(() => {
  if (offer.value)
    document.title = offer.value.pageTitle
})

function goProfile() {
  window.location.href = SOCIAL_ACCOUNTS_ROUTE
}

function openHomepage() {
  const url = offer.value?.homepage
  if (url)
    window.open(url, `_blank`, `noopener,noreferrer`)
}
</script>

<template>
  <main v-if="offer" class="min-h-screen bg-[#f6f7f8] text-foreground dark:bg-background">
    <div class="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-6 md:px-6 md:py-10">
      <header class="border-b border-border/70 pb-6">
        <div class="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Button variant="ghost" size="sm" class="-ml-3" @click="goProfile">
            <ArrowLeft class="mr-2 h-4 w-4" />
            创作名片
          </Button>
          <span class="rounded-md bg-muted px-2 py-0.5 font-mono text-xs">ID: {{ offer.id }}</span>
        </div>
        <p class="mt-4 text-sm font-medium text-primary">
          {{ offer.subheadline }}
        </p>
        <h1 class="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
          {{ offer.headline }}
        </h1>
        <p class="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
          {{ offer.tagline }}
        </p>
        <div class="mt-6 flex flex-wrap gap-2">
          <Button @click="openHomepage">
            预约 / 联系合作
            <ExternalLink class="ml-2 h-4 w-4" />
          </Button>
          <Button variant="outline" @click="goProfile">
            查看我的平台矩阵
            <ArrowRight class="ml-2 h-4 w-4" />
          </Button>
        </div>
        <p class="mt-4 text-xs text-muted-foreground">
          {{ offer.contactHint }}
        </p>
      </header>

      <section class="border-b border-border/70 py-8">
        <h2 class="text-lg font-semibold">
          我的内容触达（约）
        </h2>
        <p class="mt-1 text-sm text-muted-foreground">
          以下为个人账号快照口径，供评估合作量级；非联盟数据，不作效果承诺。
        </p>
        <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div
            v-for="item in [
              { label: '粉丝合计', value: offer.reachSummary.followers },
              { label: '阅读合计', value: offer.reachSummary.reads },
              { label: '名片展示平台', value: `${offer.reachSummary.platformCount} 个` },
              { label: '同步能力（工具）', value: `${offer.reachSummary.syncCapability} 平台` },
            ]"
            :key="item.label"
            class="rounded-lg border border-border bg-background px-4 py-3 dark:bg-card"
          >
            <p class="text-xs text-muted-foreground">
              {{ item.label }}
            </p>
            <p class="mt-1 text-xl font-semibold tabular-nums">
              {{ item.value }}
            </p>
          </div>
        </div>
        <p class="mt-4 text-xs leading-relaxed text-muted-foreground">
          {{ offer.dataFootnote }}
        </p>
      </section>

      <section class="border-b border-border/70 py-8">
        <h2 class="text-lg font-semibold">
          我能提供什么
        </h2>
        <p class="mt-1 text-sm text-muted-foreground">
          由安东尼本人交付的内容与引流相关服务（非博主联盟统一接单）。
        </p>
        <div class="mt-5 space-y-4">
          <article
            v-for="service in offer.services"
            :key="service.id"
            class="rounded-xl border border-border bg-background p-5 dark:bg-card"
          >
            <h3 class="font-semibold">
              {{ service.name }}
            </h3>
            <p class="mt-2 text-sm text-muted-foreground">
              {{ service.summary }}
            </p>
            <ul class="mt-3 space-y-1.5 text-sm">
              <li v-for="item in service.deliverables" :key="item" class="flex gap-2">
                <Check class="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{{ item }}</span>
              </li>
            </ul>
            <p class="mt-3 text-xs text-muted-foreground">
              周期：{{ service.timeline }} · 适合：{{ service.fit }}
            </p>
          </article>
        </div>
      </section>

      <section class="border-b border-border/70 py-8">
        <h2 class="text-lg font-semibold">
          流量 → 转化 → ROI（示意）
        </h2>
        <p class="mt-1 text-sm text-muted-foreground">
          在约定假设下粗算合作是否划算；实际结果取决于产品与落地页。
        </p>
        <div class="mt-4 rounded-xl border border-border bg-background p-5 font-mono text-sm leading-relaxed dark:bg-card">
          <p>{{ offer.funnel.exposureLabel }}：{{ offer.funnel.exposureValue }}</p>
          <p class="mt-2 text-muted-foreground">
            ↓ CTR 假设 {{ offer.funnel.ctrRange }}
          </p>
          <p class="text-muted-foreground">
            ↓ 留资率假设 {{ offer.funnel.leadRateRange }}
          </p>
          <p class="text-muted-foreground">
            ↓ 成交率假设 {{ offer.funnel.closeRateRange }}
          </p>
          <p class="mt-2">
            ROI = (线索 × 成交率 × 客单价 − 合作费) / 合作费
          </p>
        </div>
        <p class="mt-3 text-xs leading-relaxed text-muted-foreground">
          {{ offer.funnel.disclaimer }}
        </p>
      </section>

      <section class="border-b border-border/70 py-8">
        <h2 class="text-lg font-semibold">
          合作模式与流程
        </h2>
        <div class="mt-4 grid gap-4 md:grid-cols-2">
          <div
            v-for="mode in offer.modes"
            :key="mode.name"
            class="rounded-lg border border-border bg-background px-4 py-3 dark:bg-card"
          >
            <p class="font-medium">
              {{ mode.name }}
            </p>
            <p class="mt-1 text-sm text-muted-foreground">
              {{ mode.desc }}
            </p>
          </div>
        </div>
        <ol class="mt-5 list-decimal space-y-2 pl-5 text-sm">
          <li v-for="step in offer.workflow" :key="step">
            {{ step }}
          </li>
        </ol>
      </section>

      <section class="border-b border-border/70 py-8">
        <h2 class="text-lg font-semibold">
          适合哪些品牌推文
        </h2>
        <div class="mt-4 space-y-4">
          <div>
            <p class="flex items-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-400">
              <Check class="h-4 w-4" /> 更适合
            </p>
            <ul class="mt-2 space-y-1 text-sm text-muted-foreground">
              <li v-for="item in offer.brandFit.good" :key="item">
                · {{ item }}
              </li>
            </ul>
          </div>
          <div>
            <p class="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400">
              <Minus class="h-4 w-4" /> 需谨慎
            </p>
            <ul class="mt-2 space-y-1 text-sm text-muted-foreground">
              <li v-for="item in offer.brandFit.caution" :key="item">
                · {{ item }}
              </li>
            </ul>
          </div>
          <div>
            <p class="flex items-center gap-2 text-sm font-medium text-red-700 dark:text-red-400">
              <X class="h-4 w-4" /> 不适合
            </p>
            <ul class="mt-2 space-y-1 text-sm text-muted-foreground">
              <li v-for="item in offer.brandFit.bad" :key="item">
                · {{ item }}
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section class="py-8">
        <h2 class="text-lg font-semibold">
          平台矩阵（个人主页）
        </h2>
        <p class="mt-1 text-sm text-muted-foreground">
          快照中的粉丝 / 阅读；扩展检测或缓存有值时，名片页优先展示实时数据。
        </p>
        <div class="mt-4 overflow-x-auto rounded-lg border border-border">
          <table class="w-full min-w-[520px] text-left text-sm">
            <thead class="border-b border-border bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th class="px-3 py-2 font-medium">
                  平台
                </th>
                <th class="px-3 py-2 font-medium">
                  粉丝
                </th>
                <th class="px-3 py-2 font-medium">
                  阅读
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in offer.platformMatrix"
                :key="row.type"
                class="border-b border-border/60 last:border-0"
              >
                <td class="px-3 py-2 font-mono text-xs">
                  {{ row.type }}
                </td>
                <td class="px-3 py-2 tabular-nums">
                  {{ row.followers }}
                </td>
                <td class="px-3 py-2 tabular-nums">
                  {{ row.reads }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <footer class="border-t border-border/70 pt-6 text-center text-sm text-muted-foreground">
        <p>
          个人 IP 合作说明 ·
          <span class="font-mono">{{ creatorOfferRoute(offer.id) }}</span>
        </p>
        <Button class="mt-4" variant="outline" @click="openHomepage">
          前往 tuaran.me
        </Button>
      </footer>
    </div>
  </main>

  <main v-else class="flex min-h-screen items-center justify-center bg-background px-4">
    <div class="max-w-md text-center">
      <h1 class="text-xl font-semibold">
        未找到该创作者
      </h1>
      <p class="mt-2 text-sm text-muted-foreground">
        当前仅开放 <span class="font-mono">tuaran</span> 的个人合作说明页。
      </p>
      <Button class="mt-4" variant="outline" @click="goProfile">
        返回创作名片
      </Button>
    </div>
  </main>
</template>
