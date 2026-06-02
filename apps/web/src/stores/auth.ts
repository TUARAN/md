/**
 * Auth store — tracks the currently logged-in Syncblog user (via
 * `/api/auth/me`) and orchestrates login / logout flows.
 *
 * The Worker reads an HttpOnly cookie, so the store never sees the session
 * token. Login is a top-level navigation to `/api/auth/github/start`; the
 * Worker handles the round-trip and redirects back home, at which point the
 * SPA refetches the user.
 */

import type { PublicUser } from '@/types/auth'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

interface MeResponse {
  user: PublicUser | null
}

export const useAuthStore = defineStore(`auth`, () => {
  const user = ref<PublicUser | null>(null)
  /** `'idle'` before first refresh; `'loading'` while in flight; `'ready'` after. */
  const status = ref<'idle' | 'loading' | 'ready' | 'error'>(`idle`)
  const error = ref<string | null>(null)

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

  function startLogin(): void {
    // Preserve current path so we can deep-link the user back after callback.
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.delete(`returnTo`)
    currentUrl.searchParams.delete(`code`)
    currentUrl.searchParams.delete(`state`)
    currentUrl.searchParams.delete(`error`)
    currentUrl.searchParams.delete(`error_description`)
    const returnTo = `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`
    const startUrl = new URL(`/api/auth/github/start`, window.location.origin)
    startUrl.searchParams.set(`returnTo`, returnTo)
    window.location.assign(startUrl.toString())
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
    isAuthenticated,
    isPro,
    aiQuota,
    refresh,
    startLogin,
    logout,
  }
})
