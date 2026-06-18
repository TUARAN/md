import { createWriteStream } from 'node:fs'
import { mkdir, readFile, readdir, rm } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'

const require = createRequire(import.meta.url)
const { ZipArchive } = require(`archiver`)

const root = path.resolve(import.meta.dirname, `..`)
const sourceDir = path.join(root, `apps/web/vendor/syncblog-plugin`)
const manifest = JSON.parse(await readFile(path.join(sourceDir, `manifest.json`), `utf8`))
const version = String(manifest.version)
const outputs = [
  path.join(root, `apps/web/public/syncblog-plugin.zip`),
  path.join(root, `apps/web/public/syncblog-plugin-v${version}.zip`),
  path.join(root, `apps/web/dist/syncblog-plugin.zip`),
  path.join(root, `apps/web/dist/syncblog-plugin-v${version}.zip`),
]

async function removeStaleArchives(directory) {
  const currentVersionName = `syncblog-plugin-v${version}.zip`
  const entries = await readdir(directory).catch(() => [])
  await Promise.all(entries
    .filter(name => (
      name.startsWith(`csync-extension`)
      || (name.startsWith(`syncblog-plugin-v`) && name !== currentVersionName)
    ) && name.endsWith(`.zip`))
    .map(name => rm(path.join(directory, name), { force: true })))
}

async function zipExtension(outputPath) {
  await mkdir(path.dirname(outputPath), { recursive: true })

  await new Promise((resolve, reject) => {
    const output = createWriteStream(outputPath)
    const archive = new ZipArchive({ zlib: { level: 9 } })

    output.on(`close`, resolve)
    archive.on(`error`, reject)
    archive.pipe(output)
    archive.directory(sourceDir, `syncblog-plugin`)
    archive.finalize()
  })
}

await removeStaleArchives(path.join(root, `apps/web/public`))
await removeStaleArchives(path.join(root, `apps/web/dist`))

for (const output of outputs) {
  await zipExtension(output)
  console.log(`wrote ${path.relative(root, output)}`)
}
