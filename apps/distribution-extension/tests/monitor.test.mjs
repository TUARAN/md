import assert from 'node:assert/strict'
import test from 'node:test'
import { createMonitor } from '../master/monitor.js'

function runtime({ enabled = true, state, replies = [] } = {}) {
  const storage = { admMonitorConfig: { enabled, secret: 'owner-secret', deviceId: 'device-test-1234' }, ...(state ? { admMonitorState: state } : {}) }
  const requests = []; const executed = []
  let version = '2.2.0'; let fail = false
  const api = { storage: { local: { get: async key => ({ [key]: structuredClone(storage[key]) }), set: async data => Object.assign(storage, structuredClone(data)) } }, runtime: { getManifest: () => ({ version }) } }
  const monitor = createMonitor({ chromeApi: api, now: () => 1000000, getSnapshot: async () => ({ snapshot: { phase: 'idle', batches: [], tools: {} }, events: [] }), executeCommand: async command => executed.push(command.id), fetchApi: async (url, options) => {
    requests.push({ url, body: JSON.parse(options.body), headers: options.headers }); if (fail)
      throw new Error('key must never leak'); return { ok: true, json: async () => replies.shift() || { ok: true, commands: [], acknowledged: [] } }
  } })
  return { monitor, storage, requests, executed, setVersion: (value) => { version = value }, fail: () => { fail = true } }
}
const command = (name, id = 'command-12345678') => ({ id, command: name, argument: '', expiresAt: 1100000 })
test('monitor is opt-in and status never returns secret', async () => {
  const r = runtime({ enabled: false })
  await r.monitor.sync(); assert.equal(r.requests.length, 0)
  assert.equal((await r.monitor.status()).enabled, false)
  assert.ok(!JSON.stringify(await r.monitor.status()).includes('owner-secret'))
})
test('durable command execution deduplicates replay and retains results until server acknowledges', async () => {
  const c = command('stop-all')
  const r = runtime({ replies: [{ ok: true, commands: [c] }, { ok: true, commands: [c] }, { ok: true, acknowledged: [c.id] }] })
  await r.monitor.sync(); await r.monitor.sync()
  assert.deepEqual(r.executed, [c.id]); assert.equal(r.requests[1].body.results[0].result, 'stopped')
  assert.equal(r.storage.admMonitorState.commands.length, 1)
  await r.monitor.sync(); assert.equal(r.storage.admMonitorState.commands.length, 0)
})
test('expired or unsupported commands never execute', async () => {
  const r = runtime({ replies: [{ ok: true, commands: [{ ...command('stop-all'), expiresAt: 1 }, command('publish', 'command-other-123')] }] })
  await r.monitor.sync(); assert.equal(r.executed.length, 0)
  assert.ok(r.storage.admMonitorState.commands.every(c => c.status === 'failed'))
})
test('update remains executing until the loaded version reaches its target', async () => {
  const c = { ...command('ext-update'), argument: '2.2.1' }
  const r = runtime({ replies: [{ ok: true, commands: [c] }] })
  await r.monitor.sync(); await r.monitor.sync()
  assert.equal(r.requests[1].body.results.length, 0)
  r.setVersion('2.2.1'); await r.monitor.sync()
  assert.equal(r.requests[2].body.results[0].result, 'loaded')
})
test('interrupted stop does not replay after restart, and failures keep the outbox', async () => {
  const r = runtime({ state: { seen: ['command-12345678'], commands: [{ ...command('stop-all'), status: 'executing' }] } })
  await r.monitor.sync(); assert.equal(r.executed.length, 0)
  assert.equal(r.requests[0].body.results[0].result, 'interrupted')
  r.fail(); await r.monitor.sync()
  assert.equal(r.storage.admMonitorState.commands.length, 1)
  assert.equal((await r.monitor.status()).error, 'NETWORK_OR_REPORT_FAILED')
})

test('downloaded package imports its bundled credential automatically, while explicit opt-out is preserved', async () => {
  for (const disabled of [false, true]) {
    const values = disabled ? { admMonitorConfig: { enabled: false } } : {}
    let reads = 0
    const monitor = createMonitor({ chromeApi: { storage: { local: { get: async key => ({ [key]: values[key] }), set: async next => Object.assign(values, next) } }, runtime: { getManifest: () => ({ version: '2.2.1' }), getURL: name => `chrome-extension://test/${name}` } }, getSnapshot: async () => ({}), executeCommand: async () => {}, fetchApi: async (url) => {
      assert.equal(url, 'chrome-extension://test/community-secret.local'); reads++
      return { ok: true, json: async () => ({ secret: 'test-person-code-only' }) }
    } })
    await monitor.loadBundledCredential()
    assert.equal(reads, disabled ? 0 : 1)
    assert.equal((await monitor.status()).enabled, !disabled)
    if (!disabled)
      assert.equal(values.admMonitorConfig.secret, 'test-person-code-only')
    assert.ok(!JSON.stringify(await monitor.status()).includes('test-person-code-only'))
  }
})
