import type { PostAccount } from '@md/shared/types'
import type { PublicCreatorProfile, PublicSocialAccount } from '@/utils/socialAccounts'
import { useAuthStore } from '@/stores/auth'
import { useCreatorProfileStore } from '@/stores/creatorProfile'
import { addPrefix } from '@/utils'
import {
  applyProfileHomeUrls,
  createCreatorProfile,
  mergeDefaultProfileAccounts,
  normalizePublicSocialAccounts,
  repairCreatorProfile,
} from '@/utils/socialAccounts'
import { store } from '@/utils/storage'

/**
 * 此 store 的写入语义：
 *   - 服务端 `user_creator_profiles.social_accounts_json` 是单一真源。
 *   - 本 store 的 `accounts` 是该真源的本地派生副本（用于离线访问 + 在 server 返回前给出快照）。
 *   - 用户切平台账号被检测到时，仅调一次 `creatorProfile.syncSocialAccounts`，
 *     由它写库 + 触发 watch 把数据反向喂回这里，避免双向覆盖。
 */
function accountsStorageKey(userId: string) {
  return addPrefix(`creator-social-accounts-${userId}`)
}

export const useSocialAccountsStore = defineStore(`socialAccounts`, () => {
  const auth = useAuthStore()
  const creatorProfile = useCreatorProfileStore()

  const accounts = ref<PublicSocialAccount[]>([])
  const scopedUserId = ref<string | null>(null)

  async function hydrateFromUser(userId: string | null) {
    scopedUserId.value = userId
    if (!userId) {
      accounts.value = []
      return
    }
    // 优先用 server profile 的快照（如果已经返回），否则回落 localStorage
    const fromServer = creatorProfile.profile?.socialAccounts
    if (fromServer && fromServer.length) {
      accounts.value = fromServer
      return
    }
    const cached = await store.getJSON<PublicSocialAccount[]>(accountsStorageKey(userId), [])
    accounts.value = cached ?? []
  }

  watch(
    () => auth.user?.id,
    (userId) => {
      void hydrateFromUser(userId ?? null)
    },
    { immediate: true },
  )

  // server 端 profile 的 socialAccounts 是单一真源——任何变化都同步到本地副本与 localStorage
  watch(
    () => creatorProfile.profile?.socialAccounts,
    (next) => {
      const userId = auth.user?.id
      if (!userId || !next)
        return
      accounts.value = next
      void store.setJSON(accountsStorageKey(userId), next)
    },
  )

  const activeAccounts = computed(() => {
    const detected = applyProfileHomeUrls(
      accounts.value.filter(account => account.loggedIn && account.url),
    )
    if (creatorProfile.isSiteOwner)
      return mergeDefaultProfileAccounts(detected)
    return detected
  })

  /**
   * `profile` 由 accounts 派生，不再单独持久化第二份。
   * 站长走 repairCreatorProfile 补全默认数据；普通用户使用纯派生结果。
   */
  const profile = computed<PublicCreatorProfile | null>(() => {
    if (!accounts.value.length)
      return null
    const base = createCreatorProfile(activeAccounts.value)
    if (creatorProfile.isSiteOwner)
      return repairCreatorProfile(base)
    return base
  })
  const activeProfile = profile

  function cacheFromPostAccounts(postAccounts: PostAccount[]) {
    if (!auth.user?.id)
      return
    const next = normalizePublicSocialAccounts(postAccounts)
    if (next.length === 0)
      return
    // 不再就地写 accounts.value：server 写成功后，watch 会把新值喂回。
    // 这样多 tab / 多入口的更新顺序由 creatorProfile.profile 这一根管道串起来。
    void creatorProfile.syncSocialAccounts(next)
  }

  return {
    accounts,
    profile,
    activeAccounts,
    activeProfile,
    cacheFromPostAccounts,
  }
})
