/* eslint test/no-import-node-test: off, unicorn/prefer-dom-node-text-content: off -- Read rendered line breaks exactly as the editor does. */
import assert from 'node:assert/strict'
import test from 'node:test'
import vm from 'node:vm'
import { fillEditor, focusNativeEditor } from '../master/editors.js'

function dom({ body = '', title = '', withTitle = true, codeMirror = true } = {}) {
  class Input {
    constructor(value) { this._value = value }
    get value() { return this._value }
    set value(value) { this._value = value }
    getClientRects() { return [1] }
    closest() { return null }
    focus() {}
    dispatchEvent() {}
  }
  class Textarea extends Input {}
  const titleNode = new Input(title)
  let content = body
  const editor = new Textarea(body)
  if (codeMirror)
    editor.CodeMirror = { getValue: () => content, setValue: (text) => { content = text }, save: () => {} }
  const document = {
    querySelectorAll: selector => selector === '.CodeMirror' ? [editor] : selector.startsWith('input.title-input') || selector.startsWith('input[placeholder*="标题"]') ? withTitle ? [titleNode] : [] : selector.includes('.tiptap') ? [editor] : [],
  }
  const context = vm.createContext({ document, HTMLInputElement: Input, HTMLTextAreaElement: Textarea, Event: class {}, InputEvent: class {}, window: {} })
  const fill = vm.runInContext(`(${fillEditor.toString()})`, context)
  return { fill, titleNode, content: () => codeMirror ? content : editor.value }
}
test('restored article body is never overwritten and title remains untouched', () => {
  const d = dom({ body: '未完成的原草稿' })
  const r = d.fill({ platformId: 'juejin', contentType: 'article', title: '新文章', text: '新正文' })
  assert.equal(r.success, false)
  assert.match(r.message, /已有内容/)
  assert.equal(d.content(), '未完成的原草稿')
  assert.equal(d.titleNode.value, '')
})
test('occupied article title stops both fields before mutation', () => {
  const d = dom({ title: '保留的标题' })
  assert.equal(d.fill({ platformId: 'juejin', contentType: 'article', title: '新', text: '正文' }).success, false)
  assert.equal(d.content(), '')
  assert.equal(d.titleNode.value, '保留的标题')
})
test('blank Markdown editor writes title and body separately and verifies content', () => {
  const d = dom()
  const r = d.fill({ platformId: 'juejin', contentType: 'article', title: '测试文章', text: '测试文章\n\n# 小节\n\n正文' })
  assert.equal(r.success, true)
  assert.equal(d.titleNode.value, '测试文章')
  assert.equal(d.content(), '# 小节\n\n正文')
})
test('missing title field refuses XHS fill rather than dropping the title', () => {
  const d = dom({ codeMirror: false, withTitle: false })
  const r = d.fill({ platformId: 'xiaohongshu', contentType: 'article', title: '必须保留的标题', text: '介绍' })
  assert.equal(r.success, false)
  assert.match(r.message, /标题框/)
  assert.equal(d.content(), '')
})

function socialEditor(selector, initial = '') {
  const editor = { innerText: initial, getClientRects: () => [1], closest: () => null, focus() {} }
  const document = { querySelectorAll: query => query === selector ? [editor] : [], createRange: () => ({ selectNodeContents() {}, collapse() {} }) }
  const context = vm.createContext({ document, HTMLInputElement: class {}, HTMLTextAreaElement: class {}, window: { getSelection: () => ({ removeAllRanges() {}, addRange() {} }) } })
  return { editor, fill: vm.runInContext(`(${fillEditor.toString()})`, context) }
}
test('X selects native insertion instead of synthetic Draft.js input', () => {
  const d = socialEditor('[data-testid="tweetTextarea_0"][contenteditable="true"][role="textbox"]')
  const result = d.fill({ platformId: 'twitter', contentType: 'opinion', text: '正文\n\nhttps://example.com' })
  assert.equal(result.needsNativeInput, true)
  assert.equal(d.editor.innerText, '')
  d.editor.innerText = result.inputText
  assert.equal(d.fill({ platformId: 'twitter', contentType: 'opinion', text: result.inputText, phase: 'verify' }).success, true)
})
test('current Zhihu Draft.js class is recognized and existing content is preserved', () => {
  const d = socialEditor('.public-DraftEditor-content[contenteditable="true"]', '原想法')
  assert.match(d.fill({ platformId: 'zhihu', contentType: 'opinion', text: '新想法' }).message, /已有内容/)
  assert.equal(d.editor.innerText, '原想法')
})

