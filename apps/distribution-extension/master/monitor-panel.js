/* global chrome */
export function initializeMonitorPanel(rpc) {
  const $ = id => document.getElementById(id)
  async function refresh() {
    const state = await rpc('ADM_MONITOR_STATUS')
    $('monitor-enabled').checked = state.enabled
    $('monitor-secret').placeholder = state.configured ? '已配置；留空保留原密钥' : '填写站长回执密钥'
    $('monitor-status').textContent = state.error ? `上报失败：${state.error}；请确认后台已上线并检查密钥。` : state.lastReportAt ? `最近同步：${new Date(state.lastReportAt).toLocaleString('zh-CN')} · ${state.enabled ? '已开启' : '已关闭'}` : '尚未上报；保存开启后自动同步。'
  }
  $('monitor-form').addEventListener('submit', async (event) => {
    event.preventDefault(); $('monitor-save').disabled = true
    try {
      await rpc('ADM_MONITOR_CONFIG', { config: { enabled: $('monitor-enabled').checked, secret: $('monitor-secret').value } })
      $('monitor-secret').value = ''; await refresh()
    }
    catch (error) { $('monitor-status').textContent = error.message }
    finally { $('monitor-save').disabled = false }
  })
  $('monitor-sync').addEventListener('click', async () => {
    $('monitor-sync').disabled = true; try { await rpc('ADM_MONITOR_SYNC'); await refresh() }
    finally { $('monitor-sync').disabled = false }
  })
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.admMonitorState)
      refresh().catch(console.error)
  })
  refresh().catch(console.error)
}
