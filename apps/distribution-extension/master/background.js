import { buildText, CONTENT_TYPES, detectPlatform, detectSite, getCapability, normalizeDraft, PLATFORMS, validateDraft, validateSettings } from './core.js'
import { fillEditor } from './editors.js'
import { createMonitor } from './monitor.js'
import { createUpdater } from './updater.js'
import './entry-cleanup.js'
import './platform-tools.js'
/* global chrome */
import '../bundles/background.js'

const KEY = 'aiDistributionMaster'
const DEFAULT_STATE = { drafts: [], jobs: [], settings: { endpoint: 'https://api.deepseek.com/chat/completions', model: '', apiKey: '' } }
let state
let mutation = Promise.resolve()
let running = false
let generating = 0
let activeMutations = 0
let updating = false
let updater
let monitor
const generationControllers = new Set()
globalThis.admDistributionBusy = () => running || generating > 0 || updating
const ready = (async () => {
  await chrome.storage.local.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' })
  state = (await chrome.storage.local.get(KEY))[KEY] || structuredClone(DEFAULT_STATE)
  for (const job of state.jobs) {
    for (const target of job.targets) {
      if (['running', 'pending'].includes(target.status)) {
        target.status = 'interrupted'
        target.message = '上次任务已中断，请先检查平台是否已有草稿，再决定重试。'
      }
    }
  }
  await chrome.storage.local.set({ [KEY]: state })
})()
if (chrome.runtime.getManifest && chrome.alarms) {
  updater = createUpdater({ chromeApi: chrome, isBusy: () => running || generating > 0 || activeMutations > 0 || globalThis.admToolsBusy?.(), beforeReload: () => { updating = true } })
  ready.then(() => updater.install()).catch(console.error)
}
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error)

async function monitorSnapshot() {
  await ready; await mutation
  const local = await chrome.storage.local.get(['admPlatformTools', 'admLocalUpdate'])
  const tools = local.admPlatformTools || {}
  const batches = state.jobs.map(job => ({ id: job.id, createdAt: job.createdAt, type: job.draft.contentType, targets: job.targets.map(({ id, platformId, status }) => ({ id, platformId, status })) }))
  const events = state.jobs.flatMap(job => job.targets.filter(t => ['prepared', 'manual', 'failed', 'stopped'].includes(t.status) && t.completedAt).map(t => ({ id: `${t.id}-${t.status}`, kind: 'distribution', platformId: t.platformId, outcome: t.status, at: t.completedAt })))
  for (const item of tools.records || []) {
    if (!item.id || !item.outcome)
      continue
    events.push({ id: item.id, kind: item.tool === '掘金签到' ? 'checkin' : 'manager', platformId: item.tool === '掘金签到' ? 'juejin' : 'xiaohongshu', outcome: item.outcome, at: item.at, publicCount: item.publicCount || 0, privateCount: item.privateCount || 0 })
  }
  return { snapshot: { phase: updating ? 'updating' : running ? 'running' : generating ? 'generating' : globalThis.admToolsBusy?.() ? 'running' : 'idle', batches, tools: { autoCheckin: !!tools.autoCheckin, checkinDay: tools.checkinDay || '', managerRunning: !!globalThis.admManagerRunning?.() }, localUpdate: { installed: chrome.runtime.getManifest().version, version: local.admLocalUpdate?.version || chrome.runtime.getManifest().version, phase: local.admLocalUpdate?.phase || 'unknown' } }, events }
}
async function stopBatches(batchId) {
  await change((next) => {
    for (const job of next.jobs.filter(job => !batchId || job.id === batchId)) {
      job.stopRequested = true
      for (const target of job.targets) {
        if (target.status === 'pending')
          Object.assign(target, { status: 'stopped', message: '已按指令停止后续处理', completedAt: Date.now() })
      }
    }
  })
}
async function executeRemote(command) {
  if (command.command === 'disable-checkin')
    return globalThis.admStopTools?.(false)
  if (command.command === 'ext-update') {
    const status = await updater.check(true)
    if (status.version !== command.argument || !['applying', 'waiting'].includes(status.phase))
      throw new Error('本地更新版本不匹配')
    return
  }
  await stopBatches(command.command === 'stop-batch' ? command.argument : '')
  if (command.command === 'stop-all') {
    for (const controller of generationControllers) controller.abort()
    await globalThis.admStopTools?.(true)
  }
  const deadline = Date.now() + 75000
  const workPending = () => state.jobs.some(job => (!command.argument || job.id === command.argument) && job.targets.some(t => t.status === 'running')) || (command.command === 'stop-all' && (generating || globalThis.admToolsBusy?.()))
  while (workPending()) {
    if (Date.now() > deadline)
      throw new Error('任务尚未确认停止')
    await new Promise(resolve => setTimeout(resolve, 250))
  }
}
if (chrome.alarms) {
  monitor = createMonitor({ chromeApi: chrome, getSnapshot: monitorSnapshot, executeCommand: executeRemote })
  ready.then(() => monitor.install()).catch(console.error)
  let reportTimer
  globalThis.admRequestMonitorSync = () => { clearTimeout(reportTimer); reportTimer = setTimeout(() => monitor.sync(), 1000) }
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !['aiDistributionMaster', 'admPlatformTools', 'admLocalUpdate'].some(key => changes[key]))
      return
    globalThis.admRequestMonitorSync()
  })
}

