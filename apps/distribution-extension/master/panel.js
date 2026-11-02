import { buildText, CONTENT_TYPES, detectPlatform, detectSite, getCapability, normalizeDraft, PLATFORMS } from './core.js'
import { initializeMonitorPanel } from './monitor-panel.js'
/* global chrome */
/* eslint-disable no-alert -- Confirm before replacing or deleting local content. */
import { initializePlatformTools } from './panel-tools.js'

import { loadRssPicks } from './rss.js'

const $ = id => document.getElementById(id)
const typeNames = Object.fromEntries(CONTENT_TYPES.map(type => [type.id, type.title]))
const modeNames = { fill: '填入发布框', engine: '平台草稿引擎', manual: '手动入口', unsupported: '暂不支持' }
const statusNames = { pending: '待处理', running: '准备中', prepared: '已准备 · 待检查', manual: '需手动完成', failed: '准备失败', interrupted: '已中断 · 请检查', stopped: '已停止' }
let state = { drafts: [], jobs: [], settings: {} }
let contentType = 'opinion'
let draftId = ''
let currentTab = null
let currentPlatform = null
let selected = new Set()
let settingsDirty = false
let actionBusy = false
let generating = false
let refreshTimer
let ready = false
let rssItems = []
let rssLoaded = false
let rssBusy = false

