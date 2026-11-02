/* global chrome */
export function initializePlatformTools({ rpc, showView, notice }) {
  const $ = id => document.getElementById(id)
  async function refresh() {
    const state = await rpc('ADM_TOOL_STATE')
    $('tool-auto-checkin').checked = state.autoCheckin
    $('tool-checkin-status').textContent = state.checkinDay ? `最近签到：${state.checkinDay} · 北京时间` : '尚无签到记录'
    $('open-platform-tools').textContent = state.autoCheckin ? '平台工具 · 1' : '平台工具'
    for (const id of ['platform-tool-records', 'history-tool-records']) {
      const list = $(id)
      list.replaceChildren()
      for (const item of state.records) {
        const row = document.createElement('p')
        row.className = 'tool-record'
        row.textContent = `${new Date(item.at).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })} · ${item.tool}：${item.message}`
        list.append(row)
      }
      if (!state.records.length)
        list.textContent = '暂无平台任务记录'
    }
  }
  async function perform(button, type, payload = {}) {
    button.disabled = true
    try { const result = await rpc(type, payload); notice(result.message || '设置已保存', 'success'); await refresh() }
    catch (error) { notice(error.message, 'error') }
    finally { button.disabled = false }
  }
  $('open-platform-tools').addEventListener('click', async () => {
    showView('tools')
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
    const host = (() => {
      try { return new URL(tab?.url).hostname }
      catch { return '' }
    })()
    const preferred = host.endsWith('xiaohongshu.com') ? 'tool-xhs-card' : 'tool-juejin-card'
    $('platform-tool-cards').prepend($(preferred))
    $('platform-tools-context').textContent = host === 'juejin.cn' ? '掘金工具已排在前面，也可以使用小红书工具。' : host.endsWith('xiaohongshu.com') ? '小红书工具已排在前面，也可以使用掘金工具。' : '全部平台工具 · 打开对应页面后使用当前登录账号。'
    refresh().catch(error => notice(error.message, 'error'))
  })
  $('tool-back').addEventListener('click', () => showView('compose'))
  $('tool-checkin').addEventListener('click', event => perform(event.currentTarget, 'ADM_TOOL_CHECKIN'))
  $('tool-auto-checkin').addEventListener('change', event => perform(event.currentTarget, 'ADM_TOOL_AUTO', { enabled: event.currentTarget.checked }))
  $('tool-xhs-manager').addEventListener('click', event => perform(event.currentTarget, 'ADM_TOOL_MANAGER'))
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.admPlatformTools)
      refresh().catch(console.error)
  })
  refresh().catch(error => notice(error.message, 'error'))
}