function change(fn) {
  activeMutations++
  const operation = mutation.then(async () => {
    await ready
    const next = structuredClone(state)
    const result = fn(next)
    await chrome.storage.local.set({ [KEY]: next })
    state = next
    return result
  })
  mutation = operation.catch(() => {})
  return operation.finally(() => { activeMutations-- })
}
async function updateTarget(jobId, targetId, updates) {
  return change((s) => {
    const target = s.jobs.find(j => j.id === jobId)?.targets.find(t => t.id === targetId)
    if (target)
      Object.assign(target, updates, ['prepared', 'manual', 'failed', 'stopped'].includes(updates.status) ? { completedAt: Date.now() } : {})
  })
}
async function nativeInsert(tabId, text) {
  const target = { tabId }
  let attached = false
  try {
    await chrome.debugger.attach(target, '1.3')
    attached = true
    await chrome.debugger.sendCommand(target, 'Input.insertText', { text })
  }
  finally {
    if (attached)
      await chrome.debugger.detach(target)
  }
}
let grouping = Promise.resolve()
function jobGroupMeta(job) {
  const types = { opinion: '观点', article: '文章', booklet: '电子书', project: '项目' }
  const colors = { opinion: 'orange', article: 'blue', booklet: 'purple', project: 'green' }
  const text = (job.draft.title || job.draft.content || '未命名内容').replace(/\s+/g, ' ').trim()
  const chars = Array.from(text)
  const title = chars.slice(0, 24).join('') + (chars.length > 24 ? '…' : '')
  const time = new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit', hour12: false }).format(job.createdAt)
  return { title: `AI 分发 · ${types[job.draft.contentType] || '内容'} · ${title} · ${time}`, color: colors[job.draft.contentType] || 'orange', collapsed: false }
}
function groupJobTab(job, tab) {
  const operation = grouping.then(async () => {
    const saved = state.jobs.find(item => item.id === job.id)
    let group
    if (Number.isInteger(saved?.groupId)) {
      try {
        const candidate = await chrome.tabGroups.get(saved.groupId)
        const members = await chrome.tabs.query({ groupId: candidate.id })
        // Group IDs are session-scoped; never reuse an unrelated group after restart.
        if (members.some(member => saved.targets.some(target => target.tabId === member.id)))
          group = candidate
      }
      catch { /* The user may have closed or ungrouped the previous tabs. */ }
    }
    if (group && tab.windowId !== group.windowId)
      await chrome.tabs.move(tab.id, { windowId: group.windowId, index: -1 })
    const groupId = await chrome.tabs.group({ tabIds: [tab.id], ...(group ? { groupId: group.id } : {}) })
    const meta = jobGroupMeta(job)
    await chrome.tabGroups.update(groupId, meta)
    await change((next) => {
      const item = next.jobs.find(item => item.id === job.id)
      if (item)
        Object.assign(item, { groupId, groupTitle: meta.title })
    })
    return groupId
  })
  grouping = operation.catch(() => {})
  return operation
}
async function registerJobTab(job, target, tab) {
  await updateTarget(job.id, target.id, { tabId: tab.id, url: tab.url || getCapability(target.platformId, job.draft.contentType).url })
  await groupJobTab(job, tab)
}
async function openJobTarget(message) {
  const job = state.jobs.find(item => item.id === message.jobId)
  const target = job?.targets.find(item => item.id === message.targetId)
  if (!target)
    throw new Error('未找到这条分发记录')
  let tab
  if (target.tabId) {
    try { tab = await chrome.tabs.get(target.tabId) }
    catch { /* Reopen a closed platform tab inside the same job group. */ }
    if (tab && detectPlatform(tab.url)?.id !== target.platformId)
      tab = null
  }
  if (!tab) {
    const url = detectPlatform(target.url)?.id === target.platformId ? target.url : getCapability(target.platformId, job.draft.contentType).url
    tab = await chrome.tabs.create({ url, active: true })
  }
  await registerJobTab(job, target, tab)
  tab = await chrome.tabs.get(tab.id)
  await chrome.tabs.update(tab.id, { active: true })
  if (Number.isInteger(tab.windowId))
    await chrome.windows.update(tab.windowId, { focused: true })
  return { tabId: tab.id }
}
async function prepareTarget(job, target, currentTabId) {
  const capability = getCapability(target.platformId, job.draft.contentType)
  if (capability.mode === 'unsupported')
    throw new Error(capability.hint)
  if (capability.mode === 'manual') {
    const tab = await chrome.tabs.create({ url: capability.url, active: true })
    await registerJobTab(job, target, tab)
    return { status: 'manual', tabId: tab.id, url: capability.url, message: capability.hint }
  }
  if (currentTabId || capability.mode === 'fill') {
    let tab
    const obsoleteEntry = (target.platformId === 'xiaohongshu' && target.url?.includes('target=image')) || (target.platformId === 'juejin' && target.url?.includes('/pins'))
    const explicitTabId = currentTabId
    currentTabId ||= obsoleteEntry ? undefined : target.tabId
    if (currentTabId) {
      try { tab = await chrome.tabs.get(currentTabId) }
      catch {
        if (explicitTabId)
          throw new Error('当前页签已关闭，请重新打开平台')
      }
      if (tab && detectPlatform(tab.url)?.id !== target.platformId)
        throw new Error('当前页面与所选平台不匹配，请回到平台编辑页。')
      if (capability.mode !== 'fill')
        return { status: 'manual', tabId: tab.id, url: tab.url, message: '此类型使用平台草稿引擎，请选择批量准备；不会覆盖当前页面。' }
    }
    if (!tab) {
      tab = await chrome.tabs.create({ url: capability.url, active: true })
    }
    // Persist tab before navigation/insertion so interrupted work remains inspectable.
    await registerJobTab(job, target, tab)
    if (detectPlatform(tab.url)?.id !== target.platformId)
      return { status: 'manual', tabId: tab.id, message: '页面已跳转，请先完成登录再检查。' }
    // Editors often mount after document load. Retry discovery only, never a partial write.
    let result
    for (let attempt = 0; attempt < 60; attempt++) {
      const text = target.platformId === 'xiaohongshu'
        ? [job.draft.content, job.draft.url && !job.draft.content.includes(job.draft.url) ? job.draft.url : ''].filter(Boolean).join('\n\n')
        : buildText(job.draft)
      const args = { platformId: target.platformId, title: job.draft.title, text, contentType: job.draft.contentType }
      try {
        const frames = await chrome.scripting.executeScript({ target: { tabId: tab.id }, world: 'MAIN', func: fillEditor, args: [args] })
        result = frames[0]?.result
      }
      catch (error) {
        // Retry navigation/mounting failures only; no editor write has been attempted.
        if (attempt === 59 || !/error page|cannot access|frame.*removed|no frame|frame.*not found/i.test(error.message))
          throw new Error(/error page/i.test(error.message) ? '浏览器无法打开平台页面。请检查网络，页面能正常打开后重试此平台。' : `无法访问编辑器：${error.message}`)
        await new Promise(resolve => setTimeout(resolve, 500))
        continue
      }
      if (result?.needsNativeInput) {
        // Native browser input lets Draft.js process text and links once, without forged input events.
        try { await nativeInsert(tab.id, result.inputText) }
        catch (error) { throw new Error(`浏览器原生输入失败，未自动重试。请检查页面：${error.message}`) }
        await new Promise(resolve => setTimeout(resolve, 500))
        const frames = await chrome.scripting.executeScript({ target: { tabId: tab.id }, world: 'MAIN', func: fillEditor, args: [{ ...args, text: result.inputText, phase: 'verify' }] })
        result = frames[0]?.result
        break
      }
      if (result?.success || !result?.retryable)
        break
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    tab = await chrome.tabs.get(tab.id)
    return { status: result?.success ? 'prepared' : 'manual', tabId: tab.id, url: tab.url, message: result?.message || '未能确认填写结果，请手动检查当前页面。' }
  }
  throw new Error('未找到可用的安全填写能力')
}
async function execute(jobId, currentTabId) {
  try {
    await ready
    const job = structuredClone(state.jobs.find(j => j.id === jobId))
    for (const target of job.targets.filter(t => t.status === 'pending')) {
      await mutation
      if (state.jobs.find(j => j.id === jobId)?.stopRequested)
        break
      await updateTarget(jobId, target.id, { status: 'running', message: '正在准备，请勿重复操作' })
      try {
        await updateTarget(jobId, target.id, await prepareTarget(job, target, currentTabId))
      }
      catch (error) {
        await updateTarget(jobId, target.id, { status: 'failed', message: error.message || '任务失败，请检查平台页面。' })
      }
    }
  }
  catch (error) { console.error('[AI 分发大师] 任务中断', error.message) }
  finally {
    running = false
    void updater?.check()
  }
}
async function generate(message) {
  const draft = validateDraft(message.draft)
  const settings = validateSettings(state.settings)
  if (!settings.model || !settings.apiKey)
    throw new Error('请先在设置中填写模型和 API Key')
  if (!await chrome.permissions.contains({ origins: [`${new URL(settings.endpoint).origin}/*`] }))
    throw new Error('尚未授予模型服务权限，请在设置中重新保存')
  const platform = PLATFORMS.find(p => p.id === message.platformId)
  if (!platform)
    throw new Error('请选择目标平台')
  const controller = new AbortController()
  generationControllers.add(controller)
  const timeout = setTimeout(() => controller.abort(), 60000)
  try {
    const response = await fetch(settings.endpoint, {
      method: 'POST',
      redirect: 'error',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${settings.apiKey}` },
      body: JSON.stringify({ model: settings.model, stream: false, messages: [
        { role: 'system', content: `你是 AI 分发大师的中文内容编辑。将用户材料适配为${platform.title}的${CONTENT_TYPES.find(t => t.id === draft.contentType).title}正文。只输出可编辑正文，不附带解释。不编造事实、数据、个人经历和承诺。电子书/项目只写介绍帖，不声称上传或发布成功。保留原链接，尊重用户要求。` },
        { role: 'user', content: `${String(message.instruction || '保持原意，清晰自然，符合该平台阅读习惯。').slice(0, 2000)}\n\n材料：\n${buildText(draft)}` },
      ] }),
    })
    if (!response.ok)
      throw new Error(`模型服务请求失败（${response.status}），请检查配置或稍后重试`)
    const data = await response.json()
    const text = data.choices?.[0]?.message?.content
    if (typeof text !== 'string' || !text.trim())
      throw new Error('模型未返回正文，请检查模型是否兼容 Chat Completions')
    if (text.length > 200000)
      throw new Error('生成内容过长，请缩短材料后重试')
    return { text: text.trim() }
  }
  finally { clearTimeout(timeout); generationControllers.delete(controller) }
}
export async function handleMessage(message) {
  await ready
  switch (message.type) {
    case 'ADM_MONITOR_STATUS': return monitor?.status() || { enabled: false }
    case 'ADM_MONITOR_CONFIG': return monitor.configure(message.config || {})
    case 'ADM_MONITOR_SYNC': return monitor.sync()
    case 'ADM_OPEN_TARGET': return openJobTarget(message)
    case 'ADM_UPDATE_STATUS': return updater?.status() || { phase: 'unknown' }
    case 'ADM_CHECK_UPDATE': return updater?.check() || { phase: 'unknown' }
    case 'ADM_APPLY_UPDATE': return updater?.check(true) || { phase: 'unknown' }
    case 'ADM_GET_STATE': await mutation; return structuredClone(state)
    case 'ADM_SAVE_DRAFT': {
      const draft = normalizeDraft(message.draft)
      if (!draft.title && !draft.content)
        throw new Error('请先写一些内容再保存')
      draft.id ||= crypto.randomUUID()
      await change((s) => { s.drafts = [draft, ...s.drafts.filter(d => d.id !== draft.id)].slice(0, 20) })
      return { draft }
    }
    case 'ADM_DELETE_DRAFT': await change((s) => { s.drafts = s.drafts.filter(d => d.id !== message.id) }); return { success: true }
    case 'ADM_SAVE_SETTINGS': {
      const settings = validateSettings(message.settings)
      if (!await chrome.permissions.contains({ origins: [`${new URL(settings.endpoint).origin}/*`] }))
        throw new Error('请先允许访问填写的模型服务地址')
      await change((s) => { s.settings = settings })
      return { success: true }
    }
    case 'ADM_GENERATE': {
      if (updating)
        throw new Error('正在加载新版，请稍后重新打开插件')
      generating++
      try { return await generate(message) }
      finally { generating--; void updater?.check() }
    }
    case 'ADM_RUN': {
      if (updating)
        throw new Error('正在加载新版，请稍后重新打开插件')
      if (running || globalThis.admToolsBusy?.())
        throw new Error('已有分发任务正在运行，请等完成后再操作')
      running = true
      try {
        const draft = validateDraft(message.draft)
        const platformIds = [...new Set(message.platformIds || [])]
        if (!platformIds.length || platformIds.length > PLATFORMS.length)
          throw new Error('请选择至少一个平台')
        if (message.currentTabId && platformIds.length !== 1)
          throw new Error('填入当前页面只能选择当前平台')
        const job = { id: crypto.randomUUID(), createdAt: Date.now(), draft, targets: platformIds.map((platformId) => {
          const capability = getCapability(platformId, draft.contentType)
          if (capability.mode === 'unsupported')
            throw new Error('选中了不支持此内容的平台')
          return { id: crypto.randomUUID(), platformId, status: 'pending', url: capability.url, message: '等待准备' }
        }) }
        await change((s) => { s.jobs = [job, ...s.jobs].slice(0, 10) })
        void execute(job.id, message.currentTabId)
        return { jobId: job.id }
      }
      catch (error) { running = false; throw error }
    }
    case 'ADM_RETRY': {
      if (updating)
        throw new Error('正在加载新版，请稍后重新打开插件')
      if (running || globalThis.admToolsBusy?.())
        throw new Error('已有任务运行中')
      running = true
      try {
        const job = state.jobs.find(j => j.id === message.jobId)
        const target = job?.targets.find(t => t.id === message.targetId)
        if (!target || !['failed', 'interrupted', 'manual'].includes(target.status))
          throw new Error('此项目不需要重试')
        await change((next) => { next.jobs.find(j => j.id === job.id).stopRequested = false })
        await updateTarget(job.id, target.id, { status: 'pending', message: '等待重试，请先检查是否已有草稿' })
        void execute(job.id)
        return { jobId: job.id }
      }
      catch (error) { running = false; throw error }
    }
    default: throw new Error('不支持的操作')
  }
}
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (message?.type?.startsWith('ADM_TOOL_'))
    return false
  if (!message?.type?.startsWith('ADM_'))
    return false
  if (message.type === 'ADM_OPEN') {
    if (sender.id !== chrome.runtime.id || !sender.tab?.id || !detectSite(sender.tab.url)?.floatingEntry)
      return false
    // Keep this synchronous with the user's click to preserve sidePanel user activation.
    chrome.sidePanel.open({ tabId: sender.tab.id }).then(() => respond({ success: true })).catch(() => respond({ error: '请点击工具栏图标打开侧栏' }))
    return true
  }
  if (sender.id !== chrome.runtime.id || !sender.url?.startsWith(chrome.runtime.getURL(''))) {
    respond({ error: '仅插件工作台可执行此操作' })
    return false
  }
  handleMessage(message).then(respond).catch(error => respond({ error: error.message || '操作失败' }))
  return true
})
