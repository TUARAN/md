/* eslint test/no-import-node-test: off */
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import vm from 'node:vm'
import * as core from '../master/core.js'

const source = await readFile(new URL('../master/background.js', import.meta.url), 'utf8')
const key = 'aiDistributionMaster'
const sleep = () => new Promise(resolve => setTimeout(resolve, 5))
async function runtime(initial, scriptResults = []) {
  const saved = initial ? { [key]: structuredClone(initial) } : {}
  let listener
  let release
  const calls = []
  const nativeCalls = []
  const groups = new Map()
  let nextGroupId = 100
  let nextTabId = 2
  const tabs = new Map([[1, { id: 1, url: 'https://x.com/compose/post', status: 'complete', windowId: 1, groupId: -1 }]])
  let occupied = false
  const chrome = {
    storage: { local: {
      setAccessLevel: async ({ accessLevel }) => { assert.equal(accessLevel, 'TRUSTED_CONTEXTS') },
      get: async () => structuredClone(saved),
      set: async (values) => { Object.assign(saved, structuredClone(values)) },
    } },
    runtime: { id: 'test', getURL: path => `chrome-extension://test/${path}`, onMessage: { addListener: (fn) => { listener = fn } } },
    sidePanel: { setPanelBehavior: async () => {}, open: async () => {} },
    permissions: { contains: async () => true },
    windows: { update: async () => {} },
    tabGroups: {
      get: async (id) => {
        if (!groups.has(id))
          throw new Error('closed group'); return groups.get(id)
      },
      update: async (id, values) => { Object.assign(groups.get(id), values); return groups.get(id) },
    },
    tabs: {
      create: async ({ url }) => { const tab = { id: nextTabId++, url, status: 'complete', windowId: 1, groupId: -1 }; tabs.set(tab.id, tab); return tab },
      get: async (id) => {
        if (!tabs.has(id))
          throw new Error('closed tab'); return tabs.get(id)
      },
      query: async ({ groupId }) => [...tabs.values()].filter(tab => tab.groupId === groupId),
      update: async (id, values) => { Object.assign(tabs.get(id), values); return tabs.get(id) },
      move: async (id, values) => { Object.assign(tabs.get(id), { windowId: values.windowId }); return tabs.get(id) },
      group: async ({ tabIds, groupId }) => {
        if (groupId === undefined) { groupId = nextGroupId++; groups.set(groupId, { id: groupId, windowId: tabs.get(tabIds[0]).windowId }) }
        for (const id of tabIds) { assert.equal(tabs.get(id).windowId, groups.get(groupId).windowId); tabs.get(id).groupId = groupId }
        return groupId
      },
    },
    debugger: { attach: async () => nativeCalls.push('attach'), detach: async () => nativeCalls.push('detach'), sendCommand: async (_target, method, params) => nativeCalls.push({ method, text: params.text }) },
    scripting: { executeScript: async (message) => {
      calls.push(message); if (scriptResults.length)
        return [{ result: scriptResults.shift() }]; if (release)
        await release; return [{ result: { success: !occupied, message: occupied ? '已有内容' : '已填入' } }]
    } },
  }
  const context = vm.createContext({ chrome, structuredClone, console, crypto, URL, AbortSignal, setTimeout: (fn, ms) => setTimeout(fn, Math.min(ms, 5)), core, handleLegacyMessage: async (message) => {
    calls.push(message); if (release)
      await release; return { success: true, tabId: 22 }
  }, fillEditor: () => {} })
  const code = source.replace(/^import .+\n/gm, '').replace('export async function handleMessage', 'async function handleMessage')
  vm.runInContext(`const {buildPayload,buildText,CONTENT_TYPES,detectPlatform,detectSite,getCapability,PLATFORMS,SITE_URL,validateDraft,normalizeDraft,validateSettings}=core;\n${code}\nglobalThis.handle=handleMessage`, context)
  await context.handle({ type: 'ADM_GET_STATE' })
  return { chrome, saved, context, calls, nativeCalls, tabs, groups, occupy: () => { occupied = true }, listener: () => listener, block: (promise) => { release = promise } }
}
async function complete(r) {
  for (let i = 0; i < 80; i++) {
    if (!r.saved[key].jobs.some(j => j.targets.some(t => ['pending', 'running'].includes(t.status))))
      return
    await sleep()
  }
  assert.fail('Job did not settle')
}
const draft = { title: '测试文章', content: '测试正文', contentType: 'article' }
test('draft save updates existing id and keeps only latest 20', async () => {
  const r = await runtime()
  const a = await r.context.handle({ type: 'ADM_SAVE_DRAFT', draft })
  await r.context.handle({ type: 'ADM_SAVE_DRAFT', draft: { ...a.draft, content: '更新' } })
  assert.equal(r.saved[key].drafts.length, 1)
  assert.equal(r.saved[key].drafts[0].content, '更新')
  for (let i = 0; i < 22; i++) await r.context.handle({ type: 'ADM_SAVE_DRAFT', draft: { ...draft, title: `${i}` } })
  assert.equal(r.saved[key].drafts.length, 20)
})
test('batch is serialized, deduplicates targets and refuses concurrent starts', async () => {
  const r = await runtime()
  let unblock
  r.block(new Promise((resolve) => { unblock = resolve }))
  await r.context.handle({ type: 'ADM_RUN', draft, platformIds: ['csdn', 'csdn', 'segmentfault'] })
  await assert.rejects(r.context.handle({ type: 'ADM_RUN', draft, platformIds: ['csdn'] }), /运行/)
  await sleep()
  assert.equal(r.calls.length, 1)
  unblock()
  await complete(r)
  assert.equal(r.calls.length, 2)
  assert.ok(r.saved[key].jobs[0].targets.every(t => t.status === 'prepared'))
  assert.equal(r.calls[0].args[0].contentType, 'article')
})
test('occupied editor is manual, never a false prepared result', async () => {
  const r = await runtime()
  r.occupy()
  await r.context.handle({ type: 'ADM_RUN', draft: { content: '观点', contentType: 'opinion' }, platformIds: ['twitter'], currentTabId: 1 })
  await complete(r)
  assert.equal(r.saved[key].jobs[0].targets[0].status, 'manual')
  assert.equal(r.calls.length, 1)
})
test('restart marks running AND pending items interrupted without executing them', async () => {
  const r = await runtime({ drafts: [], settings: {}, jobs: [{ id: 'old', draft, targets: [{ id: 'a', status: 'running' }, { id: 'b', status: 'pending' }, { id: 'c', status: 'prepared' }] }] })
  assert.equal(r.saved[key].jobs[0].targets[0].status, 'interrupted')
  assert.equal(r.saved[key].jobs[0].targets[1].status, 'interrupted')
  assert.equal(r.saved[key].jobs[0].targets[2].status, 'prepared')
  assert.equal(r.calls.length, 0)
})
test('web content cannot read state/keys or run jobs; trusted extension can', async () => {
  const r = await runtime()
  let response
  const listener = r.listener()
  const rejected = listener({ type: 'ADM_GET_STATE' }, { id: 'test', url: 'https://x.com/home' }, (v) => { response = v })
  assert.equal(rejected, false)
  assert.match(response.error, /仅插件/)
  assert.equal(listener({ type: 'UNRELATED' }, {}, () => {}), false)
  const accepted = listener({ type: 'ADM_GET_STATE' }, { id: 'test', url: 'chrome-extension://test/panel.html' }, (v) => { response = v })
  assert.equal(accepted, true)
  await sleep()
  assert.ok(response.settings)
})
test('invalid batches do not acquire a lasting lock, successful targets cannot retry', async () => {
  const r = await runtime()
  await assert.rejects(r.context.handle({ type: 'ADM_RUN', draft, platformIds: ['unknown'] }))
  await r.context.handle({ type: 'ADM_RUN', draft, platformIds: ['csdn'] })
  await complete(r)
  const job = r.saved[key].jobs[0]
  await assert.rejects(r.context.handle({ type: 'ADM_RETRY', jobId: job.id, targetId: job.targets[0].id }), /不需要/)
})

