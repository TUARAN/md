// Functions in this module are injected into platform pages; keep them closure-free.
export async function checkinPage() {
  if (location.origin !== 'https://juejin.cn' || !/^\/user\/center\/signin\/?$/.test(location.pathname))
    return { message: '请先打开掘金签到页' }
  // Read visible confirmation text; hidden page templates must not count as success.
  // eslint-disable-next-line unicorn/prefer-dom-node-text-content
  const text = () => document.body?.innerText || ''
  if (/已签到|今日已签/.test(text()))
    return { done: true, message: '今日已经签到' }
  const button = document.querySelector('button.signin.btn')
  if (!button || !/立即签到/.test(button.textContent || ''))
    return { retry: true, message: '签到按钮未出现，请确认已登录' }
  button.click()
  for (let i = 0; i < 20; i++) {
    await new Promise(resolve => setTimeout(resolve, 200))
    if (/已签到|签到成功|今日已签/.test(text()))
      return { done: true, message: '今日签到成功，已确认页面结果' }
  }
  return { message: '已点击签到，但未能确认成功；请核对页面后再操作' }
}
export function mountNoteManager() {
  if (location.origin !== 'https://creator.xiaohongshu.com' || !/^\/new\/note-manager(?:\/|$)/.test(location.pathname))
    return { error: '请先登录小红书创作平台并打开笔记管理页' }
  if (document.getElementById('xhs-interaction-panel'))
    return { error: '此页面仍在加载旧小红书插件，请先停用旧插件并刷新笔记管理页，避免两份工具同时调整笔记。' }
  if (document.getElementById('adm-xhs-manager-panel')) { document.getElementById('adm-xhs-manager-panel').hidden = false; return { ready: true } }
  const panel = document.createElement('aside')
  panel.id = 'adm-xhs-manager-panel'
  panel.setAttribute('aria-label', 'AI 分发大师 · 笔记管理')
  panel.innerHTML = `<header><strong>AI 分发大师 · 笔记管理</strong><button type="button" data-xhsia-close>收起</button></header><p>先预览，再调整可见范围。不会删除笔记。</p><p>评论超过 10 条的笔记设为公开；其余点赞少于 100 且统计可读取的笔记设为仅自己可见。其余跳过。</p><div class="xhsia-body xhsia-poster" hidden></div>`
  const style = document.createElement('style')
  style.textContent = `#adm-xhs-manager-panel{position:fixed;z-index:2147483646;right:18px;bottom:18px;width:340px;max-width:calc(100vw - 36px);max-height:80vh;overflow:auto;background:#fffdf7;color:#213a35;border:1px solid #dadfd6;border-radius:16px;box-shadow:0 12px 45px #16352b30;padding:16px;font:13px/1.6 system-ui}#adm-xhs-manager-panel [hidden]{display:none!important}#adm-xhs-manager-panel header{display:flex;justify-content:space-between;align-items:center}#adm-xhs-manager-panel button,#adm-xhs-manager-panel select{font:inherit;padding:6px 10px;border:1px solid #cad8cf;border-radius:8px;background:#eef4ef;color:#213a35;cursor:pointer}#adm-xhs-manager-panel button:disabled{opacity:.5;cursor:default}#adm-xhs-manager-panel .xhsp-list,#adm-xhs-manager-panel .xhsp-skipped ol{max-height:160px;overflow:auto;padding-left:22px}#adm-xhs-manager-panel .xhsp-actions{display:flex;gap:8px}#adm-xhs-manager-panel .xhsp-status{white-space:pre-wrap}#adm-xhs-manager-panel .xhsp-range{display:flex;justify-content:space-between}`
  panel.append(style)
  document.documentElement.append(panel)
  panel.querySelector('[data-xhsia-close]').addEventListener('click', () => { panel.hidden = true })
  return { ready: true }
}
