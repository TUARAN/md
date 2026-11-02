/* global chrome */
import { checkinPage, mountNoteManager } from './tool-pages.js'

const KEY = 'admPlatformTools'
const ALARM = 'adm-juejin-checkin'
const DEFAULT = { autoCheckin: false, checkinDay: '', records: [] }
const leases = new Map()
let busy = false
let writes = Promise.resolve()
const day = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
const read = async () => ({ ...DEFAULT, ...(await chrome.storage.local.get(KEY))[KEY] })
function write(fn) {
  const operation = writes.then(async () => { const state = await read(); fn(state); await chrome.storage.local.set({ [KEY]: state }); return state })
  writes = operation.catch(() => {})
  return operation
}
const record = (tool, message, outcome = 'success', counts = {}) => write((s) => { s.records = [{ id: crypto.randomUUID(), outcome, publicCount: Number.isSafeInteger(counts.publicCount) ? Math.max(0, counts.publicCount) : 0, privateCount: Number.isSafeInteger(counts.privateCount) ? Math.max(0, counts.privateCount) : 0, tool, message: String(message).slice(0, 800), at: Date.now() }, ...s.records].slice(0, 30) })
function managerRoute(url) {
  try { const u = new URL(url); return u.origin === 'https://creator.xiaohongshu.com' && /^\/new\/note-manager(?:\/|$)/.test(u.pathname) }
  catch { return false }
}
globalThis.admToolsBusy = () => busy || [...leases.values()].some(v => v > Date.now())
async function open(url) {
  const tabs = await chrome.tabs.query({})
  const tab = tabs.find(tab => tab.url?.split('?')[0] === url) || await chrome.tabs.create({ url, active: true })
  await chrome.tabs.update(tab.id, { active: true })
  return tab
}
async function checkin(automatic = false) {
  if (busy || globalThis.admDistributionBusy?.() || [...leases.values()].some(v => v > Date.now()))
    throw new Error('已有任务执行中，请完成后再签到')
  busy = true
  try {
    const state = await read()
    if (state.checkinDay === day())
      return { message: '今日已签到' }
    let tab
    if (automatic) {
      const [active] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
      if (!active?.url?.startsWith('https://juejin.cn/'))
        return { message: '等待你打开掘金' }
      tab = active.url.split('?')[0] === 'https://juejin.cn/user/center/signin' ? active : await open('https://juejin.cn/user/center/signin')
    }
    else {
      tab = await open('https://juejin.cn/user/center/signin')
    }
    let result
    for (let i = 0; i < 20; i++) {
      try { result = (await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: checkinPage }))[0]?.result }
      catch { result = { retry: true } }
      if (!result?.retry)
        break
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    if (!result?.done)
      throw new Error(result?.message || '签到页未就绪，请确认已登录后重试')
    await write((s) => { s.checkinDay = day() })
    await record('掘金签到', result.message)
    return result
  }
  catch (error) { await record('掘金签到', error.message, 'failed'); throw error }
  finally { busy = false }
}
async function openManager() {
  if (globalThis.admDistributionBusy?.())
    throw new Error('请等当前分发任务完成后再打开笔记管理')
  const tab = await open('https://creator.xiaohongshu.com/new/note-manager')
  for (let i = 0; i < 30; i++) {
    let result
    try { result = (await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: mountNoteManager }))[0]?.result }
    catch { /* Wait for the page navigation only. */ }
    if (result?.error)
      throw new Error(result.error)
    if (result?.ready) {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['master/xhs-manager-core.js', 'master/xhs-manager.js'] })
      return { message: '已打开笔记管理工具。请先查看候选，再确认调整可见范围。' }
    }
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  throw new Error('笔记管理页未就绪，请确认网络和登录后重试')
}
async function permissionClick(message, tabId) {
  if (globalThis.admDistributionBusy?.())
    throw new Error('当前正在分发，笔记管理已停止，请稍后重试')
  const target = { tabId }
  const tab = await chrome.tabs.get(tabId)
  if (!managerRoute(tab.url) || !Number.isFinite(message.x) || !Number.isFinite(message.y) || message.x < 0 || message.y < 0)
    throw new Error('权限点击来源无效')
  // Recheck the hit region inside our manager session; arbitrary page coordinates are refused.
  const [{ result }] = await chrome.scripting.executeScript({ target, func: (x, y) => Boolean(document.getElementById('adm-xhs-manager-panel') && document.elementFromPoint(x, y)?.closest('.permission-modal .perm-select-wrapper, .d-options-wrapper .custom-option, .permission-modal .btn-confirm')), args: [message.x, message.y] })
  if (!result)
    throw new Error('权限控件已变化，请重新检查页面')
  await chrome.debugger.attach(target, '1.3')
  try {
    for (const type of ['mousePressed', 'mouseReleased']) await chrome.debugger.sendCommand(target, 'Input.dispatchMouseEvent', { type, x: message.x, y: message.y, button: 'left', clickCount: 1 })
  }
  finally { await chrome.debugger.detach(target) }
  return { ok: true }
}
export async function handleTool(message) {
  switch (message.type) {
    case 'ADM_TOOL_STATE': return read()
    case 'ADM_TOOL_CHECKIN': return checkin()
    case 'ADM_TOOL_AUTO': {
      const state = await write((s) => { s.autoCheckin = message.enabled === true })
      if (state.autoCheckin)
        await chrome.alarms.create(ALARM, { periodInMinutes: 15 })
      else await chrome.alarms.clear(ALARM)
      return state
    }
    case 'ADM_TOOL_MANAGER': return openManager()
    default: throw new Error('未知平台工具')
  }
}
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (!message?.type?.startsWith('ADM_TOOL_'))
    return false
  if (sender.id !== chrome.runtime.id)
    return false
  if (['ADM_TOOL_CLICK', 'ADM_TOOL_MANAGER_STATUS', 'ADM_TOOL_OPEN_DOCS'].includes(message.type)) {
    if (!sender.tab?.id || !managerRoute(sender.url || sender.tab.url))
      return false
    if (message.type === 'ADM_TOOL_OPEN_DOCS') {
      chrome.tabs.create({ url: chrome.runtime.getURL('docs.html#xiaohongshu-manager'), active: true }).then(() => respond({ ok: true })).catch(error => respond({ error: error.message }))
      return true
    }
    if (message.type === 'ADM_TOOL_CLICK') {
      permissionClick(message, sender.tab.id).then(respond).catch(error => respond({ error: error.message }))
    }
    else {
      const wasRunning = globalThis.admManagerRunning?.()
      leases.set(sender.tab.id, message.busy ? Date.now() + 10000 : 0)
      if (wasRunning !== globalThis.admManagerRunning?.())
        globalThis.admRequestMonitorSync?.()
      const result = message.final ? record('小红书笔记管理', message.text, ['success', 'stopped', 'failed'].includes(message.outcome) ? message.outcome : 'failed', message) : Promise.resolve()
      result.then(() => respond({ ok: true })).catch(() => respond({ ok: false }))
    }
    return true
  }
  if (!sender.url?.startsWith(chrome.runtime.getURL(''))) { respond({ error: '仅插件工作台可执行此操作' }); return false }
  handleTool(message).then(respond).catch(error => respond({ error: error.message }))
  return true
})
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM)
    read().then(s => s.autoCheckin && checkin(true)).catch(console.error)
})
// Restore the opt-in schedule across browser restarts without starting a task.
read().then(s => s.autoCheckin ? chrome.alarms.create(ALARM, { periodInMinutes: 15 }) : chrome.alarms.clear(ALARM)).catch(console.error)

globalThis.admManagerRunning = () => [...leases.values()].some(value => value > Date.now())
globalThis.admStopTools = async (all) => {
  await write((s) => { s.autoCheckin = false })
  await chrome.alarms.clear(ALARM)
  if (!all)
    return
  for (const [tabId, until] of leases) {
    if (until <= Date.now())
      continue
    try { await chrome.tabs.sendMessage(tabId, { type: 'ADM_TOOL_STOP_MANAGER' }) }
    catch {
      try { await chrome.tabs.get(tabId); throw new Error('笔记管理未响应停止指令') }
      catch (error) {
        if (error.message === '笔记管理未响应停止指令')
          throw error; leases.delete(tabId)
      }
    }
  }
}
