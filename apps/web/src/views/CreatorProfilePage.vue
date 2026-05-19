<script setup lang="ts">
import type { PublicCreatorProfile, PublicSocialAccount } from '@/utils/socialAccounts'
import { ArrowLeft, Copy, ExternalLink, FileText, RefreshCw, Search, Users } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { usePlatformAccountDetection } from '@/composables/usePlatformAccountDetection'
import { APP_NAME } from '@/constants/branding'
import { TUARAN_CREATOR_ID } from '@/constants/creatorOffer'
import { useSocialAccountsStore } from '@/stores/socialAccounts'
import { copyPlain } from '@/utils/clipboard'
import { creatorOfferRoute } from '@/utils/creatorRoutes'
import { getCreatorProfileAccounts, SOCIAL_ACCOUNT_CATEGORIES } from '@/utils/socialAccounts'
import { toast } from '@/utils/toast'

const socialAccountsStore = useSocialAccountsStore()
const { isCheckingLogin, redetectAccounts, ensureExtensionProbe } = usePlatformAccountDetection()

const sharedProfile = ref<PublicCreatorProfile | null>(null)
const copied = ref(false)
const accountSearch = ref(``)

const profile = computed(() => sharedProfile.value ?? socialAccountsStore.activeProfile)
const accounts = computed(() => getCreatorProfileAccounts(profile.value))
const filteredAccounts = computed(() => {
  const keyword = accountSearch.value.trim().toLowerCase()
  if (!keyword)
    return accounts.value

  return accounts.value.filter((account) => {
    return [
      account.title,
      account.displayName,
      account.uid,
      account.type,
      account.url,
    ].some(value => value?.toLowerCase().includes(keyword))
  })
})
const accountsByCategory = computed(() => {
  const used = new Set<string>()
  const groups = SOCIAL_ACCOUNT_CATEGORIES.map((category) => {
    const categoryAccounts = filteredAccounts.value.filter((account) => {
      const matched = category.platforms.includes(account.type)
      if (matched)
        used.add(`${account.type}:${account.uid}:${account.displayName}`)
      return matched
    })
    return {
      name: category.name,
      accounts: categoryAccounts,
    }
  })

  const otherAccounts = filteredAccounts.value.filter(account => !used.has(`${account.type}:${account.uid}:${account.displayName}`))
  if (otherAccounts.length > 0) {
    groups.push({
      name: `其它平台`,
      accounts: otherAccounts,
    })
  }

  return groups.filter(group => group.accounts.length > 0)
})

const hasSharedData = computed(() => sharedProfile.value !== null)
const personalOfferUrl = computed(() => {
  if (profile.value.id?.toLowerCase() === TUARAN_CREATOR_ID)
    return creatorOfferRoute(TUARAN_CREATOR_ID)
  return null
})

function goPersonalOffer() {
  if (personalOfferUrl.value)
    window.location.href = personalOfferUrl.value
}
const updatedAt = computed(() => {
  const last = Math.max(profile.value.updatedAt || 0, ...accounts.value.map(account => account.updatedAt || 0))
  return last ? new Date(last).toLocaleString() : ``
})
const kindLabelMap = {
  blogger: `博主`,
  developer: `开发者创作者`,
  media: `媒体创作者`,
  brand: `品牌账号`,
  custom: `自定义`,
}

function copyShareUrl() {
  const url = socialAccountsStore.getShareUrl()
  copyPlain(url)
  copied.value = true
  toast.success(`已复制展示链接`)
  window.setTimeout(() => {
    copied.value = false
  }, 1200)
}

function goEditor() {
  window.location.href = import.meta.env.BASE_URL
}

function openAccount(account: PublicSocialAccount) {
  if (!account.url || account.url === `#`)
    return
  window.open(account.url, `_blank`, `noopener,noreferrer`)
}

