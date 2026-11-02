import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import { checkinPage, mountNoteManager } from '../master/tool-pages.js'

const source = await readFile(new URL('../master/platform-tools.js', import.meta.url), 'utf8')
async function runtime() {
  let stored = {}; let listener; let result = { done: true, message: '已签到' }; const calls = []
  const active = { id: 1, url: 'https://example.com/' }
  const chrome = {
    storage: { local: { get: async key => ({ [key]: stored[key] }), set: async (value) => { stored = { ...stored, ...value } } } },
    alarms: { create: async (...args) => calls.push(['alarm', ...args]), clear: async (...args) => calls.push(['clear', ...args]), onAlarm: { addListener() {} } },
    tabs: { query: async query => query.active ? [active] : [], create: async (options) => { calls.push(['open', options]); return { id: 2, ...options } }, update: async () => {}, get: async () => active },
    scripting: { executeScript: async () => { calls.push(['script']); return [{ result }] } },
    runtime: { id: 'test', getURL: path => `chrome-extension://test/${path}`, onMessage: { addListener: (fn) => { listener = fn } } },
  }
  const context = vm.createContext({ chrome, crypto, checkinPage, mountNoteManager, URL, Date, Intl, console, setTimeout })
  vm.runInContext(`${source.replace(/^import .*\n/gm, '').replace('export async function handleTool', 'async function handleTool')}\nglobalThis.handle = handleTool`, context)
  await Promise.resolve()
  return { context, calls, get stored() { return stored }, get listener() { return listener }, fail: () => { result = { message: '未确认' } } }
}
test('tools default off; explicit opt-in can be reversed without changing drafts', async () => {
  const r = await runtime()
  assert.equal((await r.context.handle({ type: 'ADM_TOOL_STATE' })).autoCheckin, false)
  assert.ok(!r.calls.some(c => c[0] === 'open'))
  await r.context.handle({ type: 'ADM_TOOL_AUTO', enabled: true })
  assert.ok(r.calls.some(c => c[0] === 'alarm'))
  await r.context.handle({ type: 'ADM_TOOL_AUTO', enabled: false })
  assert.equal(r.stored.admPlatformTools.autoCheckin, false)
})
test('confirmed checkin is recorded once per Beijing day; unconfirmed clicks stay retryable', async () => {
  const r = await runtime()
  await r.context.handle({ type: 'ADM_TOOL_CHECKIN' })
  await r.context.handle({ type: 'ADM_TOOL_CHECKIN' })
  assert.equal(r.calls.filter(c => c[0] === 'script').length, 1)
  assert.equal(r.stored.admPlatformTools.records.length, 1)
  const failed = await runtime(); failed.fail()
  await assert.rejects(failed.context.handle({ type: 'ADM_TOOL_CHECKIN' }), /未确认/)
  assert.equal(failed.stored.admPlatformTools.checkinDay, '')
})
test('website senders cannot start tools or send permission clicks', async () => {
  const r = await runtime(); let response
  assert.equal(r.listener({ type: 'ADM_TOOL_CLICK', x: 10, y: 10 }, { id: 'other', tab: { id: 1 } }, (x) => { response = x }), false)
  r.listener({ type: 'ADM_TOOL_CHECKIN' }, { id: 'test', url: 'https://juejin.cn/', tab: { id: 1 } }, (x) => { response = x })
  assert.match(response.error, /仅插件/)
  assert.equal(r.calls.filter(c => c[0] === 'script').length, 0)
})
test('signin button disappearing alone never counts as success', async () => {
  const context = vm.createContext({ location: { origin: 'https://juejin.cn', pathname: '/user/center/signin' }, document: { body: { innerText: '' }, querySelector: () => ({ textContent: '立即签到', click() {} }) }, setTimeout: fn => fn() })
  const result = await vm.runInContext(`(${checkinPage.toString()})()`, context)
  assert.equal(result.done, undefined)
  assert.match(result.message, /未能确认/)
})
test('reused note manager retains verification and requires explicit confirmation', async () => {
  const manager = await readFile(new URL('../master/xhs-manager.js', import.meta.url), 'utf8')
  assert.match(manager, /confirm\(/)
  assert.match(manager, /core.inspectCandidate/)
  assert.match(manager, /saved !== item.target/)
  assert.match(manager, /adm-xhs-manager-panel/)
  assert.doesNotMatch(manager, /type: "xhsia-permission-click"/)
})

test('integrated note rules preserve comment priority and skip unknown counts or changed data', async () => {
  const code = await readFile(new URL('../master/xhs-manager-core.js', import.meta.url), 'utf8')
  const context = vm.createContext({})
  vm.runInContext(code, context)
  const core = context.XhsNoteManagerCore
  assert.equal(core.targetVisibility(99, 10), '仅自己可见')
  assert.equal(core.targetVisibility(99, 11), '公开可见')
  assert.equal(core.targetVisibility(100, 10), null)
  assert.equal(core.targetVisibility(99, null), null)
  assert.equal(core.parseCount('99+'), null)
  assert.equal(core.withinRange({ publishedAt: null }, Date.now()), false)
  assert.equal(core.inspectCandidate({ id: 'missing' }, null).skipReason, '笔记已从列表消失')
})
