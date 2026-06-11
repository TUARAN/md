<script setup lang="ts">
/**
 * /settings — single-page settings hub with left section nav.
 *
 * Pattern: hash-based deep linking (`/settings#ai`). The page is
 * intentionally a destination, not a modal: the editor's old settings
 * dialogs scattered across the app will progressively fold in here.
 *
 * v1 ships with accounts / AI / theme as functional sections; publishing
 * channels and quick commands are stubs so the IA is discoverable.
 */
import type { ThemeName } from '@md/shared/configs'
import {
  ArrowLeft,
  Bot,
  Crown,
  LogOut,
  Mail,
  Palette,
  PenLine,
  Send,
  UserIcon,
  Wand2,
  Zap,
} from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { PanelShell, SectionHeader, StatusBadge } from '@/components/ui/layout'
import {
  FREE_DAILY_AI_QUOTA,
  QUOTA_PACK_LABEL,
  TOPUP_DAILY_AI_QUOTA,
} from '@/constants/billingPolicy'
import { APP_NAME } from '@/constants/branding'
import { CREATOR_ID_MAX_LEN, CREATOR_ID_MIN_LEN, slugifyCreatorId, validateCreatorId } from '@/constants/creatorProfilePolicy'
import { useAuthStore } from '@/stores/auth'
import { useCreatorProfileStore } from '@/stores/creatorProfile'
import { useThemeStore } from '@/stores/theme'
import { copyPlain } from '@/utils/clipboard'
import { toast } from '@/utils/toast'

const auth = useAuthStore()
const creatorProfile = useCreatorProfileStore()
const themeStore = useThemeStore()
const route = useRoute()
const router = useRouter()

interface SectionDef {
  id: string
  label: string
  icon: typeof UserIcon
  disabled?: boolean
}

const sections: SectionDef[] = [
  { id: `account`, label: `账号`, icon: UserIcon },
  { id: `creator`, label: `创作名片`, icon: PenLine },
  { id: `ai`, label: `AI 助手`, icon: Bot },
  { id: `theme`, label: `主题与样式`, icon: Palette },
  { id: `publishing`, label: `发布通道`, icon: Send, disabled: true },
  { id: `quick-commands`, label: `快捷命令`, icon: Zap, disabled: true },
]

const activeSection = ref<string>(`account`)

function selectSection(id: string) {
  const target = sections.find(s => s.id === id)
  if (!target || target.disabled)
    return
  activeSection.value = id
  router.replace({ hash: `#${id}` })
}

