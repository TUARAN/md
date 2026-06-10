<script setup lang="ts">
import { ArrowLeft, Check, Coins, QrCode, Sparkles } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import {
  BILLING_POLICY_BULLETS,
  FREE_DAILY_AI_QUOTA,
  LOGIN_PURPOSE_STATEMENT,
  PAYMENT_PASS_THROUGH_STATEMENT,
  PLATFORM_FREE_STATEMENT,
  QUOTA_PACK_LABEL,
  QUOTA_PACK_PRICING,
  TOPUP_DAILY_AI_QUOTA,
} from '@/constants/billingPolicy'
import { APP_NAME } from '@/constants/branding'
import { useAuthStore } from '@/stores/auth'
import { toast } from '@/utils/toast'

const auth = useAuthStore()
const router = useRouter()

const billingPeriod = ref<'monthly' | 'yearly'>(`monthly`)

const activePrice = computed(() => QUOTA_PACK_PRICING[billingPeriod.value])

async function handleTopUp(provider: 'wechat' | 'alipay') {
  if (!auth.isAuthenticated) {
    toast.error(`登录后即可充值 AI 算力额度`)
    auth.startLogin()
    return
  }
  try {
    const sku = billingPeriod.value === `monthly` ? `pro_monthly` : `pro_yearly`
    const res = await fetch(`/api/billing/intent`, {
      method: `POST`,
      credentials: `same-origin`,
      headers: { 'Content-Type': `application/json` },
      body: JSON.stringify({ sku, provider }),
    })
    const data = await res.json().catch(() => ({})) as { error?: string, code?: string }
    if (res.status === 503 || res.status === 501) {
      toast.error(data.error || `支付通道暂未开放，请联系微信 atar24 人工充值`)
      return
    }
    if (!res.ok) {
      toast.error(data.error || `下单失败 (${res.status})`)
      return
    }
    toast.success(`下单成功`)
  }
  catch {
    toast.error(`网络错误，请稍后再试`)
  }
}

onMounted(() => {
  document.title = `${APP_NAME} · AI 算力额度`
})

