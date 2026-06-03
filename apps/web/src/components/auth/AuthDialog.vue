<script setup lang="ts">
import { Loader2, Mail, Send } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { useAuthStore } from '@/stores/auth'
import { toast } from '@/utils/toast'

const auth = useAuthStore()

const loginEmail = ref(``)
const loginPassword = ref(``)
const registerEmail = ref(``)
const registerPassword = ref(``)
const registerCode = ref(``)
const submitting = ref(false)
const sendingCode = ref(false)
const countdown = ref(0)
let countdownTimer: ReturnType<typeof setInterval> | null = null

const codeButtonLabel = computed(() => {
  if (sendingCode.value)
    return `发送中`
  if (countdown.value > 0)
    return `${countdown.value}s`
  return `发送验证码`
})

function stopCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

function startCountdown() {
  stopCountdown()
  countdown.value = 60
  countdownTimer = setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0)
      stopCountdown()
  }, 1000)
}

async function handleSendCode() {
  if (countdown.value > 0 || sendingCode.value)
    return
  sendingCode.value = true
  try {
    await auth.sendEmailCode(registerEmail.value, `register`)
    toast.success(`验证码已发送`)
    startCountdown()
  }
  catch (err) {
    toast.error(err instanceof Error ? err.message : `验证码发送失败`)
  }
  finally {
    sendingCode.value = false
  }
}

async function handleLogin() {
  if (submitting.value)
    return
  submitting.value = true
  try {
    await auth.login(loginEmail.value, loginPassword.value)
    toast.success(`已登录`)
  }
  catch (err) {
    toast.error(err instanceof Error ? err.message : `登录失败`)
  }
  finally {
    submitting.value = false
  }
}

async function handleRegister() {
  if (submitting.value)
    return
  submitting.value = true
  try {
    await auth.register(registerEmail.value, registerPassword.value, registerCode.value)
    toast.success(`注册成功`)
  }
  catch (err) {
    toast.error(err instanceof Error ? err.message : `注册失败`)
  }
  finally {
    submitting.value = false
  }
}

watch(() => auth.authDialogMode, (mode) => {
  if (mode === `register` && !registerEmail.value && loginEmail.value)
    registerEmail.value = loginEmail.value
  if (mode === `login` && !loginEmail.value && registerEmail.value)
    loginEmail.value = registerEmail.value
})

watch(() => auth.authDialogOpen, (open) => {
  if (!open) {
    submitting.value = false
    sendingCode.value = false
  }
})
</script>

<template>
  <Dialog v-model:open="auth.authDialogOpen">
    <DialogContent class="sm:max-w-[400px]">
      <DialogHeader>
        <DialogTitle>账号登录</DialogTitle>
        <DialogDescription>
          使用邮箱和密码登录 SyncBlog。
        </DialogDescription>
      </DialogHeader>

      <Tabs v-model="auth.authDialogMode" class="grid gap-4">
        <TabsList class="grid w-full grid-cols-2">
          <TabsTrigger value="login">
            登录
          </TabsTrigger>
          <TabsTrigger value="register">
            注册
          </TabsTrigger>
        </TabsList>

        <TabsContent value="login" class="mt-0">
          <form class="grid gap-4" @submit.prevent="handleLogin">
            <div class="grid gap-2">
              <Label for="auth-login-email">邮箱</Label>
              <Input
                id="auth-login-email"
                v-model="loginEmail"
                type="email"
                autocomplete="email"
                placeholder="you@example.com"
              />
            </div>

            <div class="grid gap-2">
              <Label for="auth-login-password">密码</Label>
              <PasswordInput
                id="auth-login-password"
                v-model="loginPassword"
                autocomplete="current-password"
                placeholder="至少 8 位"
              />
            </div>

            <Button type="submit" class="w-full gap-1.5" :disabled="submitting">
              <Loader2 v-if="submitting" class="size-4 animate-spin" />
              <Mail v-else class="size-4" />
              登录
            </Button>
          </form>
        </TabsContent>

        <TabsContent value="register" class="mt-0">
          <form class="grid gap-4" @submit.prevent="handleRegister">
            <div class="grid gap-2">
              <Label for="auth-register-email">邮箱</Label>
              <Input
                id="auth-register-email"
                v-model="registerEmail"
                type="email"
                autocomplete="email"
                placeholder="you@example.com"
              />
            </div>

            <div class="grid gap-2">
              <Label for="auth-register-password">密码</Label>
              <PasswordInput
                id="auth-register-password"
                v-model="registerPassword"
                autocomplete="new-password"
                placeholder="至少 8 位"
              />
            </div>

            <div class="grid gap-2">
              <Label for="auth-register-code">邮箱验证码</Label>
              <div class="grid grid-cols-[minmax(0,1fr)_112px] gap-2">
                <Input
                  id="auth-register-code"
                  v-model="registerCode"
                  inputmode="numeric"
                  autocomplete="one-time-code"
                  maxlength="6"
                  placeholder="6 位数字"
                />
                <Button
                  type="button"
                  variant="outline"
                  class="gap-1.5 px-2"
                  :disabled="sendingCode || countdown > 0"
                  @click="handleSendCode"
                >
                  <Loader2 v-if="sendingCode" class="size-4 animate-spin" />
                  <Send v-else class="size-4" />
                  <span class="truncate">{{ codeButtonLabel }}</span>
                </Button>
              </div>
            </div>

            <Button type="submit" class="w-full gap-1.5" :disabled="submitting">
              <Loader2 v-if="submitting" class="size-4 animate-spin" />
              <Mail v-else class="size-4" />
              注册并登录
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </DialogContent>
  </Dialog>
</template>
