import type { PostAccount } from '@md/shared/types'
import type { PublicCreatorProfile, PublicSocialAccount } from '@/utils/socialAccounts'
import { TUARAN_CREATOR_ID } from '@/constants/creatorOffer'
import { addPrefix } from '@/utils'
import { creatorCardRoute } from '@/utils/creatorRoutes'
import {
  applyProfileHomeUrls,
  createCreatorProfile,
  mergeDefaultProfileAccounts,
  normalizePublicSocialAccounts,
  repairCreatorProfile,
} from '@/utils/socialAccounts'
import { store } from '@/utils/storage'

/** 创作名片（安东尼个人 IP 对外页） */
export const CREATOR_CARD_ROUTE = creatorCardRoute(TUARAN_CREATOR_ID)
/** 编辑器「创作名片」入口 */
export const CREATOR_PROFILE_ROUTE = CREATOR_CARD_ROUTE

export const useSocialAccountsStore = defineStore(`socialAccounts`, () => {
  const accounts = store.reactive<PublicSocialAccount[]>(addPrefix(`creator-social-accounts`), [])
  const profile = store.reactive<PublicCreatorProfile | null>(addPrefix(`creator-profile`), null)

  const activeAccounts = computed(() =>
    mergeDefaultProfileAccounts(
      applyProfileHomeUrls(accounts.value.filter(account => account.loggedIn && account.url)),
    ),
  )
  const activeProfile = computed(() => {
    const base = profile.value ?? createCreatorProfile(activeAccounts.value)
    return repairCreatorProfile(base)
  })

  function cacheFromPostAccounts(postAccounts: PostAccount[]) {
    const next = normalizePublicSocialAccounts(postAccounts)
    if (next.length === 0)
      return
    accounts.value = next
    profile.value = createCreatorProfile(next)
  }

  return {
    accounts,
    profile,
    activeAccounts,
    activeProfile,
    cacheFromPostAccounts,
  }
})
