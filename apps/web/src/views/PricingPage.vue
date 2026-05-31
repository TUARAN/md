<script setup lang="ts">
import { ArrowLeft, Check, Crown, Sparkles } from 'lucide-vue-next'
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { APP_NAME } from '@/constants/branding'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

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
          AI 配额管够，工作流不打断
        </h1>
        <p class="mx-auto max-w-xl text-sm leading-relaxed text-muted-foreground">
          编辑器、主题、导出永远免费。Pro 解锁更高的 AI 调用配额、批量多平台同步与即将上线的运营数据回流。
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
              每日 10 次 DeepSeek 二创
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
              内测中
            </span>
          </header>
          <p class="text-2xl font-semibold text-amber-900 dark:text-amber-200">
            ¥— <span class="text-sm font-normal text-amber-800/80 dark:text-amber-200/70">/ 月（定价中）</span>
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
        </article>
      </section>

      <section class="rounded-2xl border border-dashed border-border bg-card/50 p-6 text-sm leading-relaxed text-muted-foreground">
        <p class="mb-1 font-medium text-foreground">
          想加入 Pro 内测？
        </p>
        <p>
          目前 Pro 定价仍在调研，先以邀请制开放。请通过微信 <code class="rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-foreground">atar24</code> 联系我们，注明 GitHub 用户名，我们会手动把账号置为 Pro。
        </p>
      </section>
    </div>
  </div>
</template>
