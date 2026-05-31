<script setup lang="ts">
import { Copy, KeyRound, Lock, LockOpen, Send, Sparkles, Square } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { PanelShell, SectionHeader, StatusBadge, Toolbar } from '@/components/ui/layout'
import { PasswordInput } from '@/components/ui/password-input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'
import { useAuthStore } from '@/stores/auth'
import { useEditorStore } from '@/stores/editor'
import { copyPlain } from '@/utils/clipboard'
import {
  DEEPSEEK_CHAT_ENDPOINT,
  DEEPSEEK_MODELS,
  getDeepSeekPassword,
  isDeepSeekUnlocked,
  lockDeepSeek,
  unlockDeepSeek,
} from '@/utils/deepseekClient'
import { toast } from '@/utils/toast'

const props = defineProps<{
  prompt: string
}>()

const editorStore = useEditorStore()
const auth = useAuthStore()

const model = ref<string>(DEEPSEEK_MODELS[0].value)
const output = ref<string>(``)
const reasoning = ref<string>(``)
const generating = ref(false)
const unlocked = ref(isDeepSeekUnlocked())

/** True when the current request can be authenticated by session cookie alone. */
const useSessionAuth = computed(() => auth.isAuthenticated)
/** True when we can call DeepSeek right now without prompting the user. */
const canGenerate = computed(() => useSessionAuth.value || unlocked.value)

const passwordDialogOpen = ref(false)
const passwordInput = ref(``)
const passwordError = ref(``)
const unlocking = ref(false)

let abortController: AbortController | null = null

const activeModelMeta = computed(() => DEEPSEEK_MODELS.find(m => m.value === model.value))

function openPasswordDialog() {
  passwordInput.value = ``
  passwordError.value = ``
  passwordDialogOpen.value = true
}

async function submitPassword() {
  if (!passwordInput.value) {
    passwordError.value = `请输入密码`
    return
  }
  unlocking.value = true
  passwordError.value = ``
  try {
    await unlockDeepSeek(passwordInput.value)
    unlocked.value = true
    passwordDialogOpen.value = false
    toast.success(`已解锁 DeepSeek`)
    void runGenerate()
  }
  catch (e) {
    passwordError.value = (e as Error).message || `解锁失败`
  }
  finally {
    unlocking.value = false
  }
}

function handleLock() {
  lockDeepSeek()
  unlocked.value = false
  toast.success(`已锁定 DeepSeek`)
}

function handleGenerate() {
  if (!props.prompt || !props.prompt.trim()) {
    toast.error(`提示词为空，请先准备素材`)
    return
  }
  if (!canGenerate.value) {
    // Anonymous user without a password unlock: prefer login if backend
    // supports it, otherwise fall back to the legacy password gate.
    openPasswordDialog()
    return
  }
  void runGenerate()
}