test('Draft.js readback uses block boundaries instead of layout blank lines', () => {
  const d = socialEditor('[data-testid="tweetTextarea_0"][contenteditable="true"][role="textbox"]', '第一行\n\n\n\n第二行')
  d.editor.querySelectorAll = () => [{ innerText: '第一行' }, { innerText: '\n' }, { innerText: '第二行' }]
  assert.equal(d.fill({ platformId: 'twitter', contentType: 'opinion', text: '第一行\n\n第二行', phase: 'verify' }).success, true)
  assert.equal(d.fill({ platformId: 'twitter', contentType: 'opinion', text: '不同的正文', phase: 'verify' }).success, false)
})
test('nested matching editable nodes count as one editor', () => {
  const child = { innerText: '已填内容', getClientRects: () => [1], closest: () => null }
  const parent = { ...child, contains: node => node === child }
  const document = { querySelectorAll: selector => selector === '.rich-input[contenteditable="true"]' ? [parent] : selector === '.pin-editor [contenteditable="true"]' ? [child] : [] }
  const fill = vm.runInContext(`(${fillEditor.toString()})`, vm.createContext({ document }))
  assert.equal(fill({ platformId: 'juejin', contentType: 'opinion', text: '已填内容', phase: 'verify' }).success, true)
})
test('native focus guard refuses navigation or an occupied editor', () => {
  const editor = { getAttribute: () => 'token', getClientRects: () => [1], innerText: '已输入' }
  const focus = vm.runInContext(`(${focusNativeEditor.toString()})`, vm.createContext({ location: { href: 'https://x.com/compose/post' }, document: { querySelectorAll: () => [editor] } }))
  assert.match(focus({ token: 'token', url: 'https://x.com/home' }).reason, /跳转/)
  assert.match(focus({ token: 'token', url: 'https://x.com/compose/post' }).reason, /已有内容/)
})

test('Juejin writes paragraphs through its existing plugin input path and preserves blank lines', () => {
  const events = []
  let paragraphs = []
  const editor = {
    get innerText() { return paragraphs.map(node => node.textContent || '').join('\n') },
    getClientRects: () => [1],
    closest: () => null,
    focus() {},
    replaceChildren: (...nodes) => { paragraphs = nodes },
    dispatchEvent: (event) => { events.push(event) },
  }
  const document = {
    querySelectorAll: selector => selector === '.rich-editor[contenteditable="true"]' ? [editor] : [],
    createElement: tag => ({ tag, textContent: '', append() {} }),
  }
  const context = vm.createContext({ document, HTMLInputElement: class {}, HTMLTextAreaElement: class {}, InputEvent: class { constructor(type, data) { Object.assign(this, { type }, data) } } })
  const fill = vm.runInContext(`(${fillEditor.toString()})`, context)
  assert.equal(fill({ platformId: 'juejin', contentType: 'opinion', text: '第一行\n\n第二段\n第三行' }).success, true)
  assert.equal(editor.innerText, '第一行\n\n第二段\n第三行')
  assert.equal(events.length, 1)
  assert.equal(events[0].inputType, 'insertText')
  assert.match(fill({ platformId: 'juejin', contentType: 'opinion', text: '替换正文' }).message, /已有内容/)
  assert.equal(events.length, 1)
})
test('main-world origin guard refuses a navigation that happened after tab inspection', () => {
  const fill = vm.runInContext(`(${fillEditor.toString()})`, vm.createContext({ URL, location: { href: 'https://wrong-site.example/editor' } }))
  assert.equal(fill({ platformId: 'juejin', contentType: 'opinion', text: '正文', expectedHosts: ['juejin.cn'] }).code, 'PAGE_CHANGED')
})