async function handleRedetectAccounts() {
  if (hasSharedData.value) {
    sharedProfile.value = null
    const url = new URL(window.location.href)
    url.searchParams.delete(`profile`)
    url.searchParams.delete(`data`)
    window.history.replaceState({}, ``, url.pathname + url.search)
  }
  ensureExtensionProbe()
  await redetectAccounts()
}

onMounted(() => {
  sharedProfile.value = socialAccountsStore.readSharedProfile()
  ensureExtensionProbe()
})
</script>

<template>
  <main class="min-h-screen bg-[#f6f7f8] text-foreground dark:bg-background">
    <div class="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-5 md:px-6 md:py-7">
      <header class="flex flex-col gap-4 border-b border-border/70 pb-5 md:flex-row md:items-start md:justify-between">
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Button
              variant="ghost"
              size="sm"
              class="-ml-3"
              @click="goEditor"
            >
              <ArrowLeft class="mr-2 h-4 w-4" />
              返回编辑器
            </Button>
            <span>{{ APP_NAME }}</span>
          </div>
          <h1 class="mt-3 text-2xl font-semibold tracking-normal md:text-3xl">
            {{ profile.title }}
          </h1>
          <p class="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {{ profile.subtitle }}。这里集中展示在各平台的公开主页；品牌合作说明见
            <button
              v-if="personalOfferUrl"
              type="button"
              class="text-primary underline-offset-2 hover:underline"
              @click="goPersonalOffer"
            >
              个人 IP 内容与引流服务
            </button>
            <template v-else>
              个人合作说明页
            </template>
            。
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <Button
            v-if="personalOfferUrl"
            @click="goPersonalOffer"
          >
            <FileText class="mr-2 h-4 w-4" />
            内容与引流合作
          </Button>
          <Button
            variant="outline"
            :disabled="isCheckingLogin"
            @click="handleRedetectAccounts"
          >
            <RefreshCw class="mr-2 h-4 w-4" :class="{ 'animate-spin': isCheckingLogin }" />
            重新检测账号
          </Button>
          <Button
            variant="outline"
            :disabled="accounts.length === 0 || hasSharedData"
            @click="copyShareUrl"
          >
            <Copy class="mr-2 h-4 w-4" />
            {{ copied ? '已复制' : '复制分享链接' }}
          </Button>
        </div>
      </header>

      <section class="grid gap-3 border-b border-border/70 py-4 sm:grid-cols-2 lg:grid-cols-4">
        <div class="rounded-lg border border-border bg-background px-4 py-3 dark:bg-card">
          <p class="text-xs text-muted-foreground">
            创作者 ID
          </p>
          <p class="mt-1 text-sm font-semibold tracking-wide">
            {{ profile.id }}
          </p>
        </div>
        <div class="rounded-lg border border-border bg-background px-4 py-3 dark:bg-card">
          <p class="text-xs text-muted-foreground">
            类型
          </p>
          <p class="mt-1 text-sm font-medium">
            {{ kindLabelMap[profile.kind] }}
          </p>
        </div>
        <div class="rounded-lg border border-border bg-background px-4 py-3 dark:bg-card">
          <p class="text-xs text-muted-foreground">
            已登录平台
          </p>
          <p class="mt-1 text-2xl font-semibold tabular-nums">
            {{ accounts.length }}
          </p>
        </div>
        <div class="rounded-lg border border-border bg-background px-4 py-3 dark:bg-card">
          <p class="text-xs text-muted-foreground">
            最近更新
          </p>
          <p class="mt-1 text-sm font-medium">
            {{ updatedAt || '暂无' }}
          </p>
        </div>
      </section>

      <section class="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 py-3 text-xs text-muted-foreground">
        <span>数据来源：{{ hasSharedData ? '分享链接' : '本机缓存' }}</span>
        <span>{{ isCheckingLogin ? '正在通过 COSE / CSYNC 检测已登录账号…' : '需安装扩展；登录新平台后请点「重新检测账号」' }}</span>
      </section>

      <section v-if="accounts.length > 0" class="py-5">
        <div class="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 class="text-base font-semibold">
              账号矩阵
            </h2>
            <p class="mt-1 text-sm text-muted-foreground">
              {{ accountSearch ? `匹配 ${filteredAccounts.length} / ${accounts.length} 个账号` : `共 ${accounts.length} 个已登录账号` }}
            </p>
          </div>
          <div class="relative w-full md:w-80">
            <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              v-model="accountSearch"
              class="h-9 pl-9"
              placeholder="搜索平台、账号、链接"
            />
          </div>
        </div>

        <div v-if="accountsByCategory.length > 0" class="space-y-6">
          <section
            v-for="category in accountsByCategory"
            :key="category.name"
            class="space-y-3"
          >
            <div class="flex items-center gap-2">
              <h3 class="text-sm font-semibold">
                {{ category.name }}
              </h3>
              <span class="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{{ category.accounts.length }}</span>
            </div>

            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <article
                v-for="account in category.accounts"
                :key="`${account.type}-${account.uid}-${account.displayName}`"
                class="rounded-lg border border-border bg-background p-4 shadow-sm transition-colors hover:border-primary/50 dark:bg-card"
              >
                <div class="flex min-w-0 items-start gap-3">
                  <img
                    :src="account.avatar || account.icon"
                    alt=""
                    class="h-11 w-11 shrink-0 rounded-full border border-border object-cover"
                  >
                  <div class="min-w-0 flex-1">
                    <div class="flex min-w-0 items-center gap-2">
                      <img
                        :src="account.icon"
                        alt=""
                        class="h-4 w-4 shrink-0"
                      >
                      <span class="truncate text-sm text-muted-foreground">{{ account.title }}</span>
                    </div>
                    <h2 class="mt-1 truncate text-base font-semibold">
                      {{ account.displayName }}
                    </h2>
                    <p class="mt-1 truncate text-xs text-muted-foreground">
                      {{ account.url }}
                    </p>
                  </div>
                </div>

                <div class="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div class="rounded-md bg-muted/50 px-3 py-2">
                    <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users class="h-3.5 w-3.5" />
                      粉丝量
                    </div>
                    <p class="mt-1 font-medium tabular-nums">
                      {{ account.followers || '未缓存' }}
                    </p>
                  </div>
                  <div class="rounded-md bg-muted/50 px-3 py-2">
                    <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <RefreshCw class="h-3.5 w-3.5" />
                      阅读量
                    </div>
                    <p class="mt-1 font-medium tabular-nums">
                      {{ account.reads || '未缓存' }}
                    </p>
                  </div>
                </div>

                <Button
                  class="mt-4 w-full"
                  variant="outline"
                  @click="openAccount(account)"
                >
                  <ExternalLink class="mr-2 h-4 w-4" />
                  打开主页
                </Button>
              </article>
            </div>
          </section>
        </div>

        <div
          v-else
          class="rounded-lg border border-dashed border-border bg-background px-6 py-12 text-center text-sm text-muted-foreground dark:bg-card"
        >
          没有匹配的账号
        </div>
      </section>

      <section
        v-else
        class="mt-6 flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background px-6 py-16 text-center dark:bg-card"
      >
        <h2 class="text-lg font-semibold">
          暂无账号缓存
        </h2>
        <p class="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          请安装 COSE 或 CSYNC 扩展，并在各平台完成登录后，点击下方按钮重新检测；也可回到编辑器「发布」面板检测。
        </p>
        <div class="mt-5 flex flex-wrap items-center justify-center gap-2">
          <Button
            :disabled="isCheckingLogin"
            @click="handleRedetectAccounts"
          >
            <RefreshCw class="mr-2 h-4 w-4" :class="{ 'animate-spin': isCheckingLogin }" />
            重新检测账号
          </Button>
          <Button variant="outline" @click="goEditor">
            返回编辑器
          </Button>
        </div>
      </section>
    </div>
  </main>
</template>
