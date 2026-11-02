/* eslint test/no-import-node-test: off */
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { access, readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const brand = JSON.parse(await readFile(new URL('../extension.json', import.meta.url), 'utf8'))
const directory = fileURLToPath(new URL('../dist/syncblog-plugin/', import.meta.url))
const read = name => readFile(path.join(directory, name), 'utf8')
test('packaged Manifest wires sidepanel, new domain and all declared files', async () => {
  const manifest = JSON.parse(await read('manifest.json'))
  assert.equal(manifest.name, 'AI 分发大师')
  assert.ok(manifest.permissions.includes('alarms'))
  await access(path.join(directory, 'master/updater.js'))
  assert.equal(manifest.version, brand.version)
  assert.ok(manifest.host_permissions.includes('https://2aran.com/*'))
  assert.ok(manifest.host_permissions.includes('https://aihot.news/*'))
  assert.equal(manifest.minimum_chrome_version, '116')
  assert.equal(manifest.side_panel.default_path, 'panel.html')
  assert.equal(manifest.action.default_popup, undefined)
  assert.ok(manifest.host_permissions.includes('https://syncblog.2aran.com/*'))
  assert.ok(!manifest.host_permissions.includes('http://localhost:*/*'))
  for (const entry of manifest.content_scripts) {
    if (entry.js.includes('master/content.js')) {
      assert.deepEqual(entry.matches, ['https://2aran.com/*', 'https://www.2aran.com/*', 'https://admin.2aran.com/*'])
    }
    else {
      assert.ok(entry.matches.includes('https://syncblog.2aran.com/*'))
    }
    for (const name of entry.js) await access(path.join(directory, name))
  }
  const bridge = manifest.web_accessible_resources.find(e => e.resources.includes('bundles/inject.js'))
  assert.ok(bridge.matches.includes('https://syncblog.2aran.com/*'))
  for (const name of [manifest.background.service_worker, 'panel.html', 'master/panel.js', 'master/panel.css', 'master/core.js', 'master/editors.js']) await access(path.join(directory, name))
  assert.match(await read('bundles/content.js'), /"syncblog\.2aran\.com"/)
  assert.match(await read('bundles/background.js'), /startsWith\("ADM_"\)\?!1:/)
  assert.ok(!(await read('master/background.js')).includes('handleLegacyMessage'))
  for (const name of ['master/background.js', 'master/content.js', 'master/core.js', 'master/editors.js', 'master/panel.js', 'master/updater.js', 'bundles/background.js']) execFileSync(process.execPath, ['--check', path.join(directory, name)])
})
test('published new and legacy archives are the identical edition', async () => {
  const base = new URL('../../../output/distribution-extension/', import.meta.url)
  // tests/ -> distribution-extension/ -> apps/ -> web/public/
  const primary = await readFile(new URL('ai-distribution-master.zip', base))
  assert.ok(primary.length > 10000)
  for (const name of ['syncblog-plugin.zip', `syncblog-plugin-v${brand.version}.zip`, `ai-distribution-master-v${brand.version}.zip`]) assert.deepEqual(await readFile(new URL(name, base)), primary)
})
