export function createMonitor({ chromeApi, getSnapshot, executeCommand, fetchApi = fetch, now = Date.now }) {
  const CONFIG = 'admMonitorConfig'; const STATE = 'admMonitorState'; const ALARM = 'adm-monitor-heartbeat'
  let operation
  const atLeast = (current, expected) => {
    if (!/^\d+\.\d+\.\d+$/.test(expected || ''))
      return false
    const a = current.split('.').map(Number); const b = expected.split('.').map(Number)
    for (let i = 0; i < 3; i++) {
      if (a[i] !== b[i])
        return a[i] > b[i]
    }
    return true
  }
  async function config() { return (await chromeApi.storage.local.get(CONFIG))[CONFIG] || {} }
  async function state() { return (await chromeApi.storage.local.get(STATE))[STATE] || { commands: [], seen: [] } }
  async function saveState(value) { await chromeApi.storage.local.set({ [STATE]: value }) }
  async function status() { const c = await config(); const s = await state(); return { enabled: c.enabled === true, configured: !!c.secret, lastReportAt: s.lastReportAt || 0, error: s.error || '', deviceId: c.deviceId || '' } }
  async function configure(input) {
    if (operation)
      await operation
    const previous = await config()
    const secret = String(input.secret || '').trim() || previous.secret || ''
    if (secret.length > 200 || /[\r\n]/.test(secret))
      throw new Error('回执密钥格式无效')
    if (input.enabled && !secret)
      throw new Error('请先填写站长回执密钥')
    await chromeApi.storage.local.set({ [CONFIG]: { deviceId: previous.deviceId || crypto.randomUUID(), secret, enabled: input.enabled === true } })
    if (input.enabled)
      void sync()
    return status()
  }
  async function perform() {
    const c = await config()
    if (!c.enabled || !c.secret)
      return status()
    const local = await state()
    const version = chromeApi.runtime.getManifest().version
    for (const item of local.commands) {
      if (item.status !== 'executing')
        continue
      if (item.pendingUpdate && atLeast(version, item.argument)) { item.status = 'success'; item.result = 'loaded' }
      else if (item.expiresAt <= now()) { item.status = 'failed'; item.result = 'expired' }
      else if (!item.pendingUpdate) { item.status = 'failed'; item.result = 'interrupted' }
    }
    const report = await getSnapshot()
    const response = await fetchApi('https://2aran.com/api/plugins/report', {
      method: 'POST',
      redirect: 'error',
      signal: AbortSignal.timeout(15000),
      headers: { 'Content-Type': 'application/json', 'x-community-action-secret': c.secret },
      body: JSON.stringify({ pluginId: 'ai-distributor', deviceId: c.deviceId, version, ...report, results: local.commands.filter(item => ['success', 'failed'].includes(item.status)).map(({ id, status, result }) => ({ id, status, result })) }),
    })
    if (!response.ok)
      throw new Error(`HTTP_${response.status}`)
    const data = await response.json()
    if (!data.ok)
      throw new Error('INVALID_RESPONSE')
    local.commands = local.commands.filter(item => !(data.acknowledged || []).includes(item.id))
    local.lastReportAt = now(); local.error = ''
    await saveState(local)
    for (const command of (data.commands || []).slice(0, 8)) {
      if (!/^[\w-]{8,80}$/.test(command.id || '') || local.seen.includes(command.id))
        continue
      const item = { id: command.id, argument: command.argument || '', expiresAt: command.expiresAt, status: 'executing', result: '', pendingUpdate: command.command === 'ext-update' }
      local.seen = [...local.seen, command.id].slice(-100); local.commands.push(item)
      await saveState(local) // Durable claim before any local side effect.
      try {
        if (!['stop-batch', 'stop-all', 'disable-checkin', 'ext-update'].includes(command.command) || !Number.isSafeInteger(command.expiresAt) || command.expiresAt <= now() || command.expiresAt > now() + 180000)
          throw new Error('EXPIRED_COMMAND')
        await executeCommand(command)
        if (!item.pendingUpdate) { item.status = 'success'; item.result = 'stopped' }
      }
      catch { item.status = 'failed'; item.result = command.expiresAt <= now() ? 'expired' : 'failed' }
      await saveState(local)
    }
    if ((data.commands || []).length)
      setTimeout(() => { void sync() }, 250)
    return status()
  }
  function sync() {
    if (operation)
      return operation
    operation = perform().catch(async (error) => {
      const s = await state(); s.error = /^HTTP_\d+$/.test(error.message) ? error.message : 'NETWORK_OR_REPORT_FAILED'; await saveState(s)
      return status()
    }).finally(() => { operation = null })
    return operation
  }
  async function loadBundledCredential() {
    const current = await config()
    if (current.secret || current.enabled === false)
      return
    try {
      const response = await fetchApi(chromeApi.runtime.getURL('community-secret.local'), { cache: 'no-store' })
      if (!response.ok)
        return
      const data = await response.json()
      const secret = String(data?.secret || '').trim()
      if (secret.length < 8 || secret.length > 200 || /[\r\n]/.test(secret))
        return
      await chromeApi.storage.local.set({ [CONFIG]: { deviceId: current.deviceId || crypto.randomUUID(), secret, enabled: true } })
    }
    catch { /* Generic developer packages contain no credential. */ }
  }
  function install() {
    chromeApi.alarms.create(ALARM, { periodInMinutes: 1 })
    chromeApi.alarms.onAlarm.addListener((alarm) => {
      if (alarm.name === ALARM)
        void sync()
    })
    void loadBundledCredential().then(sync)
  }
  return { status, configure, sync, install, loadBundledCredential }
}
