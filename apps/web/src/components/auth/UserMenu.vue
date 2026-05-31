<script setup lang="ts">
import { Crown, Github, LogOut, User as UserIcon } from 'lucide-vue-next'
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const initials = computed(() => {
  const u = auth.user
  if (!u)
    return ``
  const source = u.name?.trim() || u.login || ``
  return source.slice(0, 2).toUpperCase()
})

const quotaLabel = computed(() => {
  const q = auth.aiQuota
  if (!q)
    return ``
  return `AI 配额 ${q.used} / ${q.limit}`
})

function handleLogin() {
  auth.startLogin()
}

async function handleLogout() {
  await auth.logout()
}

function handleUpgrade() {
  window.location.assign(`/pricing`)
}
</script>

<template>
  <!-- Anonymous: single login button -->
  <Button
    v-if="!auth.isAuthenticated"
    type="button"
    variant="ghost"
    size="sm"
    class="h-8 shrink-0 gap-1.5 text-muted-foreground hover:text-foreground"
    :disabled="auth.status === 'loading'"
    @click="handleLogin"
  >
    <Github class="h-4 w-4" />
    <span class="hidden sm:inline">登录</span>
  </Button>

  <!-- Authenticated: avatar + dropdown -->
  <DropdownMenu v-else>
    <DropdownMenuTrigger as-child>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        class="h-8 shrink-0 gap-2 px-2 text-muted-foreground hover:text-foreground"
      >
        <span
          class="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-muted text-[10px] font-semibold uppercase ring-1 ring-border"
        >
          <img
            v-if="auth.user?.avatarUrl"
            :src="auth.user.avatarUrl"
            :alt="auth.user.login"
            class="h-full w-full object-cover"
          >
          <UserIcon v-else class="h-3.5 w-3.5" />
        </span>
        <span class="hidden text-xs font-medium sm:inline">
          {{ auth.user?.login }}
        </span>
        <span
          v-if="auth.isPro"
          class="hidden items-center gap-0.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-800 dark:bg-amber-500/15 dark:text-amber-300 sm:inline-flex"
        >
          <Crown class="h-2.5 w-2.5" />
          Pro
        </span>
      </Button>
    </DropdownMenuTrigger>

    <DropdownMenuContent align="end" class="w-60">
      <DropdownMenuLabel class="flex items-center gap-2 px-2 py-1.5">
        <span
          class="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-semibold uppercase ring-1 ring-border"
        >
          <img
            v-if="auth.user?.avatarUrl"
            :src="auth.user.avatarUrl"
            :alt="auth.user.login"
            class="h-full w-full object-cover"
          >
          <template v-else>
            {{ initials }}
          </template>
        </span>
        <span class="flex min-w-0 flex-col">
          <span class="truncate text-sm font-medium">
            {{ auth.user?.name || auth.user?.login }}
          </span>
          <span class="truncate text-[11px] text-muted-foreground">
            {{ auth.user?.email || `@${auth.user?.login}` }}
          </span>
        </span>
      </DropdownMenuLabel>

      <DropdownMenuSeparator />

      <div class="px-2 py-1.5 text-[11px] text-muted-foreground">
        <div class="flex items-center justify-between gap-2">
          <span>{{ quotaLabel }}</span>
          <span class="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase">
            {{ auth.user?.plan }}
          </span>
        </div>
      </div>

      <DropdownMenuSeparator />

      <DropdownMenuItem
        v-if="!auth.isPro"
        class="gap-2 text-amber-900 focus:bg-amber-50 focus:text-amber-900 dark:text-amber-200"
        @select="handleUpgrade"
      >
        <Crown class="h-4 w-4" />
        升级到 Pro
      </DropdownMenuItem>

      <DropdownMenuItem class="gap-2" @select="handleLogout">
        <LogOut class="h-4 w-4" />
        退出登录
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
