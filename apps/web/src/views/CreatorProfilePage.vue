<script setup lang="ts">
/**
 * CreatorProfilePage —— 创作者主页(外部访客视角)
 *
 * 公开页样式(不挂 EditorHeader / 工作流栏),用于:
 *  - 「复制分享链接」分享出去后,接收方打开看到的页面
 *  - 创作者本人通过浏览器直接访问 `/creator-profile`
 *
 * 主体账号矩阵(统计 / 搜索 / 卡片)由 `<CreatorProfileBody />` 提供,本页只
 * 负责自己的头部(标题、按钮组、返回编辑器)。与工作流第 4 步「平台矩阵」
 * 共用同一份矩阵 UI(2026-05 合并)。
 */
import type { PublicCreatorProfile } from '@/utils/socialAccounts'
import { ArrowLeft, Copy, FileText, RefreshCw } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import CreatorProfileBody from '@/components/creator-profile/CreatorProfileBody.vue'
import { Button } from '@/components/ui/button'
import { usePlatformAccountDetection } from '@/composables/usePlatformAccountDetection'
import { APP_NAME } from '@/constants/branding'
import { TUARAN_CREATOR_ID } from '@/constants/creatorOffer'
import { isKnownWorkflowCreator } from '@/constants/creators'
import { CREATOR_CARD_ROUTE, useSocialAccountsStore } from '@/stores/socialAccounts'
import { useUIStore } from '@/stores/ui'
import { copyPlain } from '@/utils/clipboard'
import { parseCreatorIdFromSearch } from '@/utils/creatorRoutes'
import { getCreatorProfileAccounts } from '@/utils/socialAccounts'
import { toast } from '@/utils/toast'

const socialAccountsStore = useSocialAccountsStore()
const uiStore = useUIStore()
const router = useRouter()
const { isCheckingLogin, redetectAccounts, ensureExtensionProbe } = usePlatformAccountDetection()

const sharedProfile = ref<PublicCreatorProfile | null>(null)
const copied = ref(false)

const profile = computed(() => sharedProfile.value ?? socialAccountsStore.activeProfile)
const accounts = computed(() => getCreatorProfileAccounts(profile.value))
const hasSharedData = computed(() => sharedProfile.value !== null)

const workflowCreatorId = computed(() => {
  const fromQuery = parseCreatorIdFromSearch()
  if (fromQuery && isKnownWorkflowCreator(fromQuery))
    return fromQuery
  if (profile.value.id && isKnownWorkflowCreator(profile.value.id))
    return profile.value.id.toLowerCase()
  return TUARAN_CREATOR_ID
})

const creatorCardUrl = computed(() => {
  if (profile.value.id?.toLowerCase() === TUARAN_CREATOR_ID.toLowerCase())
    return CREATOR_CARD_ROUTE
  return null
})

function goCreatorCard() {
  if (creatorCardUrl.value)
    window.location.href = creatorCardUrl.value
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

function goWorkflowMatrix() {
  uiStore.setWorkflowCreatorId(workflowCreatorId.value)
  router.push({ name: `matrix` })
}

function onBodyRedetectStart() {
  if (hasSharedData.value) {
    sharedProfile.value = null
    const url = new URL(window.location.href)
    url.searchParams.delete(`profile`)
    url.searchParams.delete(`data`)
    window.history.replaceState({}, ``, url.pathname + url.search)
  }
}

onMounted(() => {
  sharedProfile.value = socialAccountsStore.readSharedProfile()
  const creatorFromQuery = parseCreatorIdFromSearch()
  if (creatorFromQuery && isKnownWorkflowCreator(creatorFromQuery))
    uiStore.setWorkflowCreatorId(creatorFromQuery)
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
            {{ profile.subtitle }}。对外品牌合作与数据概览见
            <button
              v-if="creatorCardUrl"
              type="button"
              class="text-primary underline-offset-2 hover:underline"
              @click="goCreatorCard"
            >
              创作名片
            </button>
            <template v-else>
              创作名片
            </template>
            。
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <Button variant="outline" @click="goWorkflowMatrix">
            工作流 · 平台矩阵
          </Button>
          <Button
            v-if="creatorCardUrl"
            @click="goCreatorCard"
          >
            <FileText class="mr-2 h-4 w-4" />
            创作名片
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

      <CreatorProfileBody
        :shared-profile="sharedProfile"
        :show-stats="true"
        :enable-workflow-actions="false"
        @redetect-start="onBodyRedetectStart"
      />
    </div>
  </main>
</template>