function goHome() {
  router.push({ name: `sync` })
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-emerald-50/40 via-background to-background dark:from-emerald-500/5">
    <div class="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-12">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        class="w-fit text-muted-foreground"
        @click="goHome"
      >
        <ArrowLeft class="mr-1.5 size-4" />
        返回编辑器
      </Button>

      <header class="space-y-3 text-center">
        <span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300">
          <Coins class="size-3.5" />
          工具永久免费
        </span>
        <h1 class="text-3xl font-semibold tracking-tight">
          充值仅为大模型算力，不收平台费
        </h1>
        <p class="mx-auto max-w-xl text-sm leading-relaxed text-muted-foreground">
          {{ PLATFORM_FREE_STATEMENT }}
          {{ LOGIN_PURPOSE_STATEMENT }}
        </p>
      </header>

      <section class="rounded-2xl border border-emerald-200/70 bg-emerald-50/50 p-5 text-sm leading-relaxed text-emerald-950 dark:border-emerald-500/25 dark:bg-emerald-500/5 dark:text-emerald-100">
        <p class="mb-2 font-medium">
          计费说明
        </p>
        <ul class="grid gap-1.5">
          <li v-for="(line, index) in BILLING_POLICY_BULLETS" :key="index" class="flex items-start gap-2">
            <Check class="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{{ line }}</span>
          </li>
        </ul>
      </section>

      <section class="grid gap-4 md:grid-cols-2">
        <article class="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <header class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">
              免费使用
            </h2>
            <span class="text-xs text-muted-foreground">
              {{ !auth.isPro ? '当前方案' : '永久可用' }}
            </span>
          </header>
          <p class="text-2xl font-semibold">
            ¥0
          </p>
          <ul class="grid gap-1.5 text-sm text-muted-foreground">
            <li class="flex items-start gap-2">
              <Check class="mt-0.5 size-4 text-emerald-600" />
              Markdown 编辑 / 主题 / 导出全功能
            </li>
            <li class="flex items-start gap-2">
              <Check class="mt-0.5 size-4 text-emerald-600" />
              匿名可试用 AI；登录后每日 {{ FREE_DAILY_AI_QUOTA }} 次免费额度
            </li>
            <li class="flex items-start gap-2">
              <Check class="mt-0.5 size-4 text-emerald-600" />
              多平台同步与内容分发（手动）
            </li>
          </ul>
        </article>

        <article class="flex flex-col gap-3 rounded-2xl border border-amber-300/60 bg-amber-50/60 p-6 shadow-md dark:border-amber-500/30 dark:bg-amber-500/5">
          <header class="flex items-center justify-between">
            <h2 class="flex items-center gap-1.5 text-lg font-semibold text-amber-900 dark:text-amber-200">
              <Sparkles class="size-4" />
              {{ QUOTA_PACK_LABEL }}
            </h2>
            <span class="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-900 dark:bg-amber-500/20 dark:text-amber-200">
              {{ auth.isPro ? '已充值' : '成本价中转' }}
            </span>
          </header>

          <div class="inline-flex w-fit rounded-full bg-amber-100/80 p-0.5 text-xs font-medium dark:bg-amber-500/15">
            <button
              v-for="(meta, key) in QUOTA_PACK_PRICING"
              :key="key"
              type="button"
              class="rounded-full px-3 py-1 transition-colors"
              :class="billingPeriod === key
                ? 'bg-white text-amber-900 shadow-sm dark:bg-amber-500/30 dark:text-amber-100'
                : 'text-amber-800/70 dark:text-amber-200/70'"
              @click="billingPeriod = key"
            >
              {{ meta.label }}
            </button>
          </div>

          <p class="text-2xl font-semibold text-amber-900 dark:text-amber-200">
            ¥{{ activePrice.amount }}
            <span class="text-sm font-normal text-amber-800/80 dark:text-amber-200/70">{{ activePrice.suffix }}</span>
          </p>
          <p class="-mt-2 text-xs text-amber-800/80 dark:text-amber-200/70">
            {{ activePrice.note }}
          </p>

          <ul class="grid gap-1.5 text-sm text-amber-900/90 dark:text-amber-100/90">
            <li class="flex items-start gap-2">
              <Check class="mt-0.5 size-4" />
              每日 {{ TOPUP_DAILY_AI_QUOTA }} 次 DeepSeek 调用（≈ 高频够用）
            </li>
            <li class="flex items-start gap-2">
              <Check class="mt-0.5 size-4" />
              款项全额用于购买上游 API 算力，平台零差价
            </li>
            <li class="flex items-start gap-2">
              <Check class="mt-0.5 size-4" />
              工具功能与 Free 用户相同，仅 AI 配额更高
            </li>
          </ul>

          <div class="mt-2 grid gap-2 sm:grid-cols-2">
            <Button
              type="button"
              variant="default"
              class="bg-emerald-600 text-white hover:bg-emerald-700"
              @click="handleTopUp('wechat')"
            >
              <QrCode class="mr-1.5 size-4" />
              微信充值
            </Button>
            <Button
              type="button"
              variant="default"
              class="bg-sky-600 text-white hover:bg-sky-700"
              @click="handleTopUp('alipay')"
            >
              <QrCode class="mr-1.5 size-4" />
              支付宝充值
            </Button>
          </div>
        </article>
      </section>

      <section class="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-sm leading-relaxed text-muted-foreground">
        <p class="mb-1 font-medium text-foreground">
          为什么按钮点了说「支付通道暂未开放」？
        </p>
        <p class="mb-3">
          微信支付与支付宝商户号尚在申请中（需 ICP 备案与企业资质，周期数周）。在此期间如需充值 AI 额度，请加微信
          <code class="rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-foreground">atar24</code>，
          注明注册邮箱，我们按成本价人工开通对应额度。商户号就绪后，上述按钮将直接对接充值。
        </p>
        <p class="text-xs">
          {{ PAYMENT_PASS_THROUGH_STATEMENT }}
        </p>
      </section>
    </div>
  </div>
</template>
