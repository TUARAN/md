export const UPDATE_KEY = 'admLocalUpdate'
export const UPDATE_ALARM = 'adm-local-update-check'
export const SETTLE_MS = 60000
export function compareVersions(a, b) {
  if (![a, b].every(value => /^\d+(?:\.\d+){2,3}$/.test(String(value))))
    return 0
  const left = a.split('.').map(Number)
  const right = b.split('.').map(Number)
  for (let i = 0; i < 4; i++) {
    const delta = (left[i] || 0) - (right[i] || 0)
    if (delta)
      return Math.sign(delta)
  }
  return 0
}
export function createUpdater({ chromeApi, fetchApi = fetch, isBusy = () => false, beforeReload = () => {}, now = Date.now, scheduleReload = callback => setTimeout(callback, 500), reload = () => chromeApi.runtime.reload() }) {
  let operation
  let reloading = false
  async function save(value) {
    await chromeApi.storage.local.set({ [UPDATE_KEY]: value })
    await chromeApi.action?.setBadgeText?.({ text: ['available', 'waiting'].includes(value.phase) ? 'NEW' : value.phase === 'failed' ? '!' : '' })
    return value
  }
  async function status() { return (await chromeApi.storage.local.get(UPDATE_KEY))[UPDATE_KEY] || { installed: chromeApi.runtime.getManifest().version, phase: 'unknown' } }
  async function perform(apply) {
    if (reloading)
      return status()
    const installed = chromeApi.runtime.getManifest().version
    const previous = await status()
    const at = now()
    try {
      const response = await fetchApi(`${chromeApi.runtime.getURL('manifest.json')}?admCheck=${at}`, { cache: 'no-store' })
      if (!response.ok)
        throw new Error('读取本地安装目录失败')
      const next = (await response.json()).version
      if (!/^\d+(?:\.\d+){2,3}$/.test(String(next)))
        throw new Error('本地版本号无效，请等待打包完成再检测')
      if (compareVersions(next, installed) <= 0) {
        return save({ installed, version: installed, phase: previous.phase === 'applying' && compareVersions(installed, previous.version) >= 0 ? 'updated' : 'latest', checkedAt: at })
      }
      const candidate = { installed, version: next, firstSeenAt: previous.version === next ? previous.firstSeenAt ?? at : at, checkedAt: at, phase: 'available' }
      if (!apply && at - candidate.firstSeenAt < SETTLE_MS)
        return save(candidate)
      if (isBusy())
        return save({ ...candidate, firstSeenAt: apply ? at - SETTLE_MS : candidate.firstSeenAt, phase: 'waiting' })
      await save({ ...candidate, phase: 'applying' })
      // Recheck after storage awaits so a newly-started job is never interrupted.
      if (isBusy())
        return save({ ...candidate, firstSeenAt: at - SETTLE_MS, phase: 'waiting' })
      reloading = true
      beforeReload()
      scheduleReload(reload)
      return { ...candidate, phase: 'applying' }
    }
    catch (error) { reloading = false; return save({ ...previous, installed, phase: 'failed', checkedAt: at, error: error.message }) }
  }
  function check(apply = false) {
    if (operation)
      return operation.then(() => apply ? check(true) : status())
    operation = perform(apply).finally(() => { operation = null })
    return operation
  }
  function install() {
    if (!chromeApi.alarms?.create)
      return
    chromeApi.alarms.create(UPDATE_ALARM, { periodInMinutes: 2 })
    chromeApi.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === UPDATE_ALARM)
        void check()
    })
    void check()
  }
  return { check, status, install, isReloading: () => reloading }
}
