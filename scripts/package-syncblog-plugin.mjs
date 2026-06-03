import { createWriteStream } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
import path from 'node:path'

const require = createRequire(import.meta.url)
const { ZipArchive } = require(`archiver`)

const root = path.resolve(import.meta.dirname, `..`)
const sourceDir = path.join(root, `apps/web/vendor/syncblog-plugin`)
const outputs = [
  path.join(root, `apps/web/public/syncblog-plugin.zip`),
  path.join(root, `apps/web/public/syncblog-plugin-v1.0.4.zip`),
  path.join(root, `apps/web/public/csync-extension.zip`),
  path.join(root, `apps/web/public/csync-extension-v1.0.4.zip`),
  path.join(root, `apps/web/dist/syncblog-plugin.zip`),
  path.join(root, `apps/web/dist/syncblog-plugin-v1.0.4.zip`),
  path.join(root, `apps/web/dist/csync-extension.zip`),
  path.join(root, `apps/web/dist/csync-extension-v1.0.4.zip`),
]

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

for (const output of outputs) {
  await zipExtension(output)
  console.log(`wrote ${path.relative(root, output)}`)
}
