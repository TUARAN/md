/* global chrome */
;(async () => {
  if (globalThis.__aiDistributionMaster)
    return
  globalThis.__aiDistributionMaster = true
  const { detectPlatform, detectSite } = await import(chrome.runtime.getURL('master/core.js'))
  const site = detectSite(location.href)
  if (!site?.floatingEntry)
    return
  const host = document.createElement('ai-distribution-master')
  const root = host.attachShadow({ mode: 'closed' })
  const style = document.createElement('style')
  style.textContent = ':host{all:initial;position:fixed;right:16px;bottom:24px;z-index:2147483647}button{font:600 13px system-ui,sans-serif;border:1px solid #e8c8b9;border-radius:100px;background:#fff9f1;color:#9f452a;padding:12px 16px;cursor:pointer;box-shadow:0 4px 20px #412a1d20}button:hover{background:#f8e7db}button:focus-visible{outline:3px solid #b95230;outline-offset:3px}'
  const button = document.createElement('button')
  button.textContent = '✦ AI 分发大师'
  button.title = `打开分发侧栏 · ${site.title}`
  button.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'ADM_OPEN' }).then((result) => {
      if (result?.error)
        button.textContent = '请点击工具栏图标打开'
    }).catch(() => { button.textContent = '插件已更新，请刷新页面' })
  })
  root.append(style, button)
  document.documentElement.append(host)
  chrome.runtime.onMessage.addListener((message, sender, respond) => {
    if (sender.id !== chrome.runtime.id || message.type !== 'ADM_CONTEXT')
      return false
    respond({ platformId: detectPlatform(location.href)?.id || null, title: document.title, url: location.href, selection: window.getSelection()?.toString().slice(0, 200000) || '' })
    return false
  })
})().catch(() => {})