test('Draft.js native input happens once and only succeeds after full readback', async () => {
  const r = await runtime(undefined, [{ needsNativeInput: true, inputText: '正文\n\nhttps://example.com' }, { success: true }])
  await r.context.handle({ type: 'ADM_RUN', draft: { contentType: 'opinion', content: '正文', url: 'https://example.com' }, platformIds: ['twitter'] })
  await complete(r)
  assert.equal(r.saved[key].jobs[0].targets[0].status, 'prepared')
  assert.deepEqual(r.nativeCalls, ['attach', { method: 'Input.insertText', text: '正文\n\nhttps://example.com' }, 'detach'])
  assert.equal(r.calls[1].args[0].phase, 'verify')
})
test('readback mismatch does not insert text a second time', async () => {
  const r = await runtime(undefined, [{ needsNativeInput: true, inputText: '正文' }, { success: false, message: '回读失败' }])
  await r.context.handle({ type: 'ADM_RUN', draft: { contentType: 'opinion', content: '正文' }, platformIds: ['twitter'] })
  await complete(r)
  assert.equal(r.saved[key].jobs[0].targets[0].status, 'manual')
  assert.equal(r.nativeCalls.filter(call => call.method === 'Input.insertText').length, 1)
  assert.equal(r.calls.length, 2)
})
test('editor mounting is retried even while tab still reports loading', async () => {
  const r = await runtime(undefined, [{ retryable: true }, { success: true }])
  r.chrome.tabs.create = async ({ url }) => { Object.assign(r.tabs.get(1), { url, status: 'loading' }); return r.tabs.get(1) }
  await r.context.handle({ type: 'ADM_RUN', draft: { contentType: 'opinion', content: '正文' }, platformIds: ['zhihu'] })
  await complete(r)
  assert.equal(r.saved[key].jobs[0].targets[0].status, 'prepared')
  assert.equal(r.calls.length, 2)
})

