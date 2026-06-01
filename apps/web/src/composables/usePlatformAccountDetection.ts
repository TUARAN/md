import type { PostAccount } from '@md/shared/types'
import { getPlatformLoginUrl, normalizePlatformType } from '@/constants/platforms'
import { useSocialAccountsStore } from '@/stores/socialAccounts'
import { getPublishExtension } from '@/utils/publishExtensions'
import { toast } from '@/utils/toast'

const allAccounts = ref<PostAccount[]>([])
const extensionInstalled = ref(false)
const isCheckingLogin = ref(false)

/** 发布插件账号检测的兜底超时（ms）：超过即视为检测结束，复位状态 */
const PUBLISH_EXTENSION_DETECTION_TIMEOUT_MS = 15000

let extensionProbeStarted = false
let cacheWatchStarted = false

/** 扩展可能上报旧 key（如 twitter）；统一收敛成 canonical type */
function withCanonicalType(account: PostAccount): PostAccount {
  return { ...account, type: normalizePlatformType(account.type) }
}

function getInitialPlatforms(): PostAccount[] {
  const publishExtension = getPublishExtension()
  if (publishExtension !== undefined && typeof publishExtension.getPlatforms === `function`) {
    return publishExtension.getPlatforms().map(p => ({
      ...withCanonicalType(p),
      checked: false,
      loggedIn: false,
      isChecking: true,
    }))
  }
  return []
}

function finishDetectionWithToast() {
  const socialAccountsStore = useSocialAccountsStore()
  socialAccountsStore.cacheFromPostAccounts(allAccounts.value)
  const loggedIn = allAccounts.value.filter(a => a.loggedIn).length
  if (loggedIn > 0)
    toast.success(`账号检测完成，已识别 ${loggedIn} 个已登录平台`)
  else if (!extensionInstalled.value)
    toast.error(`未检测到 SyncBlog 发布插件，请先安装并刷新页面`)
  else
    toast.info(`检测完成，暂无已登录平台；可先点「登录」完成平台登录后再检测`)
}

function startLoginDetection(options?: { silent?: boolean }) {
  const silent = options?.silent ?? false

  const publishExtension = getPublishExtension()
  if (publishExtension !== undefined) {
    const initialPlatforms = getInitialPlatforms()
    if (initialPlatforms.length > 0)
      allAccounts.value = initialPlatforms

    isCheckingLogin.value = true
    let settled = false
    let timeoutId: ReturnType<typeof setTimeout>

    // 检测的唯一收口：发布插件正常回调或超时兜底都走这里。复位必须无条件执行——
    // 否则插件推送部分进度后不回调完成，会让检测态永久卡住、「重新检测」按钮永久禁用。
    const settle = () => {
      if (settled)
        return
      settled = true
      clearTimeout(timeoutId)
      allAccounts.value = allAccounts.value.map(a => ({ ...a, isChecking: false }))
      isCheckingLogin.value = false
      if (!silent)
        finishDetectionWithToast()
    }

    timeoutId = setTimeout(settle, PUBLISH_EXTENSION_DETECTION_TIMEOUT_MS)

    if (typeof publishExtension.getAccountsProgressive === `function`) {
      publishExtension.getAccountsProgressive(
        (account: PostAccount) => {
          const canonical = withCanonicalType(account)
          const idx = allAccounts.value.findIndex(a => a.type === canonical.type)
          if (idx !== -1)
            allAccounts.value[idx] = { ...canonical, checked: false, isChecking: false }
        },
        settle,
      )
    }
    else if (typeof publishExtension.getAccounts === `function`) {
      publishExtension.getAccounts((resp: PostAccount[]) => {
        allAccounts.value = resp.map(a => ({ ...withCanonicalType(a), checked: false, isChecking: false }))
        settle()
      })
    }
    else {
      settle()
    }
    return
  }

  if (!silent)
    finishDetectionWithToast()
}

function ensureExtensionProbe() {
  if (extensionProbeStarted)
    return
  extensionProbeStarted = true

  let extensionDetectionStarted = false
  const probe = () => {
    if (getPublishExtension() !== undefined) {
      extensionInstalled.value = true
      if (!extensionDetectionStarted) {
        extensionDetectionStarted = true
        startLoginDetection({ silent: true })
      }
    }
  }
  probe()
  let count = 0
  const timer = setInterval(() => {
    probe()
    count++
    if (count > 10)
      clearInterval(timer)
  }, 500)
}

function ensureCacheWatch() {
  if (cacheWatchStarted)
    return
  cacheWatchStarted = true
  const socialAccountsStore = useSocialAccountsStore()
  watch(allAccounts, (accounts) => {
    socialAccountsStore.cacheFromPostAccounts(accounts)
  }, { deep: true })
}

export function usePlatformAccountDetection() {
  ensureCacheWatch()

  const loggedInCount = computed(() => allAccounts.value.filter(a => a.loggedIn).length)
  const hasPublishExtension = computed(
    () => extensionInstalled.value,
  )

  async function redetectAccounts() {
    if (isCheckingLogin.value) {
      toast.info(`正在检测账号，请稍候…`)
      return
    }

    if (getPublishExtension() !== undefined)
      extensionInstalled.value = true

    toast.info(`正在通过 SyncBlog 发布插件重新检测已登录账号…`)
    startLoginDetection({ silent: false })
  }

  function cacheAccountsToProfile() {
    useSocialAccountsStore().cacheFromPostAccounts(allAccounts.value)
  }

  onBeforeMount(() => {
    ensureExtensionProbe()
  })

  return {
    allAccounts,
    extensionInstalled,
    isCheckingLogin,
    loggedInCount,
    hasPublishExtension,
    getPlatformLoginUrl,
    startLoginDetection,
    redetectAccounts,
    cacheAccountsToProfile,
    ensureExtensionProbe,
  }
}
