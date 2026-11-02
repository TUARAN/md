/* eslint test/no-import-node-test: off, unicorn/prefer-dom-node-text-content: off -- Read rendered line breaks exactly as the editor does. */
import assert from 'node:assert/strict'
import test from 'node:test'
import vm from 'node:vm'
import { fillEditor } from '../master/editors.js'

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
