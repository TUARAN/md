<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/auth'
import DraftTransfer from './DraftTransfer.vue'

const auth = useAuthStore()
const panel = ref<HTMLDetailsElement | null>(null)
const snapshot = ref<{ user: { id: string, name: string } | null, balance: number, checkedInToday: boolean } | null>(null)
const hint = ref('')
const busy = ref(false)
const email = ref('')
const password = ref('')
const legacy = typeof window !== 'undefined' && window.location.hostname === 'syncblog.cn'
let sequence = 0

async function refresh() {
  if (!auth.isPlatform || document.visibilityState !== 'visible')
    return
  const current = ++sequence
  try {
    const response = await fetch('https://2aran.com/api/subsites/session', {
      credentials: 'include',
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    })
    if (!response.ok)
      throw new Error('统一账号暂不可用，请稍后重试')
    const data = await response.json()
    if (data.version !== 1 || !Number.isSafeInteger(data.balance))
      throw new Error('账号响应无效')
    if (current === sequence) { snapshot.value = data; hint.value = '' }
  }
  catch (error) {
    if (current === sequence) { snapshot.value = null; hint.value = error instanceof Error ? error.message : '加载失败' }
  }
}
async function checkin() {
  busy.value = true
  try {
    const response = await fetch('https://2aran.com/api/subsites/checkin', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    })
    const data = await response.json()
    if (!response.ok)
      throw new Error(data.error || '签到失败')
    await refresh()
    hint.value = data.awarded ? `签到成功，获得 ${data.gained} 燃币` : '今天已签到'
  }
  catch (error) { hint.value = error instanceof Error ? error.message : '签到失败' }
  finally { busy.value = false }
}
async function setup(existing: boolean) {
  busy.value = true
  try {
    await auth.setupPlatform(existing ? email.value : undefined, existing ? password.value : undefined)
    hint.value = '工作区已关联，原有 AI 额度保持不变'
  }
  catch (error) { hint.value = error instanceof Error ? error.message : '关联失败' }
  finally { password.value = ''; busy.value = false }
}
function openSetup() {
  if (panel.value)
    panel.value.open = true
}
onMounted(() => {
  void refresh()
  window.addEventListener('focus', refresh)
  document.addEventListener('visibilitychange', refresh)
  window.addEventListener('platform-setup', openSetup)
})
onBeforeUnmount(() => {
  sequence++
  window.removeEventListener('focus', refresh)
  document.removeEventListener('visibilitychange', refresh)
  window.removeEventListener('platform-setup', openSetup)
})
</script>

<template>
  <details v-if="auth.isPlatform || legacy" ref="panel" class="fixed bottom-3 right-3 z-[60] max-h-[80vh] w-[min(360px,calc(100vw-24px))] overflow-auto rounded-xl border bg-background text-foreground shadow-lg">
    <summary class="cursor-pointer px-4 py-2 text-sm font-medium">
      <template v-if="legacy">
        迁移到 2aran 子站 · 导出草稿
      </template>
      <template v-else-if="snapshot">
        2aran · {{ snapshot.user?.name || '游客' }} · 🔥 {{ snapshot.balance }} 燃币
      </template>
      <template v-else>
        2aran 统一账号 · {{ hint || '加载中' }}
      </template>
    </summary>
    <div class="space-y-3 border-t p-4 text-sm">
      <template v-if="legacy">
        <p>原账号与 AI 额度保留。先导出文章草稿，再到新子站登录主站账号并关联原邮箱账号。</p>
        <a href="https://syncblog.2aran.com/" class="underline">打开 syncblog.2aran.com ↗</a>
      </template>
      <template v-else>
        <div class="flex flex-wrap items-center gap-3">
          <a href="https://2aran.com/account" class="underline">统一账户</a>
          <a href="https://2aran.com/ranbi" class="underline">燃币说明</a>
          <Button v-if="!snapshot?.user" size="sm" @click="auth.startLogin()">
            主站登录
          </Button>
          <template v-else>
            <Button size="sm" :disabled="busy || snapshot.checkedInToday" @click="checkin">
              {{ snapshot.checkedInToday ? '已签到' : '每日签到' }}
            </Button>
            <Button size="sm" variant="outline" @click="auth.logout()">
              退出
            </Button>
          </template>
          <Button v-if="!snapshot" size="sm" variant="outline" @click="refresh">
            重试
          </Button>
        </div>
        <p class="text-xs text-muted-foreground">
          燃币与主站共用；现有 AI 额度独立保留，当前不新增燃币扣费。
        </p>
        <form v-if="auth.platform?.needsSetup" class="space-y-2 rounded-lg border p-3" @submit.prevent="setup(true)">
          <p class="font-medium">
            首次使用：关联原账号或创建新工作区
          </p>
          <p class="text-xs">
            已有账号请关联，保留原用户资料与 AI 额度。创建新工作区后不能自行更换关联。
          </p>
          <label class="block">原账号邮箱<Input v-model="email" type="email" required autocomplete="username" maxlength="254" /></label>
          <label class="block">原账号密码<Input v-model="password" type="password" required autocomplete="current-password" maxlength="128" /></label>
          <Button type="submit" size="sm" :disabled="busy">
            验证并关联原账号
          </Button>
          <Button type="button" size="sm" variant="outline" :disabled="busy" @click="setup(false)">
            没有旧账号，创建工作区
          </Button>
        </form>
        <p v-if="auth.error" role="alert">
          账号验证暂不可用，请稍后重试。
        </p>
      </template>
      <DraftTransfer />
      <p v-if="hint" role="status" class="text-xs">
        {{ hint }}
      </p>
    </div>
  </details>
</template>
