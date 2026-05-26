<script setup lang="ts">
/**
 * CreatorProfileBody —— 创作者账号矩阵主体
 *
 * 现在的唯一消费方是 `WorkflowDistributionPage` 的左列 (2026-05 合并自原
 * `/matrix` 平台矩阵页)。负责:
 *  - 统计卡(创作者 ID / 类型 / 账号数 / 最近更新)
 *  - 数据来源/检测状态条
 *  - 账号搜索 + 按分类的账号卡片网格(含「待登录」占位)
 *  - 空状态(无检测缓存时引导用户重新检测)
 *
 * 当父级开启 `enableWorkflowActions` 时,每张卡片追加「宣发」按钮,
 * 父级捕获 `selectDistribution` 事件后, 把目标平台写入
 * `ui.workflowDistributionPlatform` 让右列策略面板实时切换。
 *
 * 历史命名:曾同时服务于已废弃的 `/creator-profile` 公开分享页,故
 * 保留「Body」命名。
 */
import type { PublicSocialAccount } from '@/utils/socialAccounts'
import { ExternalLink, LogIn, Megaphone, RefreshCw, Search, Users } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { usePlatformAccountDetection } from '@/composables/usePlatformAccountDetection'
import { getCreatorPlatformMatrix } from '@/constants/creators'
import { useSocialAccountsStore } from '@/stores/socialAccounts'
import { useUIStore } from '@/stores/ui'
import { getPlatformProfileTitle, SOCIAL_ACCOUNT_CATEGORIES } from '@/utils/socialAccounts'

/**
 * 显示用账号类型 —— 扩展 PublicSocialAccount,加上 `pending` 标记。
 * pending=true 表示该平台在当前创作者的支持目录中,但还未通过 COSE/CSYNC
 * 检测到本地账号,卡片以「待登录」灰态展示。
 */
type AccountDisplay = PublicSocialAccount & { pending?: boolean }

interface Props {
  /** workflow 模式:卡片追加「宣发」按钮 */
  enableWorkflowActions?: boolean
  /** 是否显示顶部统计卡 */
  showStats?: boolean
  /**
   * 是否展示工具支持的全部平台(未检测到账号的会以「待登录」占位卡呈现)。
   * /matrix 一直 true。
   */
  showAllPlatforms?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  enableWorkflowActions: false,
  showStats: true,
  showAllPlatforms: false,
})

const emit = defineEmits<{
  (e: 'selectDistribution', platformType: string): void
}>()

const socialAccountsStore = useSocialAccountsStore()
const uiStore = useUIStore()
const { isCheckingLogin, redetectAccounts, ensureExtensionProbe } = usePlatformAccountDetection()

const accountSearch = ref(``)

const profile = computed(() => socialAccountsStore.activeProfile)

/**
 * 真实检测到的账号:直接读 store 内的原始 `accounts` 数组(只含 COSE/CSYNC
 * 检测出的)。注意不走 `mergeDefaultProfileAccounts`,后者会把所有支持平台
 * 合成成「已登录」默认占位,导致拿不到"已检测/未检测"边界。
 */
const detectedAccounts = computed<PublicSocialAccount[]>(() =>
  socialAccountsStore.accounts.filter(a => a.loggedIn && a.url),
)

/**
 * 展示用账号列表:
 *  - 非 workflow 模式(`showAllPlatforms=false`):仅已检测账号
 *  - workflow 模式:已检测账号 + 当前创作者的所有支持平台占位(标记 pending)
 */
const accounts = computed<AccountDisplay[]>(() => {
  const detected = detectedAccounts.value as AccountDisplay[]
  if (!props.showAllPlatforms)
    return detected

  const catalog = getCreatorPlatformMatrix(uiStore.workflowCreatorId)
  if (catalog.length === 0)
    return detected

  const detectedTypes = new Set(detected.map(a => a.type))
  const placeholders: AccountDisplay[] = catalog
    .filter(row => !detectedTypes.has(row.type))
    .map(row => ({
      type: row.type,
      title: getPlatformProfileTitle(row.type),
      displayName: ``,
      uid: ``,
      icon: ``,
      url: row.url,
      loggedIn: false,
      followers: row.followers || ``,
      reads: row.reads || ``,
      updatedAt: 0,
      pending: true,
    }))
  return [...detected, ...placeholders]
})

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
    return { name: category.name, accounts: categoryAccounts }
  })

  const otherAccounts = filteredAccounts.value.filter(
    account => !used.has(`${account.type}:${account.uid}:${account.displayName}`),
  )
  if (otherAccounts.length > 0)
    groups.push({ name: `其它平台`, accounts: otherAccounts })

  return groups.filter(group => group.accounts.length > 0)
})

const updatedAt = computed(() => {
  const last = Math.max(profile.value.updatedAt || 0, ...detectedAccounts.value.map((a: PublicSocialAccount) => a.updatedAt || 0))
  return last ? new Date(last).toLocaleString() : ``
})

const detectedCount = computed(() => detectedAccounts.value.length)
const pendingCount = computed(() => accounts.value.filter(a => a.pending).length)

const kindLabelMap: Record<string, string> = {
  blogger: `博主`,
  developer: `开发者创作者`,
  media: `媒体创作者`,
  brand: `品牌账号`,
  custom: `自定义`,
}

function openAccount(account: PublicSocialAccount) {
  if (!account.url || account.url === `#`)
    return
  window.open(account.url, `_blank`, `noopener,noreferrer`)
}

async function handleRedetectAccounts() {
  ensureExtensionProbe()
  await redetectAccounts()
}