test('all auto and manual platform tabs share a named group; separate batches stay separate', async () => {
  const r = await runtime()
  await r.context.handle({ type: 'ADM_RUN', draft, platformIds: ['csdn', 'wechat', 'segmentfault'] })
  await complete(r)
  const first = r.saved[key].jobs[0]
  assert.equal(new Set(first.targets.map(target => r.tabs.get(target.tabId).groupId)).size, 1)
  assert.equal(r.groups.get(first.groupId).color, 'blue')
  assert.match(r.groups.get(first.groupId).title, /AI 分发 · 文章 · 测试文章/)
  await r.context.handle({ type: 'ADM_RUN', draft, platformIds: ['csdn'] })
  await complete(r)
  assert.notEqual(r.saved[key].jobs[0].groupId, first.groupId)
})
test('reopening a closed target returns it to the job group across windows', async () => {
  const r = await runtime()
  await r.context.handle({ type: 'ADM_RUN', draft, platformIds: ['csdn', 'segmentfault'] })
  await complete(r)
  const job = r.saved[key].jobs[0]
  const target = job.targets[0]
  r.tabs.delete(target.tabId)
  r.groups.get(job.groupId).windowId = 2
  r.tabs.get(job.targets[1].tabId).windowId = 2
  const opened = await r.context.handle({ type: 'ADM_OPEN_TARGET', jobId: job.id, targetId: target.id })
  assert.equal(r.tabs.get(opened.tabId).groupId, job.groupId)
  assert.equal(r.tabs.get(opened.tabId).windowId, 2)
})
test('stale group IDs cannot hijack an unrelated group, and closed tabs can retry', async () => {
  const r = await runtime()
  r.occupy()
  await r.context.handle({ type: 'ADM_RUN', draft: { contentType: 'opinion', content: '无标题的观点' }, platformIds: ['twitter'] })
  await complete(r)
  const job = r.saved[key].jobs[0]
  const oldGroupId = job.groupId
  r.tabs.delete(job.targets[0].tabId)
  r.groups.get(oldGroupId).title = '用户其他标签组'
  await r.context.handle({ type: 'ADM_RETRY', jobId: job.id, targetId: job.targets[0].id })
  await complete(r)
  const next = r.saved[key].jobs[0]
  assert.notEqual(next.groupId, oldGroupId)
  assert.equal(r.groups.get(oldGroupId).title, '用户其他标签组')
  assert.match(next.groupTitle, /观点 · 无标题的观点/)
})

test('page floating button can open panel only on the declared owner entry hosts', async () => {
  const r = await runtime()
  const opened = []
  r.chrome.sidePanel.open = async ({ tabId }) => { opened.push(tabId) }
  for (const url of ['https://2aran.com/', 'https://admin.2aran.com/admin/community-actions/monitor']) {
    let response
    assert.equal(r.listener()({ type: 'ADM_OPEN' }, { id: 'test', tab: { id: 9, url } }, (value) => { response = value }), true)
    await Promise.resolve()
    assert.equal(response.success, true)
  }
  for (const url of ['https://x.com/home', 'https://juejin.cn/', 'https://creator.xiaohongshu.com/', 'https://syncblog.2aran.com/', 'https://2aran.com.evil.test', 'invalid']) assert.equal(r.listener()({ type: 'ADM_OPEN' }, { id: 'test', tab: { id: 9, url } }, () => {}), false)
  assert.deepEqual(opened, [9, 9])
})

test('remote stop lets the current platform finish and prevents subsequent targets', async () => {
  const r = await runtime()
  let unblock
  r.block(new Promise((resolve) => { unblock = resolve }))
  const { jobId } = await r.context.handle({ type: 'ADM_RUN', draft, platformIds: ['csdn', 'segmentfault'] })
  await sleep()
  await r.context.stopBatches(jobId)
  unblock(); await complete(r)
  assert.equal(r.calls.length, 1)
  assert.deepEqual(r.saved[key].jobs[0].targets.map(t => t.status), ['prepared', 'stopped'])
})

test('monitor snapshot excludes local content, model keys and page URLs', async () => {
  const r = await runtime()
  r.chrome.runtime.getManifest = () => ({ version: '2.2.0' })
  await r.context.handle({ type: 'ADM_SAVE_SETTINGS', settings: { endpoint: 'https://api.example.com/v1/chat/completions', model: 'model-name', apiKey: 'private-model-key' } })
  await r.context.handle({ type: 'ADM_RUN', draft: { title: 'private-title', content: 'private-body', url: 'https://private-source.example.com', contentType: 'article' }, platformIds: ['csdn'] })
  await complete(r)
  const snapshot = await r.context.monitorSnapshot()
  const serialized = JSON.stringify(snapshot)
  for (const secret of ['private-title', 'private-body', 'private-model-key', 'private-source.example.com', 'api.example.com']) assert.ok(!serialized.includes(secret))
  assert.equal(snapshot.snapshot.batches[0].targets[0].status, 'prepared')
  assert.equal(snapshot.events[0].kind, 'distribution')
})
