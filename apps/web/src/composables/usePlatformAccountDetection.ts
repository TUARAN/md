import type { PostAccount } from '@md/shared/types'
import type { CoseApi } from '@/utils/publishExtensions'
import { getPlatformLoginUrl, normalizePlatformType } from '@/constants/platforms'
import { useSocialAccountsStore } from '@/stores/socialAccounts'
import {
  mapPluginSyncerAuthToAccounts,
  mergeCoseAndPluginSyncerAccounts,
} from '@/utils/publishExtensions'
import { toast } from '@/utils/toast'

const allAccounts = ref<PostAccount[]>([])
const extensionInstalled = ref(false)
const pluginSyncerScriptPresent = ref(false)
const pluginAuthSnapshot = ref<PostAccount[]>([])
const isCheckingLogin = ref(false)

/** COSE 账号检测的兜底超时（ms）：超过即视为检测结束，复位状态并用 CSYNC 数据补充 */
const COSE_DETECTION_TIMEOUT_MS = 15000

let extensionProbeStarted = false
let cacheWatchStarted = false

/** COSE 可能上报旧 key（如 twitter）；统一收敛成 canonical type */
function withCanonicalType(account: PostAccount): PostAccount {
  return { ...account, type: normalizePlatformType(account.type) }
}

function getCose(): CoseApi | undefined {
  return window.$cose
}

function getInitialPlatforms(): PostAccount[] {
  const cose = getCose()
  if (cose !== undefined && typeof cose.getPlatforms === `function`) {
    return cose.getPlatforms().map(p => ({
      ...withCanonicalType(p),
      checked: false,
      loggedIn: false,
      isChecking: true,
    }))
  }
  return []
}

async function refreshPluginAuth() {
  if (!window.$pluginSyncer?.getPlatforms) {
    pluginAuthSnapshot.value = []
    return
  }
  if (!window.$pluginSyncer.connected) {
    pluginAuthSnapshot.value = []
    return
  }
  try {
    const raw = await window.$pluginSyncer.getPlatforms()
    pluginAuthSnapshot.value = mapPluginSyncerAuthToAccounts(raw)
  }
  catch {
    pluginAuthSnapshot.value = []
  }
}

function tryMergePluginIntoAccounts() {
  if (pluginAuthSnapshot.value.length === 0)
    return
  if (allAccounts.value.length === 0) {
    allAccounts.value = pluginAuthSnapshot.value.map(a => ({
      ...a,
      checked: false,
      isChecking: false,
    }))
    return
  }
  allAccounts.value = mergeCoseAndPluginSyncerAccounts(
    allAccounts.value,
    pluginAuthSnapshot.value,
    !!window.$pluginSyncer?.connected,
  )
}

function finishDetectionWithToast() {
  const socialAccountsStore = useSocialAccountsStore()
  socialAccountsStore.cacheFromPostAccounts(allAccounts.value)
  const loggedIn = allAccounts.value.filter(a => a.loggedIn).length
  if (loggedIn > 0)
    toast.success(`账号检测完成，已识别 ${loggedIn} 个已登录平台`)
  else if (!extensionInstalled.value && pluginAuthSnapshot.value.length === 0)
    toast.error(`未检测到 COSE / CSYNC 扩展，请先安装并刷新页面`)
  else
    toast.info(`检测完成，暂无已登录平台；可先点「登录」完成平台登录后再检测`)
}

function startLoginDetection(options?: { silent?: boolean }) {
  const silent = options?.silent ?? false

  const cose = getCose()
  if (cose !== undefined) {
    const initialPlatforms = getInitialPlatforms()
    if (initialPlatforms.length > 0)
      allAccounts.value = initialPlatforms

    isCheckingLogin.value = true
    let settled = false
    let timeoutId: ReturnType<typeof setTimeout>

    // 检测的唯一收口：COSE 正常回调或超时兜底都走这里。复位必须无条件执行——
    // 否则 COSE 推送部分进度后不回调完成，会让检测态永久卡住、「重新检测」按钮永久禁用。
    const settle = () => {
      if (settled)
        return
      settled = true
      clearTimeout(timeoutId)
      allAccounts.value = allAccounts.value.map(a => ({ ...a, isChecking: false }))
      isCheckingLogin.value = false
      void refreshPluginAuth().then(() => {
        tryMergePluginIntoAccounts()
        if (!silent)
          finishDetectionWithToast()
      })
    }

    timeoutId = setTimeout(settle, COSE_DETECTION_TIMEOUT_MS)

    if (typeof cose.getAccountsProgressive === `function`) {
      cose.getAccountsProgressive(
        (account: PostAccount) => {
          const canonical = withCanonicalType(account)
          const idx = allAccounts.value.findIndex(a => a.type === canonical.type)
          if (idx !== -1)
            allAccounts.value[idx] = { ...canonical, checked: false, isChecking: false }
        },
        settle,
      )
    }
    else if (typeof cose.getAccounts === `function`) {
      cose.getAccounts((resp: PostAccount[]) => {
        allAccounts.value = resp.map(a => ({ ...withCanonicalType(a), checked: false, isChecking: false }))
        settle()
      })
    }
    else {
      settle()
    }
    return
  }

  isCheckingLogin.value = true
  void refreshPluginAuth().then(() => {
    if (pluginAuthSnapshot.value.length > 0) {
      allAccounts.value = pluginAuthSnapshot.value.map(a => ({
        ...a,
        checked: false,
        isChecking: false,
      }))
    }
    isCheckingLogin.value = false
    if (!silent)
      finishDetectionWithToast()
  })
}

function ensureExtensionProbe() {
  if (extensionProbeStarted)
    return
  extensionProbeStarted = true

  let coseDetectionStarted = false
  let pluginAuthFetched = false
  const probe = () => {
    if (getCose() !== undefined) {
      extensionInstalled.value = true
      if (!coseDetectionStarted) {
        coseDetectionStarted = true
        startLoginDetection({ silent: true })
      }
    }
    if (window.$pluginSyncer !== undefined) {
      pluginSyncerScriptPresent.value = true
      if (!pluginAuthFetched) {
        pluginAuthFetched = true
        void refreshPluginAuth().then(() => tryMergePluginIntoAccounts())
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
    () => extensionInstalled.value || pluginAuthSnapshot.value.some(a => a.loggedIn),
  )

  async function redetectAccounts() {
    if (isCheckingLogin.value) {
      toast.info(`正在检测账号，请稍候…`)
      return
    }

    if (getCose() !== undefined)
      extensionInstalled.value = true
    if (window.$pluginSyncer !== undefined)
      pluginSyncerScriptPresent.value = true

    toast.info(`正在通过扩展重新检测已登录账号…`)
    await refreshPluginAuth()
    tryMergePluginIntoAccounts()
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
    pluginSyncerScriptPresent,
    pluginAuthSnapshot,
    isCheckingLogin,
    loggedInCount,
    hasPublishExtension,
    getPlatformLoginUrl,
    refreshPluginAuth,
    tryMergePluginIntoAccounts,
    startLoginDetection,
    redetectAccounts,
    cacheAccountsToProfile,
    ensureExtensionProbe,
  }
}
