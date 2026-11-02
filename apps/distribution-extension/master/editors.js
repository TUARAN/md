// Self-contained: executes in the site's MAIN world, never clicks publish.
export function fillEditor({ platformId, title, text, contentType, phase = 'fill' }) {
  const longform = contentType === 'article' || !['twitter', 'juejin', 'xiaohongshu', 'zhihu', 'weibo'].includes(platformId)
  const shortSelectors = {
    twitter: ['[data-testid="tweetTextarea_0"][contenteditable="true"][role="textbox"]'],
    juejin: ['.rich-input[contenteditable="true"]', '.rich-editor[contenteditable="true"]', '.pin-editor [contenteditable="true"]', '.byte-input [contenteditable="true"]', '[contenteditable="true"][data-placeholder*="沸点"]', 'textarea[placeholder*="沸点"]'],
    xiaohongshu: ['.tiptap[contenteditable="true"]', '.ql-editor[contenteditable="true"]', '[contenteditable="true"][data-placeholder*="正文"]'],
    zhihu: ['.public-DraftEditor-content[contenteditable="true"]', '[contenteditable="true"][data-placeholder*="分享此刻"]', '.WriteIdea-content [contenteditable="true"]', '.WriteIdea-content .public-DraftEditor-content', '[contenteditable="true"][data-placeholder*="想法"]'],
    weibo: ['textarea[placeholder*="新鲜事"]', 'textarea[placeholder*="分享"]', 'textarea.Form_input_2gtXx', '.W_input[title="微博输入框"]'],
  }
  const titles = {
    juejin: 'input.title-input, textarea.title-input, input[placeholder*="文章标题"]',
    csdn: '#txtTitle, textarea.article-bar__title, input[placeholder*="文章标题"]',
    segmentfault: 'input[name="title"], input[placeholder*="标题"]',
    cnblogs: '#post-title, #Editor_Edit_txbTitle, input[placeholder*="标题"]',
    xiaohongshu: 'input[placeholder*="标题"], textarea[placeholder*="标题"]',
  }
  const visible = element => !!(element && element.getClientRects().length && !element.closest('[role="dialog"][aria-hidden="true"]'))
  const find = selector => selector ? [...document.querySelectorAll(selector)].filter(visible) : []
  // CodeMirror instances are accessed in MAIN world, as in the reference Juejin extension.
  const cm = longform && platformId !== 'xiaohongshu' ? find('.CodeMirror').filter(el => el.CodeMirror?.getValue && el.CodeMirror?.setValue) : []
  const editors = longform && platformId !== 'xiaohongshu'
    ? find('textarea[placeholder*="Markdown"], textarea[name="markdown"], #Editor_Edit_EditorBody')
    : [...new Set((shortSelectors[platformId] || []).flatMap(find))]
  if (cm.length + editors.length !== 1) {
    // Open only an explicit compose entry; never click a submit/publish button.
    const labels = platformId === 'juejin' ? ['发布沸点', '写沸点'] : platformId === 'zhihu' ? ['写想法', '分享此刻的想法...', '分享你此刻的想法'] : []
    if (phase === 'fill') {
      const entries = find('button, [role="tab"], a, div, span').filter(el => el.childElementCount === 0 && labels.includes((el.textContent || '').trim()))
      if (entries.length === 1)
        entries[0].click()
    }
    return { success: false, manual: true, retryable: phase === 'fill', message: cm.length + editors.length > 1 ? '发现多个发布框，请打开单独的空白编辑页后重试。' : '未找到发布框，正在等待编辑器；请确认已登录。' }
  }
  const editor = cm[0] || editors[0]
  // Rich editor line breaks must be read as rendered text, not concatenated nodes.
  // eslint-disable-next-line unicorn/prefer-dom-node-text-content
  const read = el => el.CodeMirror ? el.CodeMirror.getValue() : 'value' in el ? el.value : (el.innerText || el.textContent || '')
  const normalized = value => value.replace(/\r\n/g, '\n').replace(/\u00A0/g, ' ').trim()
  if (phase === 'verify') {
    const success = normalized(read(editor)) === normalized(text)
    return { success, manual: !success, message: success ? '已完整填入正文；请检查后手动发布。' : '正文回读不一致，请检查页面，未自动重复填写。' }
  }
  if (read(editor).trim())
    return { success: false, manual: true, message: '发布框已有内容，为避免覆盖，请手动检查或打开空白草稿。' }
  const titleCandidates = longform || platformId === 'xiaohongshu' ? find(titles[platformId]) : []
  if (title && (longform || platformId === 'xiaohongshu') && titleCandidates.length !== 1)
    return { success: false, manual: true, message: '未找到唯一的标题框，已停止填写，请手动检查。' }
  const titleEditor = titleCandidates[0]
  if (titleEditor && read(titleEditor).trim())
    return { success: false, manual: true, message: '标题框已有内容，已停止填写。' }
  function setNative(el, value) {
    if (el.CodeMirror) {
      el.CodeMirror.setValue(value)
      el.CodeMirror.save?.()
    }
    else if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      el.focus()
      const proto = el instanceof HTMLInputElement ? HTMLInputElement.prototype : HTMLTextAreaElement.prototype
      Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value)
      el.dispatchEvent(new Event('input', { bubbles: true }))
      el.dispatchEvent(new Event('change', { bubbles: true }))
    }
    else {
      el.focus()
      const selection = window.getSelection()
      const range = document.createRange()
      range.selectNodeContents(el)
      selection.removeAllRanges()
      selection.addRange(range)
      if (!document.execCommand('insertText', false, value))
        return false
      // execCommand already emits input. A second synthetic event corrupts Draft.js state.
    }
    return read(el).replace(/\r\n/g, '\n').trim() === value.trim()
  }
  if (titleEditor && title && !setNative(titleEditor, title))
    return { success: false, manual: true, message: '标题未能正确填入，请手动检查。' }
  // A distinct title field must not cause the title to be duplicated in the body.
  const body = titleEditor && title && text.startsWith(`${title}\n\n`) ? text.slice(title.length + 2) : text
  if (['twitter', 'zhihu'].includes(platformId)) {
    editor.focus()
    const selection = window.getSelection()
    const range = document.createRange()
    range.selectNodeContents(editor)
    range.collapse(false)
    selection.removeAllRanges()
    selection.addRange(range)
    return { success: false, needsNativeInput: true, inputText: body }
  }
  if (!setNative(editor, body))
    return { success: false, manual: true, message: '未能确认正文完整填入，请检查当前页面，勿重复提交。' }
  return { success: true, message: '已填入发布框；请检查格式、图片和链接后手动发布。' }
}