async function runGenerate() {
  const headers: Record<string, string> = {
    'Content-Type': `application/json`,
  }

  if (useSessionAuth.value) {
    // Session cookie handles auth — no header needed.
  }
  else {
    const password = getDeepSeekPassword()
    if (!password) {
      unlocked.value = false
      openPasswordDialog()
      return
    }
    headers[`x-deepseek-password`] = password
  }

  output.value = ``
  reasoning.value = ``
  generating.value = true
  abortController = new AbortController()

  try {
    const res = await window.fetch(DEEPSEEK_CHAT_ENDPOINT, {
      method: `POST`,
      credentials: `same-origin`,
      headers,
      body: JSON.stringify({
        model: model.value,
        stream: true,
        messages: [
          { role: `user`, content: props.prompt },
        ],
      }),
      signal: abortController.signal,
    })

    if (res.status === 429) {
      const data = await res.json().catch(() => ({} as { error?: string }))
      throw new Error(data?.error || `今日 AI 配额已用尽`)
    }

    if (!res.ok || !res.body) {
      const errText = await res.text().catch(() => ``)
      throw new Error(`DeepSeek 响应错误 ${res.status}：${errText.slice(0, 200) || res.statusText}`)
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder(`utf-8`)
    let buffer = ``

    while (true) {
      const { value, done } = await reader.read()
      if (done)
        break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split(`\n`)
      buffer = lines.pop() || ``
      for (const raw of lines) {
        const line = raw.trim()
        if (!line || !line.startsWith(`data:`))
          continue
        const data = line.slice(5).trim()
        if (!data || data === `[DONE]`)
          continue
        try {
          const json = JSON.parse(data)
          const delta = json.choices?.[0]?.delta || {}
          if (delta.reasoning_content)
            reasoning.value += delta.reasoning_content
          if (delta.content)
            output.value += delta.content
        }
        catch {}
      }
    }
  }
  catch (e) {
    if ((e as Error).name === `AbortError`) {
      toast.success(`已停止生成`)
    }
    else {
      const msg = (e as Error).message || `生成失败`
      toast.error(msg)
      if (/401|403/.test(msg)) {
        lockDeepSeek()
        unlocked.value = false
        // Maybe the session expired — refetch auth state so the UI updates.
        void auth.refresh()
      }
    }
  }
  finally {
    generating.value = false
    abortController = null
    // Refresh the quota counter shown in the user menu.
    if (useSessionAuth.value)
      void auth.refresh()
  }
}

function stopGenerate() {
  abortController?.abort()
}

async function copyOutput() {
  if (!output.value.trim()) {
    toast.error(`暂无可复制的结果`)
    return
  }
  try {
    await copyPlain(output.value)
    toast.success(`已复制生成结果`)
  }
  catch {
    toast.error(`复制失败`)
  }
}

function insertOutputIntoEditor() {
  if (!output.value.trim()) {
    toast.error(`暂无可插入的结果`)
    return
  }
  if (!editorStore.editor) {
    toast.error(`编辑器尚未就绪`)
    return
  }
  editorStore.insertAtCursor(output.value)
  toast.success(`已插入到编辑器光标处`)
}
</script>

<template>
  <PanelShell tone="success" radius="xl" padding="lg" class="grid gap-3">
    <SectionHeader :icon="Sparkles" tone="success" title="DeepSeek 直接生成">
      <template #description>
        DeepSeek 调用走后端代理，密钥仅保管在服务端。
        <template v-if="useSessionAuth">
          已登录 <strong>{{ auth.user?.login }}</strong>，今日剩余
          <strong>{{ Math.max(0, (auth.aiQuota?.limit ?? 0) - (auth.aiQuota?.used ?? 0)) }}</strong>
          / {{ auth.aiQuota?.limit }} 次。
        </template>
        <template v-else>
          登录后按账号计配额，或输入共享密码临时解锁（本标签页内有效）。
        </template>
      </template>
      <template #actions>
        <StatusBadge v-if="useSessionAuth" tone="info" :icon="LockOpen">
          账号登录
        </StatusBadge>
        <template v-else>
          <StatusBadge
            :tone="unlocked ? 'success' : 'neutral'"
            :icon="unlocked ? LockOpen : Lock"
          >
            {{ unlocked ? `已解锁` : `未解锁` }}
          </StatusBadge>
          <Button
            v-if="unlocked"
            class="h-7 rounded-md px-2 text-[11px] text-muted-foreground"
            type="button"
            variant="ghost"
            @click="handleLock"
          >
            锁定
          </Button>
        </template>
      </template>
    </SectionHeader>

    <div class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
      <div class="grid gap-1.5">
        <Label class="text-xs text-slate-500 dark:text-muted-foreground">模型</Label>
        <Select v-model="model" :disabled="generating">
          <SelectTrigger class="h-9 rounded-lg border-slate-200 bg-white text-sm dark:border-border dark:bg-background">
            <span class="truncate">{{ activeModelMeta?.label ?? `选择模型` }}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="m in DEEPSEEK_MODELS" :key="m.value" :value="m.value">
              <div class="flex flex-col gap-0.5">
                <span class="text-sm font-medium">{{ m.label }}</span>
                <span class="text-[11px] text-muted-foreground">{{ m.description }}</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="flex items-center gap-2 sm:self-end">
        <Button
          v-if="!generating"
          class="h-9 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700"
          type="button"
          @click="handleGenerate"
        >
          <component :is="canGenerate ? Send : KeyRound" class="mr-1.5 size-3.5" />
          {{ canGenerate ? `用 DeepSeek 生成` : `解锁并生成` }}
        </Button>
        <Button
          v-else
          class="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-border dark:bg-background dark:text-foreground"
          type="button"
          variant="secondary"
          @click="stopGenerate"
        >
          <Square class="mr-1.5 size-3.5" />
          停止
        </Button>
      </div>
      <p class="text-[11px] leading-relaxed text-muted-foreground sm:col-span-2">
        {{ activeModelMeta?.description }}
      </p>
    </div>

    <div class="grid gap-2">
      <Toolbar>
        <span class="text-xs font-semibold text-slate-700 dark:text-foreground">
          生成结果 <span class="ml-1 text-[11px] font-normal text-muted-foreground">{{ activeModelMeta?.label }}</span>
        </span>
        <template #end>
          <Button
            class="h-8 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-border dark:bg-background dark:text-foreground"
            type="button"
            variant="secondary"
            :disabled="!output"
            @click="copyOutput"
          >
            <Copy class="mr-1.5 size-3.5" />
            复制
          </Button>
          <Button
            class="h-8 rounded-md bg-indigo-600 px-3 text-xs font-medium text-white hover:bg-indigo-700"
            type="button"
            :disabled="!output"
            @click="insertOutputIntoEditor"
          >
            <Send class="mr-1.5 size-3.5" />
            插入编辑器
          </Button>
        </template>
      </Toolbar>

      <PanelShell
        v-if="reasoning"
        tone="warning"
        radius="md"
        padding="sm"
        flat
        class="text-[11px] leading-relaxed text-amber-900 dark:text-amber-200"
      >
        <div class="mb-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700/80">
          推理过程（reasoning_content）
        </div>
        <pre class="max-h-32 overflow-auto whitespace-pre-wrap break-words font-mono">{{ reasoning }}</pre>
      </PanelShell>

      <pre
        class="min-h-[160px] flex-1 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-700 dark:border-border dark:bg-background dark:text-foreground"
      >{{ output || (generating ? '正在生成…' : '生成结果将在这里以流式输出。') }}</pre>
    </div>

    <Dialog v-model:open="passwordDialogOpen">
      <DialogContent class="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2 text-base">
            <KeyRound class="size-4" />
            解锁 DeepSeek
          </DialogTitle>
          <DialogDescription>
            为防止密钥被随意调用，DeepSeek 功能需要输入密码解锁。解锁状态仅在当前浏览器标签页内有效。
          </DialogDescription>
        </DialogHeader>

        <form class="grid gap-3" @submit.prevent="submitPassword">
          <div class="grid gap-1.5">
            <Label class="text-xs text-muted-foreground">密码</Label>
            <PasswordInput
              v-model="passwordInput"
              placeholder="请输入解锁密码"
              :class="passwordError ? 'border-red-500 focus-visible:ring-red-500' : ''"
            />
            <p v-if="passwordError" class="text-xs text-red-600">
              {{ passwordError }}
            </p>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" @click="passwordDialogOpen = false">
              取消
            </Button>
            <Button type="submit" :disabled="unlocking">
              {{ unlocking ? `解锁中…` : `解锁` }}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </PanelShell>
</template>
