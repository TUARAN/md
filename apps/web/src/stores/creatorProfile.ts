import type { PublicCreatorProfileView, UserCreatorProfile, UserCreatorProfilePayload } from '@/types/creatorProfile'
import type { PublicSocialAccount } from '@/utils/socialAccounts'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { isSiteOwnerEmail } from '@/constants/siteOwner'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import { addPrefix } from '@/utils'
import { buildCreatorShareUrl, creatorCardRoute, creatorShareRoute } from '@/utils/creatorRoutes'
import { store } from '@/utils/storage'

function profileStorageKey(userId: string) {
  return addPrefix(`creator-profile-user-${userId}`)
}

export const useCreatorProfileStore = defineStore(`creatorProfile`, () => {
  const auth = useAuthStore()
  const uiStore = useUIStore()
  const profile = ref<UserCreatorProfile | null>(null)
  const status = ref<'idle' | 'loading' | 'ready' | 'error'>(`idle`)
  const error = ref<string | null>(null)

  const creatorId = computed(() => profile.value?.creatorId ?? ``)
  const isSiteOwner = computed(() => isSiteOwnerEmail(auth.user?.email))
  const creatorCardRoutePath = computed(() =>
    creatorId.value ? creatorCardRoute(creatorId.value) : ``,
  )
  const brandShareRoutePath = computed(() => {
    const current = profile.value
    if (!current?.shareEnabled || !current.shareToken)
      return ``
    return creatorShareRoute(current.creatorId, current.shareToken)
  })
  const brandShareUrl = computed(() => {
    if (!brandShareRoutePath.value || !profile.value?.shareToken)
      return ``
    if (typeof window === `undefined`)
      return brandShareRoutePath.value
    return buildCreatorShareUrl(
      profile.value.creatorId,
      profile.value.shareToken,
      window.location.origin,
    )
  })

  function saveLocal(userId: string, next: UserCreatorProfile) {
    void store.setJSON(profileStorageKey(userId), next)
  }

  function loadLocal(userId: string): UserCreatorProfile | null {
    try {
      const raw = localStorage.getItem(profileStorageKey(userId))
      if (!raw)
        return null
      return JSON.parse(raw) as UserCreatorProfile
    }
    catch {
      return null
    }
  }

  function applyProfile(next: UserCreatorProfile) {
    profile.value = next
    if (auth.user)
      saveLocal(auth.user.id, next)
    if (next.creatorId)
      uiStore.setWorkflowCreatorId(next.creatorId)
  }

  async function refresh(): Promise<void> {
    if (!auth.isAuthenticated || !auth.user) {
      profile.value = null
      status.value = `ready`
      return
    }

    status.value = `loading`
    error.value = null
    try {
      const res = await fetch(`/api/creator-profile/me`, {
        method: `GET`,
        credentials: `same-origin`,
        headers: { Accept: `application/json` },
      })
      if (res.status === 401) {
        profile.value = null
        status.value = `ready`
        return
      }
      if (res.status === 503 || res.status === 404) {
        const local = loadLocal(auth.user.id)
        if (local)
          applyProfile(local)
        status.value = `ready`
        return
      }
      if (!res.ok)
        throw new Error(`creator-profile ${res.status}`)
      const data = await res.json() as { profile?: UserCreatorProfile }
      if (data.profile)
        applyProfile(data.profile)
      status.value = `ready`
    }
    catch (e) {
      const local = auth.user ? loadLocal(auth.user.id) : null
      if (local)
        profile.value = local
      else
        profile.value = null
      error.value = e instanceof Error ? e.message : String(e)
      status.value = `ready`
    }
  }

  /**
   * 保存结果。`offline=true` 表示后端 D1 未挂或路由 404，仅写入了 localStorage，
   * 调用方应给出明确的"未同步到服务器"提示，避免误以为持久化成功。
   */
  async function save(payload: UserCreatorProfilePayload): Promise<{ offline: boolean }> {
    if (!auth.user)
      return { offline: false }

    const res = await fetch(`/api/creator-profile/me`, {
      method: `PUT`,
      credentials: `same-origin`,
      headers: {
        'Accept': `application/json`,
        'Content-Type': `application/json`,
      },
      body: JSON.stringify(payload),
    })

    if (res.status === 503 || res.status === 404) {
      const local = profile.value ?? {
        creatorId: auth.user.login,
        displayName: auth.user.name || auth.user.login,
        tagline: ``,
        homepage: null,
        contactHint: null,
        socialAccounts: payload.socialAccounts ?? [],
        shareEnabled: payload.shareEnabled ?? false,
        shareToken: null,
        updatedAt: Math.floor(Date.now() / 1000),
      }
      const merged: UserCreatorProfile = {
        ...local,
        creatorId: payload.creatorId ?? local.creatorId,
        displayName: payload.displayName ?? local.displayName,
        tagline: payload.tagline ?? local.tagline,
        homepage: payload.homepage === undefined ? local.homepage : payload.homepage,
        contactHint: payload.contactHint === undefined ? local.contactHint : payload.contactHint,
        socialAccounts: payload.socialAccounts ?? local.socialAccounts,
        shareEnabled: payload.shareEnabled ?? local.shareEnabled,
        shareToken: local.shareToken,
        updatedAt: Math.floor(Date.now() / 1000),
      }
      applyProfile(merged)
      return { offline: true }
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({})) as { error?: string }
      throw new Error(data.error || `保存失败 (${res.status})`)
    }

    const data = await res.json() as { profile?: UserCreatorProfile }
    if (data.profile)
      applyProfile(data.profile)
    return { offline: false }
  }

  async function syncSocialAccounts(accounts: PublicSocialAccount[]): Promise<{ offline: boolean }> {
    if (!auth.isAuthenticated)
      return { offline: false }
    return save({ socialAccounts: accounts })
  }

  async function fetchPublicProfile(creatorId: string, shareToken: string): Promise<PublicCreatorProfileView | null> {
    const params = new URLSearchParams({
      creatorId: creatorId.trim().toLowerCase(),
      token: shareToken.trim().toLowerCase(),
    })
    const res = await fetch(`/api/creator-profile/public?${params.toString()}`, {
      method: `GET`,
      headers: { Accept: `application/json` },
    })
    if (!res.ok)
      return null
    const data = await res.json() as { profile?: PublicCreatorProfileView }
    return data.profile ?? null
  }

  watch(
    () => auth.user?.id,
    (userId, prev) => {
      if (userId === prev)
        return
      if (!userId) {
        profile.value = null
        status.value = `ready`
        return
      }
      void refresh()
    },
    { immediate: true },
  )

  return {
    profile,
    status,
    error,
    creatorId,
    isSiteOwner,
    creatorCardRoutePath,
    brandShareRoutePath,
    brandShareUrl,
    refresh,
    save,
    syncSocialAccounts,
    fetchPublicProfile,
  }
})
