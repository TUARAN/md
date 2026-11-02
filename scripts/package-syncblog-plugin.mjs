import { execFileSync } from 'node:child_process'
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { ENTRY_MATCHES, PLATFORMS, SITE_URL } from '../apps/distribution-extension/master/core.js'

const root = path.resolve(import.meta.dirname, '..')
const vendorDir = path.join(root, 'apps/web/vendor/syncblog-plugin')
const sourceDir = path.join(root, 'apps/distribution-extension')
const buildDir = path.join(sourceDir, 'dist/syncblog-plugin')
const publicDir = path.join(root, 'apps/web/public')
const releaseDir = path.join(root, 'output/distribution-extension')
const brand = JSON.parse(await readFile(path.join(sourceDir, 'extension.json'), 'utf8'))
const manifest = JSON.parse(await readFile(path.join(vendorDir, 'manifest.json'), 'utf8'))
const siteMatch = `${SITE_URL}/*`
const platformMatches = PLATFORMS.flatMap(p => p.hosts.map(host => `https://*.${host}/*`))
const contentMatches = [...new Set([siteMatch, 'https://syncblog.cn/*', 'http://localhost/*', 'http://127.0.0.1/*', ...platformMatches])]

// Keep vendor artifacts intact. Each patch must match exactly once so upstream
// changes cannot silently remove message isolation or the new-domain bridge.
export function patchUnique(source, original, replacement, label) {
  if (source.split(original).length !== 2) throw new Error(`Vendor compatibility changed: ${label}. Review the adapter before packaging.`)
  return source.replace(original, replacement)
}
await rm(path.join(sourceDir, 'dist'), { recursive: true, force: true })
await mkdir(buildDir, { recursive: true })
await cp(vendorDir, buildDir, { recursive: true })
await cp(path.join(sourceDir, 'master'), path.join(buildDir, 'master'), { recursive: true })
await cp(path.join(sourceDir, 'icons'), path.join(buildDir, 'icons'), { recursive: true })
manifest.icons = { 16: 'icons/miner-distribution-16.png', 48: 'icons/miner-distribution-48.png', 128: 'icons/miner-distribution-128.png' }
await cp(path.join(sourceDir, 'panel.html'), path.join(buildDir, 'panel.html'))
await cp(path.join(sourceDir, 'docs.html'), path.join(buildDir, 'docs.html'))
await cp(path.join(sourceDir, 'README.md'), path.join(buildDir, 'README.md'))
await writeFile(path.join(buildDir, 'README.txt'), `AI 分发大师 v${brand.version}\n\n创作台：${SITE_URL}/\n安装与能力范围请阅读 README.md。\n新工作台仅自动填写可检查空白并回读的编辑器，其余入口需手动完成。\n`)

let background = await readFile(path.join(buildDir, 'bundles/background.js'), 'utf8')
background = patchUnique(background,
  'chrome.runtime.onMessage.addListener((e,t,o)=>e.type&&e.type.startsWith("OFFSCREEN_")',
  'chrome.runtime.onMessage.addListener((e,t,o)=>e.type?.startsWith("ADM_")?!1:e.type&&e.type.startsWith("OFFSCREEN_")',
  'AI distribution message isolation')
await writeFile(path.join(buildDir, 'bundles/background.js'), background)
let content = await readFile(path.join(buildDir, 'bundles/content.js'), 'utf8')
content = patchUnique(content, '["md.doocs.org","syncblog.cn","localhost","127.0.0.1"]', '["md.doocs.org","syncblog.cn","syncblog.2aran.com","localhost","127.0.0.1"]', 'new-domain page bridge')
await writeFile(path.join(buildDir, 'bundles/content.js'), content)
// An inherited COSE welcome popup is no longer used by this edition.
await rm(path.join(buildDir, 'popup.html'), { force: true })
await rm(path.join(buildDir, 'bundles/popup.js'), { force: true })
Object.assign(manifest, brand, {
  minimum_chrome_version: '116',
  permissions: [...new Set([...manifest.permissions, 'sidePanel', 'alarms'])],
  host_permissions: [...new Set([...manifest.host_permissions.filter(p => p !== 'http://localhost:*/*'), siteMatch, ...ENTRY_MATCHES, 'https://aihot.news/*', 'http://127.0.0.1/*', ...platformMatches])],
  optional_host_permissions: ['https://*/*'],
  action: { default_title: 'AI 分发大师 · 打开分发工作台', default_icon: manifest.icons },
  background: { service_worker: 'master/background.js', type: 'module' },
  side_panel: { default_path: 'panel.html' },
  content_scripts: [
    { ...manifest.content_scripts[0], matches: [...new Set([...manifest.content_scripts[0].matches, siteMatch, 'http://127.0.0.1/*'])] },
    { matches: ENTRY_MATCHES, js: ['master/content.js'], run_at: 'document_idle' },
  ],
  web_accessible_resources: [
    ...manifest.web_accessible_resources.map(entry => ({ ...entry, matches: [...new Set([...entry.matches, siteMatch, 'http://127.0.0.1/*'])] })),
    { resources: ['master/core.js'], matches: [...new Set([...contentMatches, ...ENTRY_MATCHES])] },
  ],
})
await writeFile(path.join(buildDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
await mkdir(publicDir, { recursive: true })
for (const name of await readdir(publicDir)) {
  if (/^(?:csync-extension.*|syncblog-plugin.*|ai-distribution-master.*)\.zip$/.test(name)) await rm(path.join(publicDir, name), { force: true })
}
await mkdir(releaseDir, { recursive: true })
const primary = path.join(releaseDir, 'ai-distribution-master.zip')
// A seekable writer produces sized local headers, matching the shared Edge
// credential injector used by X and AI distributor downloads (no descriptors).
execFileSync('python3', ['-c', `import pathlib,sys,zipfile
source=pathlib.Path(sys.argv[1])
with zipfile.ZipFile(sys.argv[2], 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
 for file in sorted(source.rglob('*')):
  if file.is_file(): archive.write(file, file.relative_to(source).as_posix())
`, buildDir, primary])
for (const name of [`ai-distribution-master-v${brand.version}.zip`, 'syncblog-plugin.zip', `syncblog-plugin-v${brand.version}.zip`]) await cp(primary, path.join(releaseDir, name))
console.log(`Built ${brand.name} v${brand.version}`)
console.log(`Load unpacked: ${path.relative(root, buildDir)}`)
console.log(`Release: ${path.relative(root, primary)} · deliver through 2aran.com VIP download only`)