function onDistribute(account: PublicSocialAccount) {
  emit(`selectDistribution`, account.type)
}
</script>

<template>
  <div class="flex flex-1 flex-col">
    <section
      v-if="showStats"
      class="grid gap-3 border-b border-border/70 py-4 sm:grid-cols-2 lg:grid-cols-4"
    >
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
          {{ kindLabelMap[profile.kind] || profile.kind }}
        </p>
      </div>
      <div class="rounded-lg border border-border bg-background px-4 py-3 dark:bg-card">
        <p class="text-xs text-muted-foreground">
          {{ showAllPlatforms ? '已登录 / 支持平台' : '已登录平台' }}
        </p>
        <p class="mt-1 text-2xl font-semibold tabular-nums">
          <template v-if="showAllPlatforms">
            {{ detectedCount }}<span class="ml-1 text-sm font-normal text-muted-foreground">/ {{ accounts.length }}</span>
          </template>
          <template v-else>
            {{ detectedCount }}
          </template>
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
      <span>数据来源：本机缓存</span>
      <span>{{ isCheckingLogin ? '正在通过 COSE / CSYNC 检测已登录账号…' : '需安装扩展；登录新平台后请点「重新检测账号」' }}</span>
    </section>

    <!-- workflow 模式下 0 已检测的引导:补一个顶层「重新检测」CTA(空状态卡片此时不显示) -->
    <section
      v-if="showAllPlatforms && detectedCount === 0"
      class="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-300/60 bg-amber-50/60 px-4 py-3 text-xs dark:border-amber-700/40 dark:bg-amber-900/15"
    >
      <p class="text-amber-800 dark:text-amber-200">
        本机尚未检测到任何已登录账号。
        请先安装 COSE / CSYNC 扩展并在各平台登录,然后点右侧按钮触发检测。
      </p>
      <Button
        size="sm"
        :disabled="isCheckingLogin"
        @click="handleRedetectAccounts"
      >
        <RefreshCw class="mr-1.5 h-3.5 w-3.5" :class="{ 'animate-spin': isCheckingLogin }" />
        重新检测账号
      </Button>
    </section>

    <section v-if="accounts.length > 0" class="py-5">
      <div class="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 class="text-base font-semibold">
            账号矩阵
          </h2>
          <p class="mt-1 text-sm text-muted-foreground">
            <template v-if="accountSearch">
              匹配 {{ filteredAccounts.length }} / {{ accounts.length }} 个平台
            </template>
            <template v-else-if="showAllPlatforms">
              支持 {{ accounts.length }} 个平台 · 已登录 {{ detectedCount }} · 待登录
              <span class="text-foreground/80">{{ pendingCount }}</span>
            </template>
            <template v-else>
              共 {{ detectedCount }} 个已登录账号
            </template>
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
              class="relative rounded-lg border p-4 shadow-sm transition-colors dark:bg-card"
              :class="account.pending
                ? 'border-dashed border-border/70 bg-muted/30 hover:border-muted-foreground/40'
                : 'border-border bg-background hover:border-primary/50'"
            >
              <span
                v-if="account.pending"
                class="absolute right-3 top-3 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-400/15 dark:text-amber-300"
              >
                待登录
              </span>
              <div class="flex min-w-0 items-start gap-3">
                <div
                  v-if="account.pending || !(account.avatar || account.icon)"
                  class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-dashed border-border bg-muted text-base font-semibold text-muted-foreground"
                >
                  {{ (account.title || account.type).slice(0, 1) }}
                </div>
                <img
                  v-else
                  :src="account.avatar || account.icon"
                  alt=""
                  class="h-11 w-11 shrink-0 rounded-full border border-border object-cover"
                >
                <div class="min-w-0 flex-1">
                  <div class="flex min-w-0 items-center gap-2">
                    <img
                      v-if="account.icon && !account.pending"
                      :src="account.icon"
                      alt=""
                      class="h-4 w-4 shrink-0"
                    >
                    <span class="truncate text-sm text-muted-foreground">{{ account.title }}</span>
                  </div>
                  <h2 class="mt-1 truncate text-base font-semibold" :class="account.pending ? 'text-muted-foreground' : ''">
                    {{ account.displayName || (account.pending ? '尚未登录' : '') }}
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
                  <p class="mt-1 font-medium tabular-nums" :class="account.pending ? 'text-muted-foreground' : ''">
                    {{ account.followers || (account.pending ? '—' : '未缓存') }}
                  </p>
                </div>
                <div class="rounded-md bg-muted/50 px-3 py-2">
                  <div class="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <RefreshCw class="h-3.5 w-3.5" />
                    阅读量
                  </div>
                  <p class="mt-1 font-medium tabular-nums" :class="account.pending ? 'text-muted-foreground' : ''">
                    {{ account.reads || (account.pending ? '—' : '未缓存') }}
                  </p>
                </div>
              </div>

              <div class="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button
                  class="w-full sm:flex-1"
                  variant="outline"
                  @click="openAccount(account)"
                >
                  <component :is="account.pending ? LogIn : ExternalLink" class="mr-2 h-4 w-4" />
                  {{ account.pending ? '去登录' : '打开主页' }}
                </Button>
                <Button
                  v-if="enableWorkflowActions"
                  class="w-full sm:flex-1"
                  variant="default"
                  @click="onDistribute(account)"
                >
                  <Megaphone class="mr-2 h-4 w-4" />
                  宣发
                </Button>
              </div>
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
      </div>
    </section>
  </div>
</template>
