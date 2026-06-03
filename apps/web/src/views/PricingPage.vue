<script setup lang="ts">
import { ArrowLeft, Check, Crown, QrCode, Sparkles } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { APP_NAME } from '@/constants/branding'
import { useAuthStore } from '@/stores/auth'
import { toast } from '@/utils/toast'

const auth = useAuthStore()
const router = useRouter()

const billingPeriod = ref<'monthly' | 'yearly'>(`yearly`)

const PRICING = {
  monthly: { label: `月付`, amount: 39, suffix: `/ 月`, savings: `` },
  yearly: { label: `年付`, amount: 399, suffix: `/ 年`, savings: `相当于月付 ¥33,省 ¥69` },
} as const

const activePrice = computed(() => PRICING[billingPeriod.value])

async function handleSubscribe(provider: 'wechat' | 'alipay') {
  if (!auth.isAuthenticated) {
    toast.error(`登录后即可继续开通 Pro`)
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
      toast.error(data.error || `支付通道暂未开放,请联系微信 atar24 开通`)
      return
    }
    if (!res.ok) {
      toast.error(data.error || `下单失败 (${res.status})`)
      return
    }
    toast.success(`下单成功`)
  }
  catch {
    toast.error(`网络错误,请稍后再试`)
  }
}

onMounted(() => {
  document.title = `${APP_NAME} · 升级到 Pro`
})

function goHome() {
  router.push({ name: `sync` })
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-amber-50/40 via-background to-background dark:from-amber-500/5">
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
        <span class="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
          <Crown class="size-3.5" />
          {{ APP_NAME }} Pro
        </span>
        <h1 class="text-3xl font-semibold tracking-tight">
          免费先用，真正需要时再升级
        </h1>
        <p class="mx-auto max-w-xl text-sm leading-relaxed text-muted-foreground">
          编辑器、主题、导出永久免费；AI 提供匿名试用和登录后的基础免费额度。Pro 只在高频二创、批量同步和团队运营时需要。
        </p>
      </header>

      <section class="grid gap-4 md:grid-cols-2">
        <article class="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <header class="flex items-center justify-between">
            <h2 class="text-lg font-semibold">
              Free
            </h2>
            <span class="text-xs text-muted-foreground">
              {{ auth.user?.plan === 'free' ? '当前方案' : '随时可用' }}
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
              匿名即可试用 DeepSeek，登录后每日 10 次
            </li>
            <li class="flex items-start gap-2">
              <Check class="mt-0.5 size-4 text-emerald-600" />
              基础多平台同步（手动）
            </li>
          </ul>
        </article>

        <article class="flex flex-col gap-3 rounded-2xl border border-amber-300/60 bg-amber-50/60 p-6 shadow-md dark:border-amber-500/30 dark:bg-amber-500/5">
          <header class="flex items-center justify-between">
            <h2 class="flex items-center gap-1.5 text-lg font-semibold text-amber-900 dark:text-amber-200">
              <Sparkles class="size-4" />
              Pro
            </h2>
            <span class="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-900 dark:bg-amber-500/20 dark:text-amber-200">
              {{ auth.isPro ? '已订阅' : '邀请制' }}
            </span>
          </header>

          <!-- 月付 / 年付 切换 -->
          <div class="inline-flex w-fit rounded-full bg-amber-100/80 p-0.5 text-xs font-medium dark:bg-amber-500/15">
            <button
              v-for="(meta, key) in PRICING"
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
          <p v-if="activePrice.savings" class="-mt-2 text-xs text-amber-800/80 dark:text-amber-200/70">
            {{ activePrice.savings }}
          </p>

          <ul class="grid gap-1.5 text-sm text-amber-900/90 dark:text-amber-100/90">
            <li class="flex items-start gap-2">
              <Check class="mt-0.5 size-4" />
              每日 1000 次 DeepSeek 二创（≈ 不限量）
            </li>
            <li class="flex items-start gap-2">
              <Check class="mt-0.5 size-4" />
              批量同步 + 草稿队列（即将上线）
            </li>
            <li class="flex items-start gap-2">
              <Check class="mt-0.5 size-4" />
              运营数据回流（即将上线）
            </li>
            <li class="flex items-start gap-2">
              <Check class="mt-0.5 size-4" />
              专属支持（微信群）
            </li>
          </ul>

          <div class="mt-2 grid gap-2 sm:grid-cols-2">
            <Button
              type="button"
              variant="default"
              class="bg-emerald-600 text-white hover:bg-emerald-700"
              @click="handleSubscribe('wechat')"
            >
              <QrCode class="mr-1.5 size-4" />
              登录并微信支付
            </Button>
            <Button
              type="button"
              variant="default"
              class="bg-sky-600 text-white hover:bg-sky-700"
              @click="handleSubscribe('alipay')"
            >
              <QrCode class="mr-1.5 size-4" />
              支付宝
            </Button>
          </div>
        </article>
      </section>

      <section class="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-sm leading-relaxed text-muted-foreground">
        <p class="mb-1 font-medium text-foreground">
          为什么按钮点了说「支付通道暂未开放」？
        </p>
        <p>
          微信支付商户号和支付宝商户都在申请中（需要 ICP 备案 + 企业资质,周期数周）。在此期间想用 Pro,请加微信 <code class="rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-foreground">atar24</code>,注明注册邮箱,我们手动开通。商户号下来后这两个按钮立即上线。
        </p>
      </section>
    </div>
  </div>
</template>
