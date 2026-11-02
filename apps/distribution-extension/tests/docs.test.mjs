import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('packaged documentation includes every linked section and matches installed version', async () => {
  const root = new URL('../dist/syncblog-plugin/', import.meta.url)
  const html = await readFile(new URL('docs.html', root), 'utf8')
  const panel = await readFile(new URL('panel.html', root), 'utf8')
  const manifest = JSON.parse(await readFile(new URL('manifest.json', root), 'utf8'))
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]))
  assert.match(panel, /aria-label="打开文档中心"/)
  for (const match of panel.matchAll(/href="docs.html#([^"]+)"/g)) assert.ok(ids.has(match[1]), match[1])
  assert.ok(html.includes(`v${manifest.version}`))
  assert.match(html, /<nav aria-label="文档目录">/)
  for (const name of ['master/docs.css', 'master/docs.js']) assert.ok((await readFile(new URL(name, root))).length > 0)
  execFileSync(process.execPath, ['--check', new URL('master/docs.js', root).pathname])
})
test('injected note manager help opens the bundled rules using a restricted message', async () => {
  const source = await readFile(new URL('../master/xhs-manager.js', import.meta.url), 'utf8')
  const background = await readFile(new URL('../master/platform-tools.js', import.meta.url), 'utf8')
  assert.match(source, /type: ['"]ADM_TOOL_OPEN_DOCS['"]/)
  assert.match(background, /getURL\('docs.html#xiaohongshu-manager'\)/)
  assert.match(background, /managerRoute\(sender.url \|\| sender.tab.url\)/)
})
