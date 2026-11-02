/* eslint test/no-import-node-test: off */
import assert from 'node:assert/strict'
import test from 'node:test'
import { compareVersions, createUpdater, SETTLE_MS, UPDATE_ALARM, UPDATE_KEY } from '../master/updater.js'

function fixture() {
  const data = {}
  let version = '2.0.3'
  let installed = '2.0.3'
  let time = 100000
  let busy = false
  let fail = false
  let reloads = 0
  let listener
  const scheduled = []
  let onSave = () => {}
  const chromeApi = {
    storage: { local: { get: async key => ({ [key]: data[key] }), set: async (values) => { Object.assign(data, values); onSave(values[UPDATE_KEY]) } } },
    runtime: { getManifest: () => ({ version: installed }), getURL: path => `chrome-extension://test/${path}` },
    alarms: { create: (name, options) => { assert.equal(name, UPDATE_ALARM); assert.equal(options.periodInMinutes, 2) }, onAlarm: { addListener: (fn) => { listener = fn } } },
  }
  const updater = createUpdater({ chromeApi, isBusy: () => busy, now: () => time, scheduleReload: fn => scheduled.push(fn), reload: () => { reloads++ }, fetchApi: async (url, options) => {
    assert.match(url, /^chrome-extension:\/\/test\/manifest.json\?admCheck=/)
    assert.equal(options.cache, 'no-store')
    if (fail)
      throw new Error('打包尚未完成')
    return { ok: true, json: async () => ({ version }) }
  } })
  return { updater, data, scheduled, onSave: (fn) => { onSave = fn }, version: (value) => { version = value }, installed: (value) => { installed = value }, time: (value) => { time = value }, busy: (value) => { busy = value }, fail: (value) => { fail = value }, reloads: () => reloads, alarm: () => listener }
}
test('numeric versions reject malformed inputs and do not downgrade', () => {
  assert.equal(compareVersions('2.0.10', '2.0.9'), 1)
  assert.equal(compareVersions('2.0.3', '3.0.0'), -1)
  assert.equal(compareVersions('invalid', '2.0.3'), 0)
})
test('new local version must remain stable before automatic reload', async () => {
  const f = fixture()
  f.version('2.0.4')
  assert.equal((await f.updater.check()).phase, 'available')
  assert.equal(f.scheduled.length, 0)
  f.time(100000 + SETTLE_MS)
  assert.equal((await f.updater.check()).phase, 'applying')
  assert.equal(f.scheduled.length, 1)
  f.scheduled[0]()
  assert.equal(f.reloads(), 1)
  await f.updater.check(true)
  assert.equal(f.scheduled.length, 1)
})
test('manual click applies immediately when idle and queues while busy', async () => {
  const f = fixture()
  f.version('2.0.4')
  f.busy(true)
  assert.equal((await f.updater.check(true)).phase, 'waiting')
  assert.equal(f.scheduled.length, 0)
  f.busy(false)
  assert.equal((await f.updater.check()).phase, 'applying')
  const idle = fixture()
  idle.version('2.0.4')
  assert.equal((await idle.updater.check(true)).phase, 'applying')
})
test('newer candidate resets stability interval; old and invalid versions never reload', async () => {
  const f = fixture()
  f.version('2.0.4')
  await f.updater.check()
  f.time(200000)
  f.version('2.0.5')
  assert.equal((await f.updater.check()).phase, 'available')
  assert.equal(f.scheduled.length, 0)
  f.version('2.0.1')
  assert.equal((await f.updater.check(true)).phase, 'latest')
  f.version('broken')
  assert.equal((await f.updater.check(true)).phase, 'failed')
  assert.equal(f.scheduled.length, 0)
})
test('failed read is visible, retry works, successful reload is recognized', async () => {
  const f = fixture()
  f.fail(true)
  assert.equal((await f.updater.check()).phase, 'failed')
  f.fail(false)
  assert.equal((await f.updater.check()).phase, 'latest')
  f.data[UPDATE_KEY] = { phase: 'applying', version: '2.0.4' }
  f.installed('2.0.4')
  f.version('2.0.4')
  assert.equal((await f.updater.check()).phase, 'updated')
})
test('install registers periodic checks without creating overlapping reloads', async () => {
  const f = fixture()
  f.updater.install()
  assert.equal(typeof f.alarm(), 'function')
  await f.updater.check()
  f.version('2.0.4')
  await Promise.all([f.updater.check(true), f.updater.check(true)])
  assert.equal(f.scheduled.length, 1)
})

test('a task starting during status persistence prevents reload', async () => {
  const f = fixture()
  f.version('2.0.4')
  f.onSave((value) => {
    if (value?.phase === 'applying')
      f.busy(true)
  })
  assert.equal((await f.updater.check(true)).phase, 'waiting')
  assert.equal(f.scheduled.length, 0)
})
