/**
 * Auth store — tracks the currently logged-in Syncblog user (via
 * `/api/auth/me`) and orchestrates email/password auth flows.
 *
 * The Worker reads an HttpOnly cookie, so the store never sees the session
 * token. Login/register APIs set that cookie server-side; the SPA only keeps
 * the public user snapshot.
 */

import type { PublicUser } from '@/types/auth'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

interface MeResponse {
  user: PublicUser | null
}

interface AuthResponse {
  ok: boolean
  user?: PublicUser
  error?: string
}

export const useAuthStore = defineStore(`auth`, () => {
  const user = ref<PublicUser | null>(null)
  /** `'idle'` before first refresh; `'loading'` while in flight; `'ready'` after. */
  const status = ref<'idle' | 'loading' | 'ready' | 'error'>(`idle`)
  const error = ref<string | null>(null)
  const authDialogOpen = ref(false)
  const authDialogMode = ref<'login' | 'register'>(`login`)

  const isAuthenticated = computed(() => user.value !== null)
  const isPro = computed(() => user.value?.plan === `pro`)
  const aiQuota = computed(() => user.value?.aiQuota ?? null)

  async function refresh(): Promise<void> {
    status.value = `loading`
    error.value = null
    try {
      const res = await fetch(`/api/auth/me`, {
        method: `GET`,
        credentials: `same-origin`,
        headers: { Accept: `application/json` },
      })
      if (!res.ok) {
        // Tolerate "backend not present" states:
        //   503 — Worker is up but DB/SESSION_SECRET secrets missing
        //   404 — running under `pnpm web dev` (Vite-only, no Worker)
        // Both should resolve to "anonymous" without surfacing an error.
        if (res.status === 503 || res.status === 404) {
          user.value = null
          status.value = `ready`
          return
        }
        throw new Error(`auth/me ${res.status}`)
      }
      const data = await res.json() as MeResponse
      user.value = data.user
      status.value = `ready`
    }
    catch (e) {
      // Network-level failure → also degrade to anonymous, but keep `error`
      // populated for the UI to optionally surface.
      user.value = null
      error.value = e instanceof Error ? e.message : String(e)
      status.value = `ready`
    }
  }

  function startLogin(mode: 'login' | 'register' = `login`): void {
    authDialogMode.value = mode
    authDialogOpen.value = true
  }

  async function sendEmailCode(email: string, purpose: 'register' | 'reset_password' = `register`): Promise<void> {
    const res = await fetch(`/api/auth/email/send-code`, {
      method: `POST`,
      credentials: `same-origin`,
      headers: {
        'Accept': `application/json`,
        'Content-Type': `application/json`,
      },
      body: JSON.stringify({ email, purpose }),
    })
    const data = await res.json().catch(() => ({})) as AuthResponse
    if (!res.ok || data.ok === false)
      throw new Error(data.error || `验证码发送失败 (${res.status})`)
  }

  async function login(email: string, password: string): Promise<void> {
    const res = await fetch(`/api/auth/login`, {
      method: `POST`,
      credentials: `same-origin`,
      headers: {
        'Accept': `application/json`,
        'Content-Type': `application/json`,
      },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json().catch(() => ({})) as AuthResponse
    if (!res.ok || !data.user)
      throw new Error(data.error || `登录失败 (${res.status})`)
    user.value = data.user
    authDialogOpen.value = false
  }

  async function register(email: string, password: string, code: string): Promise<void> {
    const res = await fetch(`/api/auth/register`, {
      method: `POST`,
      credentials: `same-origin`,
      headers: {
        'Accept': `application/json`,
        'Content-Type': `application/json`,
      },
      body: JSON.stringify({ email, password, code }),
    })
    const data = await res.json().catch(() => ({})) as AuthResponse
    if (!res.ok || !data.user)
      throw new Error(data.error || `注册失败 (${res.status})`)
    user.value = data.user
    authDialogOpen.value = false
  }

  async function logout(): Promise<void> {
    try {
      await fetch(`/api/auth/logout`, {
        method: `POST`,
        credentials: `same-origin`,
      })
    }
    catch {
      // Best-effort — cookie clear is idempotent.
    }
    user.value = null
  }

  return {
    user,
    status,
    error,
    authDialogOpen,
    authDialogMode,
    isAuthenticated,
    isPro,
    aiQuota,
    refresh,
    startLogin,
    sendEmailCode,
    login,
    register,
    logout,
  }
})
