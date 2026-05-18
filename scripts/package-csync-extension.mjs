#!/usr/bin/env node
/**
 * 将 apps/web/vendor/csync-extension 打成 zip，供用户下载后在 Chrome 中「加载已解压的扩展程序」
 * （或解压后选该文件夹）。产物写入 apps/web/public/，随 Vite build 进入站点静态资源。
 */
import fs from 'node:fs'
import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import archiver from 'archiver'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, `..`)
const sourceDir = path.join(rootDir, `apps`, `web`, `vendor`, `csync-extension`)
const publicDir = path.join(rootDir, `apps`, `web`, `public`)

async function main() {
  const manifestPath = path.join(sourceDir, `manifest.json`)
  if (!fs.existsSync(manifestPath)) {
    console.error(`缺少扩展目录: ${sourceDir}`)
    process.exit(1)
  }

  const manifest = JSON.parse(await readFile(manifestPath, `utf8`))
  const ver = String(manifest.version ?? `0.0.0`)
  const folderName = `csync-extension`

  await mkdir(publicDir, { recursive: true })

  const outName = `csync-extension-v${ver}.zip`
  const outPath = path.join(publicDir, outName)
  const outLatest = path.join(publicDir, `csync-extension.zip`)

  await new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outPath)
    const archive = archiver(`zip`, { zlib: { level: 9 } })

    output.on(`close`, resolve)
    archive.on(`error`, reject)
    archive.on(`warning`, (err) => {
      if (err.code === `ENOENT`)
        console.warn(err)
      else
        throw err
    })

    archive.pipe(output)
    archive.directory(sourceDir, folderName)
    archive.finalize()
  })

  fs.copyFileSync(outPath, outLatest)

  const sizeKb = (fs.statSync(outPath).size / 1024).toFixed(1)
  console.log(`> csync 扩展已打包: ${path.relative(rootDir, outPath)} (${sizeKb} KB)`)
  console.log(`> 同时写入: ${path.relative(rootDir, outLatest)}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