function node(tag, text = '', className = '') {
  const element = document.createElement(tag)
  if (text)
    element.textContent = text
  if (className)
    element.className = className
  return element
}
function action(text, callback, className = 'text-button') {
  const button = node('button', text, className)
  button.type = 'button'
  button.addEventListener('click', callback)
  return button
}
function notice(message, tone = '') {
  $('notice').textContent = message
  $('notice').dataset.tone = tone
  $('notice').hidden = !message
}
async function rpc(type, payload = {}) {
  const response = await chrome.runtime.sendMessage({ type, ...payload })
  if (response?.error)
    throw new Error(response.error)
  if (!response)
    throw new Error('插件后台未响应，请重新打开侧栏')
  return response
}
function activeDraft() {
  return normalizeDraft({ id: draftId, contentType, title: $('draft-title').value, content: $('draft-content').value, url: $('draft-url').value })
}
function rawDraft() {
  return { id: draftId, contentType, title: $('draft-title').value, content: $('draft-content').value, url: $('draft-url').value }
}
function preserveEditor() {
  try { sessionStorage.setItem('adm-editor', JSON.stringify(rawDraft())) }
  catch { /* Local recovery below also covers a closed sidepanel. */ }
  return chrome.storage.local.set({ admEditorRecovery: rawDraft() }).catch(() => {})
}
function hasContent() {
  return !!($('draft-title').value.trim() || $('draft-content').value.trim() || $('draft-url').value.trim())
}
function showView(name) {
  document.querySelectorAll('.view').forEach((view) => { view.hidden = view.id !== `view-${name}` })
  document.querySelectorAll('[data-view]').forEach((button) => {
    const active = button.dataset.view === name
    button.classList.toggle('active', active)
    if (active)
      button.setAttribute('aria-current', 'page')
    else button.removeAttribute('aria-current')
  })
  notice('')
}
function updateEditorCount() {
  $('char-count').textContent = `${Array.from($('draft-content').value).length.toLocaleString('zh-CN')} 字`
}
function changeType(id) {
  contentType = id
  $('rss-picks').hidden = id !== 'opinion'
  if (id === 'opinion' && !rssLoaded)
    void refreshRss()
  document.querySelectorAll('[data-type]').forEach((button) => {
    const active = button.dataset.type === id
    button.classList.toggle('active', active)
    button.setAttribute('aria-pressed', String(active))
  })
  const type = CONTENT_TYPES.find(type => type.id === id)
  $('type-description').textContent = type.description + (id === 'booklet' ? '，以介绍帖分发，不上传书籍文件。' : id === 'project' ? '，以介绍帖分发，不推送项目文件。' : '，按平台入口准备草稿。')
  $('title-label').replaceChildren(document.createTextNode(id === 'booklet' ? '书籍名称' : id === 'project' ? '项目名称' : '标题'))
  if (id === 'opinion')
    $('title-label').append(node('span', '观点可不填', 'optional'))
  $('content-label').textContent = ['booklet', 'project'].includes(id) ? '内容介绍' : '正文'
  $('url-label').replaceChildren(document.createTextNode(id === 'booklet' ? '阅读 / 购买链接' : id === 'project' ? '演示 / 仓库链接' : '来源链接'))
  if (['booklet', 'project'].includes(id))
    $('url-label').append(node('span', '必填', 'optional'))
  else $('url-label').append(node('span', '可选', 'optional'))
  $('draft-url').required = ['booklet', 'project'].includes(id)
  $('draft-title').required = id !== 'opinion'
  $('draft-content').placeholder = id === 'booklet' ? '介绍这本书的主题、适合谁读，以及能获得什么…' : id === 'project' ? '说明项目解决什么问题、主要能力与使用方式…' : id === 'article' ? '粘贴或编写 Markdown 正文…' : '写下你的观点，或粘贴当前选中文字…'
  selected = new Set([...selected].filter(platformId => getCapability(platformId, id).mode !== 'unsupported'))
  renderPlatforms()
  renderAiPlatforms()
  preserveEditor()
}
function plainText(value) {
  const doc = new DOMParser().parseFromString(value, 'text/html')
  return (doc.body.textContent || '').replace(/\s+/g, ' ').trim()
}
function renderRss() {
  const source = $('rss-source').value
  const list = $('rss-list')
  list.replaceChildren()
  for (const item of rssItems.filter(item => source === 'all' || item.source === source).slice(0, 20)) {
    const row = node('div', '', 'rss-item')
    row.append(node('small', item.source === 'ai-hot' ? 'AI HOT' : '阮一峰'))
    row.append(action(plainText(item.title), () => {
      if (hasContent() && !confirm('用这条资讯替换当前标题、正文和来源链接？'))
        return
      loadDraft({ contentType: 'opinion', title: plainText(item.title), content: plainText(item.summary) || plainText(item.title), url: item.url })
      notice('已带入资讯，编辑观点后可准备平台草稿。', 'success')
    }, 'rss-title'))
    row.append(node('p', plainText(item.summary), 'rss-summary'))
    list.append(row)
  }
  if (!list.children.length)
    list.append(node('p', '暂无资讯，请稍后刷新。', 'section-description'))
}
async function refreshRss() {
  if (rssBusy)
    return
  rssBusy = true
  $('rss-refresh').disabled = true
  $('rss-status').textContent = '正在读取 RSS 精选…'
  try {
    const result = await loadRssPicks()
    rssItems = result.items
    rssLoaded = result.items.length > 0
    renderRss()
    $('rss-status').textContent = result.failedSources.length ? `${result.failedSources.join('、')}读取失败，可点击刷新重试。` : '来自 2aran.com 首页 RSS 精选，点击标题带入编辑。'
  }
  catch { $('rss-status').textContent = '读取失败，请刷新重试。' }
  finally { rssBusy = false; $('rss-refresh').disabled = false }
}
function loadDraft(draft) {
  draftId = draft.id || ''
  $('draft-title').value = draft.title || ''
  $('draft-content').value = draft.content || ''
  $('draft-url').value = draft.url || ''
  changeType(draft.contentType || 'opinion')
  updateEditorCount()
  $('draft-save-state').textContent = draftId ? '已载入本地草稿' : '内容保存在本机'
  $('ai-result').hidden = true
  preserveEditor()
}
function jobRunning() {
  return state.jobs.some(job => job.targets?.some(target => ['pending', 'running'].includes(target.status)))
}
function updateRunButtons() {
  const busy = actionBusy || jobRunning()
  $('run-batch').disabled = busy || selected.size === 0
  $('run-batch').textContent = busy ? '正在准备草稿…' : selected.size ? `准备 ${selected.size} 个平台草稿` : '请先选择分发平台'
  const capability = currentPlatform ? getCapability(currentPlatform.id, contentType) : null
  $('fill-current').disabled = busy || !currentTab?.id || !capability || capability.mode === 'unsupported'
  $('fill-current').textContent = currentPlatform ? capability?.mode === 'manual' ? `打开${currentPlatform.title}，手动完成` : `填入${currentPlatform.title}发布框` : '打开支持的网站以填入'
  $('batch-hint').textContent = jobRunning() ? '后台正在逐个平台处理，可在「记录」中查看进度。' : '依次处理，结果可在「记录」中查看。'
}
function renderPlatforms() {
  $('platform-list').replaceChildren()
  for (const platform of PLATFORMS) {
    const capability = getCapability(platform.id, contentType)
    const label = node('label', '', 'platform-option')
    label.title = capability.hint
    const checkbox = node('input')
    checkbox.type = 'checkbox'
    checkbox.value = platform.id
    checkbox.disabled = capability.mode === 'unsupported'
    checkbox.checked = !checkbox.disabled && selected.has(platform.id)
    checkbox.setAttribute('aria-label', `${platform.title}，${modeNames[capability.mode]}`)
    checkbox.addEventListener('change', () => {
      if (checkbox.checked)
        selected.add(platform.id)
      else selected.delete(platform.id)
      updateRunButtons()
    })
    const copy = node('span', '', 'platform-copy')
    copy.append(node('span', platform.title + (currentPlatform?.id === platform.id ? ' · 本站' : ''), 'platform-name'), node('span', modeNames[capability.mode], 'platform-mode'))
    label.append(checkbox, copy)
    $('platform-list').append(label)
  }
  updateRunButtons()
}
function renderAiPlatforms() {
  const previous = $('ai-platform').value
  $('ai-platform').replaceChildren()
  PLATFORMS.filter(platform => getCapability(platform.id, contentType).mode !== 'unsupported').forEach((platform) => {
    const option = node('option', platform.title)
    option.value = platform.id
    $('ai-platform').append(option)
  })
  const preferred = previous || currentPlatform?.id
  if (preferred && [...$('ai-platform').options].some(option => option.value === preferred))
    $('ai-platform').value = preferred
}
async function refreshContext() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
    currentTab = tab || null
    currentPlatform = detectPlatform(tab?.url || '')
    const site = detectSite(tab?.url || '')
    $('current-site').textContent = currentPlatform?.title || site?.title || '其他网站 · 可从此处分发'
    $('current-site').title = currentPlatform || site ? tab.url : '可以编写内容，再选择分发平台'
    document.querySelector('.context-card').classList.toggle('detected', !!(currentPlatform || site))
    renderPlatforms()
    renderAiPlatforms()
  }
  catch {
    $('current-site').textContent = '请先打开一个网站'
    currentTab = null
    currentPlatform = null
    updateRunButtons()
  }
}
function dateLabel(value) {
  const date = new Date(value)
  return Number.isNaN(date.valueOf()) ? '' : date.toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
}
function emptyState(title, description) {
  const empty = node('div', '', 'empty-state')
  empty.append(node('div', '✧', 'empty-icon'), node('h3', title), node('p', description))
  return empty
}
function renderDrafts() {
  $('draft-count').textContent = String(state.drafts.length)
  $('draft-list').replaceChildren()
  if (!state.drafts.length)
    $('draft-list').append(emptyState('第一份草稿，等你动笔', '在创作页保存内容，下次接着写。'))
  for (const draft of [...state.drafts].sort((a, b) => Number(b.updatedAt) - Number(a.updatedAt))) {
    const card = node('article', '', 'list-card')
    const top = node('div', '', 'card-top')
    top.append(node('h3', draft.title || draft.content?.slice(0, 28) || '未命名草稿'), node('span', typeNames[draft.contentType] || '内容', 'type-badge'))
    const actions = node('div', '', 'card-actions')
    actions.append(action('继续编辑', () => {
      if (hasContent() && draftId !== draft.id && !confirm('载入草稿会替换当前编辑内容。请先保存需要保留的内容，是否继续？'))
        return
      loadDraft(draft)
      showView('compose')
    }), action('删除', async () => {
      if (!confirm(`删除本地草稿「${draft.title || '未命名草稿'}」？`))
        return
      try {
        await rpc('ADM_DELETE_DRAFT', { id: draft.id })
        if (draftId === draft.id) { draftId = ''; preserveEditor() }
        await refreshState()
        notice('已删除本地草稿。', 'success')
      }
      catch (error) { notice(error.message, 'error') }
    }, 'text-button danger'))
    card.append(top, node('p', draft.content?.slice(0, 105) || '', 'card-excerpt'), node('p', dateLabel(draft.updatedAt), 'card-meta'), actions)
    $('draft-list').append(card)
  }
}
async function openTarget(job, target) {
  try { await rpc('ADM_OPEN_TARGET', { jobId: job.id, targetId: target.id }) }
  catch (error) { notice(error.message, 'error') }
}
function renderJobs() {
  $('job-list').replaceChildren()
  if (!state.jobs.length)
    $('job-list').append(emptyState('还没有分发记录', '准备一次草稿，逐个平台查看结果。'))
  for (const job of [...state.jobs].sort((a, b) => Number(b.createdAt) - Number(a.createdAt))) {
    const card = node('article', '', 'list-card')
    const top = node('div', '', 'card-top')
    top.append(node('h3', job.draft?.title || '观点分发'), node('span', typeNames[job.draft?.contentType] || '内容', 'type-badge'))
    card.append(top, node('p', `${dateLabel(job.createdAt)} · ${job.targets?.length || 0} 个平台`, 'card-meta'))
    const targets = node('div', '', 'job-targets')
    for (const target of job.targets || []) {
      const row = node('div', '', 'job-target')
      const title = node('div', '', 'target-title')
      const badge = node('span', statusNames[target.status] || target.status || '待处理', 'status-badge')
      badge.dataset.status = target.status
      title.append(node('span', PLATFORMS.find(platform => platform.id === target.platformId)?.title || target.platformId), badge)
      row.append(title)
      if (target.message)
        row.append(node('p', target.message, 'target-message'))
      const actions = node('div', '', 'target-actions')
      if (target.tabId || target.url)
        actions.append(action('打开平台 ↗', () => openTarget(job, target)))
      if (['failed', 'manual', 'interrupted'].includes(target.status)) {
        const retry = action('重试此平台', async () => {
          if (jobRunning()) { notice('请等待当前批次处理完成后再重试。'); return }
          if (!confirm('请先检查平台是否已经有对应草稿，重试可能创建另一份。确认重试？'))
            return
          retry.disabled = true
          try { await rpc('ADM_RETRY', { jobId: job.id, targetId: target.id }); await refreshState() }
          catch (error) { notice(error.message, 'error'); retry.disabled = false }
        })
        retry.disabled = jobRunning()
        actions.append(retry)
      }
      row.append(actions)
      targets.append(row)
    }
    card.append(targets)
    $('job-list').append(card)
  }
  updateRunButtons()
}
async function refreshState() {
  const next = await rpc('ADM_GET_STATE')
  state = { drafts: next.drafts || [], jobs: next.jobs || [], settings: next.settings || {} }
  renderDrafts()
  renderJobs()
  if (!settingsDirty) {
    $('ai-endpoint').value = state.settings.endpoint || 'https://api.deepseek.com/chat/completions'
    $('ai-model').value = state.settings.model || ''
    $('ai-key').value = state.settings.apiKey || ''
  }
}
async function run(platformIds, currentTabId) {
  if (actionBusy || jobRunning())
    return
  try {
    const draft = activeDraft()
    actionBusy = true
    updateRunButtons()
    await rpc('ADM_RUN', { draft, platformIds, ...(currentTabId ? { currentTabId } : {}) })
    showView('history')
    notice('分发任务已开始。内容准备好后，请打开各平台检查并发布。', 'success')
    await refreshState()
  }
  catch (error) { notice(error.message, 'error') }
  finally { actionBusy = false; updateRunButtons() }
}
function bindEvents() {
  document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => showView(button.dataset.view)))
  for (const type of CONTENT_TYPES) {
    const button = action(type.title, () => changeType(type.id), 'type-button')
    button.dataset.type = type.id
    button.setAttribute('aria-pressed', String(type.id === contentType))
    $('content-types').append(button)
  }
  $('refresh-context').addEventListener('click', refreshContext)
  $('new-draft').addEventListener('click', () => {
    if (hasContent() && !confirm('新建会清空当前编辑内容。请先保存需要保留的内容，是否继续？'))
      return
    loadDraft({ contentType })
    notice('已新建内容。')
    $('draft-title').focus()
  })
  for (const id of ['draft-title', 'draft-content', 'draft-url']) {
    $(id).addEventListener('input', () => {
      updateEditorCount()
      $('draft-save-state').textContent = '有修改 · 记得保存'
      preserveEditor()
    })
  }
  $('compose-form').addEventListener('submit', async (event) => {
    event.preventDefault()
    $('save-draft').disabled = true
    try {
      const result = await rpc('ADM_SAVE_DRAFT', { draft: activeDraft() })
      draftId = result.draft.id
      preserveEditor()
      $('draft-save-state').textContent = '已保存到本地草稿'
      await refreshState()
      notice('草稿已保存在此浏览器。', 'success')
    }
    catch (error) { notice(error.message, 'error') }
    finally { $('save-draft').disabled = false }
  })
  $('capture').addEventListener('click', async () => {
    try {
      await refreshContext()
      if (!currentTab?.id)
        throw new Error('请先在支持的网站选择一段文字')
      let context
      try { context = await chrome.tabs.sendMessage(currentTab.id, { type: 'ADM_CONTEXT' }) }
      catch { throw new Error('无法读取当前页面。请进入支持的网站，刷新后选择文字再试。') }
      if (!context?.selection?.trim())
        throw new Error('请先在网页上选中要采集的文字')
      if (hasContent() && !confirm('采集选区会替换当前编辑内容。请先保存需要保留的内容，是否继续？'))
        return
      loadDraft({ contentType, title: contentType === 'opinion' ? '' : context.title || '', content: context.selection, url: context.url || '' })
      notice('已采集选中文字和来源链接。', 'success')
    }
    catch (error) { notice(error.message, 'error') }
  })
  $('copy-text').addEventListener('click', async () => {
    try {
      const text = buildText(activeDraft())
      if (!text.trim())
        throw new Error('请先填写内容')
      await navigator.clipboard.writeText(text)
      notice('正文已复制。', 'success')
    }
    catch (error) { notice(error.message || '复制失败，请手动复制正文', 'error') }
  })
  $('select-platforms').addEventListener('click', () => {
    const available = PLATFORMS.filter(platform => getCapability(platform.id, contentType).mode !== 'unsupported')
    const allSelected = available.every(platform => selected.has(platform.id))
    selected = new Set(allSelected ? [] : available.map(platform => platform.id))
    $('select-platforms').textContent = allSelected ? '全选可用' : '取消全选'
    renderPlatforms()
  })
  $('run-batch').addEventListener('click', () => run([...selected]))
  $('fill-current').addEventListener('click', () => {
    if (!currentPlatform)
      return
    const capability = getCapability(currentPlatform.id, contentType)
    run([currentPlatform.id], capability.mode === 'fill' ? currentTab?.id : undefined)
  })
  $('generate').addEventListener('click', async () => {
    if (generating)
      return
    try {
      generating = true
      $('generate').disabled = true
      $('generate').textContent = '正在适配，请稍候…'
      const original = rawDraft()
      const result = await rpc('ADM_GENERATE', { draft: activeDraft(), platformId: $('ai-platform').value, instruction: $('ai-instruction').value.trim() })
      $('ai-preview').value = result.text
      $('ai-result').hidden = false
      $('ai-result').dataset.source = JSON.stringify(original)
      notice('适配版本已生成，检查预览后再采用。', 'success')
    }
    catch (error) { notice(error.message, 'error') }
    finally { generating = false; $('generate').disabled = false; $('generate').textContent = '生成适配版本' }
  })
  $('adopt-ai').addEventListener('click', () => {
    if (!$('ai-preview').value.trim()) { notice('生成预览为空，请先生成内容。'); return }
    if ($('ai-result').dataset.source !== JSON.stringify(rawDraft()) && !confirm('当前内容已在生成后发生变化，采用将替换当前正文，是否继续？'))
      return
    $('draft-content').value = $('ai-preview').value
    $('draft-save-state').textContent = '已采用适配稿 · 记得保存'
    updateEditorCount()
    preserveEditor()
    $('ai-result').hidden = true
    notice('已采用为当前正文，保存或分发前请再次检查。', 'success')
  })
  for (const id of ['ai-endpoint', 'ai-model', 'ai-key']) $(id).addEventListener('input', () => { settingsDirty = true })
  $('toggle-key').addEventListener('click', () => {
    const visible = $('ai-key').type === 'password'
    $('ai-key').type = visible ? 'text' : 'password'
    $('toggle-key').textContent = visible ? '隐藏' : '显示'
    $('toggle-key').setAttribute('aria-pressed', String(visible))
    $('toggle-key').setAttribute('aria-label', visible ? '隐藏密钥' : '显示密钥')
  })
  $('settings-form').addEventListener('submit', async (event) => {
    event.preventDefault()
    try {
      const endpoint = new URL($('ai-endpoint').value.trim())
      if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password || endpoint.search || endpoint.hash)
        throw new Error('请填写无账号信息及查询参数的 HTTPS 模型接口地址')
      const model = $('ai-model').value.trim()
      if (!model)
        throw new Error('请填写模型名称')
      // Request immediately inside the user's submit gesture before any awaited work.
      const permission = chrome.permissions.request({ origins: [`${endpoint.origin}/*`] })
      $('save-settings').disabled = true
      if (!await permission)
        throw new Error('未获得模型服务的访问授权，设置未保存')
      await rpc('ADM_SAVE_SETTINGS', { settings: { endpoint: endpoint.href, model, apiKey: $('ai-key').value.trim() } })
      settingsDirty = false
      await refreshState()
      $('ai-key').type = 'password'
      $('toggle-key').textContent = '显示'
      $('toggle-key').setAttribute('aria-label', '显示密钥')
      $('toggle-key').setAttribute('aria-pressed', 'false')
      notice('模型设置已保存在扩展本地。', 'success')
    }
    catch (error) { notice(error.message, 'error') }
    finally { $('save-settings').disabled = false }
  })
  chrome.storage.onChanged.addListener((_changes, area) => {
    if (!ready || area !== 'local')
      return
    clearTimeout(refreshTimer)
    refreshTimer = setTimeout(() => refreshState().catch(error => notice(error.message, 'error')), 100)
  })
  chrome.tabs.onActivated.addListener(() => refreshContext())
  chrome.tabs.onUpdated.addListener((tabId, change) => {
    if (tabId === currentTab?.id && (change.url || change.status === 'complete'))
      refreshContext()
  })
}
function renderUpdate(update) {
  const installed = update.installed || chrome.runtime.getManifest().version
  const messages = {
    unknown: `v${installed} · 尚未检测`,
    latest: `v${installed} · 当前目录已是最新版`,
    updated: `v${installed} · 已更新`,
    available: `v${installed} → v${update.version} · 新版空闲后自动更新`,
    waiting: `v${update.version} 等待更新 · 当前任务结束后自动加载`,
    applying: `正在加载 v${update.version}…`,
    failed: `v${installed} · ${update.error || '检测失败，请重试'}`,
  }
  $('update-status').textContent = messages[update.phase] || messages.unknown
  $('apply-update').hidden = !['available', 'waiting', 'failed'].includes(update.phase)
  $('apply-update').disabled = update.phase === 'applying'
}
async function checkUpdate(apply = false) {
  $('check-update').disabled = true
  $('apply-update').disabled = true
  try { renderUpdate(await rpc(apply ? 'ADM_APPLY_UPDATE' : 'ADM_CHECK_UPDATE')) }
  catch (error) { $('update-status').textContent = error.message }
  finally { $('check-update').disabled = false; $('apply-update').disabled = false }
}
async function initialize() {
  bindEvents()
  initializeMonitorPanel(rpc)
  initializePlatformTools({ rpc, showView, notice })
  $('check-update').addEventListener('click', () => checkUpdate())
  $('apply-update').addEventListener('click', async () => { await preserveEditor(); await checkUpdate(true) })
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.admLocalUpdate?.newValue)
      renderUpdate(changes.admLocalUpdate.newValue)
  })
  const recovery = (await chrome.storage.local.get('admEditorRecovery')).admEditorRecovery
  $('rss-refresh').addEventListener('click', refreshRss)
  $('rss-source').addEventListener('change', renderRss)
  let recovered
  try { recovered = recovery || JSON.parse(sessionStorage.getItem('adm-editor') || 'null') }
  catch { /* A corrupt session draft must not prevent the workbench opening. */ }
  loadDraft(recovered && typeof recovered === 'object' ? recovered : { contentType: 'opinion' })
  try { await Promise.all([refreshState(), refreshContext(), checkUpdate()]); ready = true }
  catch (error) { notice(error.message, 'error') }
}
initialize()