// Sync initial hash → active section, and watch route hash changes
function syncFromHash() {
  const hash = (route.hash || ``).replace(/^#/, ``)
  if (hash && sections.some(s => s.id === hash && !s.disabled))
    activeSection.value = hash
}

onMounted(() => {
  document.title = `${APP_NAME} · 设置`
  syncFromHash()
  if (auth.status === `idle`)
    void auth.refresh()
})

watch(() => route.hash, syncFromHash)

// --- Theme section state ---

interface ThemeOption {
  value: ThemeName
  label: string
  description: string
}

const themeOptions: ThemeOption[] = [
  { value: `default`, label: `默认`, description: `中性配色,适合大多数公众号` },
  { value: `grace`, label: `Grace`, description: `柔和、人文感,适合长文` },
  { value: `simple`, label: `Simple`, description: `极简、留白多,适合技术文章` },
]

const themeRefs = storeToRefs(themeStore)
const currentTheme = themeRefs.theme

async function pickTheme(value: ThemeName) {
  currentTheme.value = value
  await themeStore.applyCurrentTheme()
}

// --- Helpers ---

const quotaRemaining = computed(() => {
  const q = auth.aiQuota
  if (!q)
    return null
  return Math.max(0, q.limit - q.used)
})

function goEditor() {
  router.push({ name: `sync` })
}

function goPricing() {
  router.push({ name: `pricing` })
}

const creatorForm = ref({
  creatorId: ``,
  displayName: ``,
  tagline: ``,
  homepage: ``,
  shareEnabled: false,
})
const savingCreatorProfile = ref(false)
const regeneratingShareToken = ref(false)

/** slugify 后的实际 id，用户输入大写/中文/空格时仍能直观看到落库形态 */
const creatorIdPreview = computed(() => slugifyCreatorId(creatorForm.value.creatorId))
/** inline 校验：站长 id 由后端固定，不需要校验；其它用户为空时不提示（仅在用户开始输入后才报错） */
const creatorIdError = computed(() => {
  if (creatorProfile.isSiteOwner)
    return null
  if (!creatorForm.value.creatorId.trim())
    return null
  return validateCreatorId(creatorForm.value.creatorId)
})

watch(
  () => creatorProfile.profile,
  (profile) => {
    if (!profile)
      return
    creatorForm.value = {
      creatorId: profile.creatorId,
      displayName: profile.displayName,
      tagline: profile.tagline,
      homepage: profile.homepage ?? ``,
      shareEnabled: profile.shareEnabled,
    }
  },
  { immediate: true },
)

async function saveCreatorProfile() {
  if (!auth.isAuthenticated)
    return
  if (!creatorProfile.isSiteOwner) {
    const validationError = validateCreatorId(creatorForm.value.creatorId)
    if (validationError) {
      toast.error(validationError)
      return
    }
  }
  savingCreatorProfile.value = true
  try {
    const result = await creatorProfile.save({
      creatorId: creatorProfile.isSiteOwner ? undefined : creatorForm.value.creatorId.trim(),
      displayName: creatorForm.value.displayName.trim(),
      tagline: creatorForm.value.tagline.trim(),
      homepage: creatorForm.value.homepage.trim() || null,
      shareEnabled: creatorForm.value.shareEnabled,
    })
    if (result.offline)
      toast.warning(`已暂存到本地，未同步到服务器（离线模式）`)
    else
      toast.success(`创作名片已保存`)
  }
  catch (e) {
    toast.error(e instanceof Error ? e.message : `保存失败`)
  }
  finally {
    savingCreatorProfile.value = false
  }
}

async function copyBrandShareLink() {
  if (!creatorProfile.brandShareUrl) {
    toast.error(`请先开启品牌方分享并保存`)
    return
  }
  try {
    await copyPlain(creatorProfile.brandShareUrl)
    toast.success(`品牌方分享链接已复制`)
  }
  catch {
    toast.error(`复制失败，请手动复制链接`)
  }
}

async function regenerateShareLink() {
  if (!auth.isAuthenticated)
    return
  regeneratingShareToken.value = true
  try {
    const result = await creatorProfile.save({ regenerateShareToken: true, shareEnabled: true })
    creatorForm.value.shareEnabled = true
    if (result.offline)
      toast.warning(`已在本地生成新链接，但未同步到服务器（离线模式）`)
    else
      toast.success(`已生成新的分享链接，旧链接将失效`)
  }
  catch (e) {
    toast.error(e instanceof Error ? e.message : `重置失败`)
  }
  finally {
    regeneratingShareToken.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-muted/20 dark:bg-muted/10">
    <header class="border-b border-border bg-background/90 backdrop-blur">
      <div class="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <Button type="button" variant="ghost" size="sm" class="text-muted-foreground" @click="goEditor">
          <ArrowLeft class="mr-1.5 size-4" />
          返回编辑器
        </Button>
        <h1 class="text-sm font-semibold">
          设置
        </h1>
        <div class="w-24" />
      </div>
    </header>

    <div class="mx-auto grid max-w-5xl gap-6 px-6 py-8 md:grid-cols-[200px_minmax(0,1fr)]">
      <!-- Section nav -->
      <nav class="md:sticky md:top-6 md:self-start">
        <ul class="grid gap-1">
          <li v-for="s in sections" :key="s.id">
            <button
              type="button"
              :disabled="s.disabled"
              class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors"
              :class="[
                s.disabled
                  ? 'cursor-not-allowed text-muted-foreground/50'
                  : 'hover:bg-muted/60',
                activeSection === s.id && !s.disabled
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-foreground',
              ]"
              @click="selectSection(s.id)"
            >
              <component :is="s.icon" class="size-4 shrink-0" />
              <span class="flex-1 truncate">{{ s.label }}</span>
              <span
                v-if="s.disabled"
                class="rounded-full bg-muted px-1.5 py-0.5 text-[10px] uppercase text-muted-foreground"
              >
                即将
              </span>
            </button>
          </li>
        </ul>
      </nav>

      <!-- Content -->
      <main class="grid gap-4">
        <!-- 账号 -->
        <PanelShell v-show="activeSection === 'account'" as="section" tone="neutral" radius="lg" padding="lg" class="grid gap-4">
          <SectionHeader :icon="UserIcon" title="账号">
            <template #description>
              管理登录身份与 AI 调用配额。工具本身永久免费，登录不收费。
            </template>
          </SectionHeader>

          <div v-if="auth.isAuthenticated" class="grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start">
            <div class="flex size-14 items-center justify-center overflow-hidden rounded-full bg-muted ring-1 ring-border">
              <img v-if="auth.user?.avatarUrl" :src="auth.user.avatarUrl" :alt="auth.user.login" class="h-full w-full object-cover">
              <UserIcon v-else class="size-6 text-muted-foreground" />
            </div>
            <div class="grid gap-1">
              <div class="flex flex-wrap items-center gap-2">
                <p class="text-base font-semibold">
                  {{ auth.user?.name || auth.user?.login }}
                </p>
                <StatusBadge :tone="auth.isPro ? 'warning' : 'neutral'" :icon="auth.isPro ? Crown : undefined">
                  {{ auth.isPro ? QUOTA_PACK_LABEL : '免费使用' }}
                </StatusBadge>
              </div>
              <p class="text-xs text-muted-foreground">
                {{ auth.user?.email || `@${auth.user?.login}` }}
              </p>
              <p v-if="quotaRemaining !== null" class="mt-2 text-xs text-muted-foreground">
                AI 调用配额:
                <span class="font-medium text-foreground">{{ auth.aiQuota?.used }} / {{ auth.aiQuota?.limit }}</span>
                · 今日剩余 <span class="font-medium text-foreground">{{ quotaRemaining }}</span> 次
              </p>
            </div>
          </div>

          <div v-else class="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm leading-relaxed text-muted-foreground">
            <p>未登录。使用邮箱注册或登录后，AI 调用会按账号计配额；登录与工具使用均免费，充值仅为购买大模型算力。</p>
            <Button type="button" class="mt-3 gap-1.5" @click="auth.startLogin()">
              <Mail class="size-4" />
              登录 / 注册
            </Button>
          </div>

          <div v-if="auth.isAuthenticated" class="flex flex-wrap gap-2">
            <Button v-if="!auth.isPro" type="button" variant="default" @click="goPricing">
              <Crown class="mr-1.5 size-4" />
              充值 AI 额度
            </Button>
            <Button type="button" variant="outline" @click="auth.logout()">
              <LogOut class="mr-1.5 size-4" />
              退出登录
            </Button>
          </div>
        </PanelShell>

        <!-- 创作名片 -->
        <PanelShell v-show="activeSection === 'creator'" as="section" tone="neutral" radius="lg" padding="lg" class="grid gap-4">
          <SectionHeader :icon="PenLine" title="创作名片">
            <template #description>
              每个登录账号拥有独立创作标签；平台账号检测后会写入名片，下次登录仍可查看。站长预设「安东尼 / tuaran」仅绑定 {{ 'tuaran666@gmail.com' }}。
            </template>
          </SectionHeader>

          <div v-if="!auth.isAuthenticated" class="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
            登录后可创建并保存你的创作名片标签。
            <Button type="button" class="mt-3 gap-1.5" @click="auth.startLogin()">
              <Mail class="size-4" />
              登录 / 注册
            </Button>
          </div>

          <div v-else class="grid gap-4">
            <div class="grid gap-3">
              <label class="grid gap-1.5 text-sm">
                <span class="font-medium">标签 ID</span>
                <Input
                  v-model="creatorForm.creatorId"
                  :disabled="creatorProfile.isSiteOwner"
                  :placeholder="`小写字母/数字，${CREATOR_ID_MIN_LEN}-${CREATOR_ID_MAX_LEN} 位`"
                  class="font-mono"
                  :class="creatorIdError ? 'border-red-500/60 focus-visible:ring-red-500/30' : ''"
                />
                <span class="text-xs text-muted-foreground">
                  名片 URL：<span class="font-mono">/creator-offer/{{ creatorIdPreview || 'your-id' }}</span>
                  <template v-if="creatorProfile.isSiteOwner"> · 站长固定为 tuaran</template>
                </span>
                <span v-if="creatorIdError" class="text-xs text-red-600 dark:text-red-400">
                  {{ creatorIdError }}
                </span>
              </label>
              <label class="grid gap-1.5 text-sm">
                <span class="font-medium">展示名称</span>
                <Input v-model="creatorForm.displayName" placeholder="如：你的笔名或品牌名" />
              </label>
              <label class="grid gap-1.5 text-sm">
                <span class="font-medium">一句话介绍</span>
                <Input v-model="creatorForm.tagline" placeholder="如：技术写作 · 多平台同步" />
              </label>
              <label class="grid gap-1.5 text-sm">
                <span class="font-medium">主页链接（可选）</span>
                <Input v-model="creatorForm.homepage" placeholder="https://" />
              </label>
            </div>

            <div class="rounded-lg border border-border/70 bg-muted/20 p-3">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p class="text-sm font-medium">
                    品牌方只读分享
                  </p>
                  <p class="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                    开启后生成带 token 的链接，品牌方可无需登录预览创作名片。
                  </p>
                </div>
                <label class="inline-flex items-center gap-2 text-sm">
                  <input v-model="creatorForm.shareEnabled" type="checkbox" class="size-4 rounded border-border">
                  开启分享
                </label>
              </div>
              <div v-if="creatorProfile.brandShareUrl" class="mt-3 grid gap-2">
                <p class="break-all font-mono text-[11px] text-muted-foreground">
                  {{ creatorProfile.brandShareUrl }}
                </p>
                <div class="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" @click="copyBrandShareLink">
                    复制分享链接
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    :disabled="regeneratingShareToken"
                    @click="regenerateShareLink"
                  >
                    重置链接
                  </Button>
                </div>
              </div>
              <p v-else class="mt-2 text-xs text-muted-foreground">
                保存并开启分享后，这里会显示品牌方预览链接。
              </p>
            </div>

            <div class="flex flex-wrap gap-2">
              <Button
                type="button"
                :disabled="savingCreatorProfile || !!creatorIdError"
                @click="saveCreatorProfile"
              >
                保存名片信息
              </Button>
              <Button
                v-if="creatorProfile.creatorCardRoutePath"
                type="button"
                variant="outline"
                @click="router.push(creatorProfile.creatorCardRoutePath)"
              >
                预览创作名片
              </Button>
              <Button type="button" variant="outline" @click="router.push({ name: 'distribution' })">
                前往矩阵管理
              </Button>
            </div>
          </div>
        </PanelShell>

        <!-- AI -->
        <PanelShell v-show="activeSection === 'ai'" as="section" tone="neutral" radius="lg" padding="lg" class="grid gap-4">
          <SectionHeader :icon="Bot" title="AI 助手">
            <template #description>
              DeepSeek 二创、AI 配图与文本润色相关的开关与状态。
            </template>
          </SectionHeader>

          <div class="grid gap-3 text-sm">
            <div class="flex items-start justify-between gap-3 rounded-lg border border-border/70 bg-muted/30 p-3">
              <div>
                <p class="font-medium">
                  DeepSeek 直接生成
                </p>
                <p class="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  密钥由后端代理保管;登录账号后按账号计配额,否则可在二创页输入共享密码临时解锁。
                </p>
              </div>
              <StatusBadge :tone="auth.isAuthenticated ? 'info' : 'neutral'">
                {{ auth.isAuthenticated ? '账号登录' : '未登录' }}
              </StatusBadge>
            </div>

            <div v-if="quotaRemaining !== null" class="rounded-lg border border-border/70 bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
              <p class="mb-1">
                <span class="font-medium text-foreground">本日配额</span>:
                {{ auth.aiQuota?.used }} / {{ auth.aiQuota?.limit }},剩余
                <span class="font-medium text-foreground">{{ quotaRemaining }}</span> 次
              </p>
              <p>窗口在每日 UTC 0 点重置。免费用户每日 {{ FREE_DAILY_AI_QUOTA }} 次；充值后每日 {{ TOPUP_DAILY_AI_QUOTA }} 次（成本价中转，平台不收费）。</p>
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <Button type="button" variant="outline" @click="router.push({ name: 'creation' })">
              <Wand2 class="mr-1.5 size-4" />
              去写文章
            </Button>
            <Button v-if="!auth.isPro" type="button" variant="default" @click="goPricing">
              <Crown class="mr-1.5 size-4" />
              充值 AI 额度
            </Button>
          </div>
        </PanelShell>

        <!-- 主题 -->
        <PanelShell v-show="activeSection === 'theme'" as="section" tone="neutral" radius="lg" padding="lg" class="grid gap-4">
          <SectionHeader :icon="Palette" title="主题与样式">
            <template #description>
              选择渲染主题。字体、字号、段距等细粒度调整请在编辑器右上「样式」面板里完成。
            </template>
          </SectionHeader>

          <div class="grid gap-2 sm:grid-cols-3">
            <button
              v-for="opt in themeOptions"
              :key="opt.value"
              type="button"
              class="grid gap-1 rounded-xl border p-3 text-left transition-colors"
              :class="[
                currentTheme === opt.value
                  ? 'border-primary/60 bg-primary/[0.04] ring-2 ring-primary/20'
                  : 'border-border bg-card hover:border-border/100 hover:bg-muted/40',
              ]"
              @click="pickTheme(opt.value)"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium">{{ opt.label }}</span>
                <span
                  v-if="currentTheme === opt.value"
                  class="rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-primary"
                >
                  当前
                </span>
              </div>
              <span class="text-xs leading-relaxed text-muted-foreground">
                {{ opt.description }}
              </span>
            </button>
          </div>

          <Button type="button" variant="outline" class="w-fit" @click="goEditor">
            <PenLine class="mr-1.5 size-4" />
            回到编辑器调整细节
          </Button>
        </PanelShell>

        <!-- 发布通道 / 快捷命令 占位 -->
        <PanelShell v-show="activeSection === 'publishing'" as="section" tone="muted" radius="lg" padding="lg" flat>
          <SectionHeader :icon="Send" title="发布通道（即将上线）">
            <template #description>
              统一管理微信公众号 / 知乎 / 掘金等平台的草稿写入凭证。当前仍走原有的「发布」对话框。
            </template>
          </SectionHeader>
        </PanelShell>

        <PanelShell v-show="activeSection === 'quick-commands'" as="section" tone="muted" radius="lg" padding="lg" flat>
          <SectionHeader :icon="Zap" title="快捷命令（即将上线）">
            <template #description>
              自定义二创提示词、批量分发模板与文本润色 prompts。
            </template>
          </SectionHeader>
        </PanelShell>
      </main>
    </div>
  </div>
</template>
