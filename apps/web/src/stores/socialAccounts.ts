import type { PostAccount } from '@md/shared/types'
import type { PublicCreatorProfile, PublicSocialAccount } from '@/utils/socialAccounts'
import { TUARAN_CREATOR_ID } from '@/constants/creatorOffer'
import { addPrefix } from '@/utils'
import { creatorCardRoute } from '@/utils/creatorRoutes'
import {
  applyProfileHomeUrls,
  createCreatorProfile,
  decodeCreatorProfile,
  encodeCreatorProfile,
  mergeDefaultProfileAccounts,
  normalizePublicSocialAccounts,
  repairCreatorProfile,
} from '@/utils/socialAccounts'
import { store } from '@/utils/storage'

const appBasePath = import.meta.env.BASE_URL.startsWith(`.`) ? `/` : import.meta.env.BASE_URL
/** 平台矩阵页（账号检测与主页链接） */
export const PLATFORM_MATRIX_ROUTE = `${appBasePath.replace(/\/$/, ``)}/creator-profile`
export const SOCIAL_ACCOUNTS_ROUTE = PLATFORM_MATRIX_ROUTE
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

  function getShareUrl() {
    const origin = typeof window !== `undefined` ? window.location.origin : ``
    const data = encodeCreatorProfile(activeProfile.value)
    return `${origin}${PLATFORM_MATRIX_ROUTE}?profile=${encodeURIComponent(data)}`
  }

  function readSharedProfile(search = typeof window !== `undefined` ? window.location.search : ``) {
    const params = new URLSearchParams(search)
    const profileData = params.get(`profile`)
    if (profileData) {
      const decoded = decodeCreatorProfile(profileData)
      return decoded ? repairCreatorProfile(decoded) : null
    }

    const legacyAccountsData = params.get(`data`)
    if (legacyAccountsData) {
      const decoded = decodeCreatorProfile(legacyAccountsData)
      return decoded ? repairCreatorProfile(decoded) : null
    }

    return null
  }

  return {
    accounts,
    profile,
    activeAccounts,
    activeProfile,
    cacheFromPostAccounts,
    getShareUrl,
    readSharedProfile,
  }
})
