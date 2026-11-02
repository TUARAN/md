import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import * as core from '../master/core.js'

const content = await readFile(new URL('../master/content.js', import.meta.url), 'utf8')
async function page(url) {
  let listener; const appended = []; const messages = []
  const element = () => ({ textContent: '', append() {}, addEventListener() {}, attachShadow: () => ({ append() {} }) })
  const context = vm.createContext({ core, location: { href: url }, document: { title: '测试页面', createElement: element, documentElement: { append: node => appended.push(node) } }, window: { getSelection: () => '选中文字' }, chrome: { runtime: { id: 'test', getURL: name => name, sendMessage: async value => messages.push(value), onMessage: { addListener: (fn) => { listener = fn } } } } })
  await vm.runInContext(content.replace('await import(chrome.runtime.getURL(\'master/core.js\'))', 'core'), context)
  return { appended, listener, messages }
}
test('floating entry mounts on main and admin only; context response still works', async () => {
  for (const url of ['https://2aran.com/', 'https://admin.2aran.com/admin/community-actions/monitor']) {
    const p = await page(url)
    assert.equal(p.appended.length, 1)
    let reply
    p.listener({ type: 'ADM_CONTEXT' }, { id: 'test' }, (value) => { reply = value })
    assert.equal(reply.platformId, null)
    assert.equal(reply.url, url)
    assert.equal(reply.selection, '选中文字')
  }
  for (const url of ['https://x.com/home', 'https://juejin.cn/', 'https://creator.xiaohongshu.com/', 'https://syncblog.2aran.com/', 'https://2aran.com.evil.test/']) {
    const p = await page(url)
    assert.equal(p.appended.length, 0)
    assert.equal(p.messages.length, 0)
  }
})
test('upgrade cleanup removes only retired floating UI without refreshing pages', async () => {
  const source = await readFile(new URL('../master/entry-cleanup.js', import.meta.url), 'utf8')
  const calls = []
  const context = vm.createContext({ core, console, chrome: { tabs: { query: async () => [
    { id: 1, url: 'https://x.com/home' },
    { id: 2, url: 'https://admin.2aran.com/admin' },
    { id: 3, url: 'https://syncblog.2aran.com/' },
    { id: 4, url: 'https://example.com' },
  ] }, scripting: { executeScript: async value => calls.push(value) } } })
  await vm.runInContext(source.replace(/^import .*\n/gm, 'const { detectPlatform, detectSite } = core;\n'), context)
  assert.deepEqual(calls.map(call => call.target.tabId), [1, 3])
  let removed = 0
  const sandbox = vm.createContext({ document: { querySelectorAll: (selector) => { assert.equal(selector, 'ai-distribution-master'); return [{ remove: () => removed++ }] } } })
  vm.runInContext(`(${calls[0].func.toString()})()`, sandbox)
  assert.equal(removed, 1)
})
