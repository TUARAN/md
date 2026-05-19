#!/usr/bin/env node
/**
 * 将 apps/web/vendor/csync-extension 打成 zip，供用户下载后在 Chrome 中「加载已解压的扩展程序」
 * （或解压后选该文件夹）。产物写入 apps/web/public/，随 Vite build 进入站点静态资源。
 *
 * 使用系统 zip 命令，确保 macOS「归档实用工具」可正常解压。
 */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, `..`)
const sourceDir = path.join(rootDir, `apps`, `web`, `vendor`, `csync-extension`)
const publicDir = path.join(rootDir, `apps`, `web`, `public`)

function createZipWithSystemZip(sourceDirPath, outputPath) {
  const parentDir = path.dirname(sourceDirPath)
  const folderName = path.basename(sourceDirPath)
  const outputAbs = path.resolve(outputPath)

  if (fs.existsSync(outputAbs))
    fs.unlinkSync(outputAbs)

  const result = spawnSync(
    `zip`,
    [`-r`, outputAbs, folderName, `-x`, `*/.DS_Store`, `*__MACOSX*`],
    { cwd: parentDir, stdio: `pipe`, encoding: `utf8` },
  )

  if (result.status !== 0) {
    console.error(result.stderr || result.stdout)
    throw new Error(`zip 命令失败 (exit ${result.status})，请确认已安装 zip 工具`)
  }
}

function verifyZip(outputPath) {
  const result = spawnSync(`unzip`, [`-t`, outputPath], { encoding: `utf8` })
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout)
    throw new Error(`打包后的 zip 校验失败`)
  }
}

async function main() {
  const manifestPath = path.join(sourceDir, `manifest.json`)
  if (!fs.existsSync(manifestPath)) {
    console.error(`缺少扩展目录: ${sourceDir}`)
    process.exit(1)
  }

  const manifest = JSON.parse(await readFile(manifestPath, `utf8`))
  const ver = String(manifest.version ?? `0.0.0`)

  await mkdir(publicDir, { recursive: true })

  const outName = `csync-extension-v${ver}.zip`
  const outPath = path.join(publicDir, outName)
  const outLatest = path.join(publicDir, `csync-extension.zip`)

  createZipWithSystemZip(sourceDir, outPath)
  verifyZip(outPath)
  fs.copyFileSync(outPath, outLatest)

  const sizeKb = (fs.statSync(outPath).size / 1024).toFixed(1)
  console.log(`> CSYNC 扩展已打包: ${path.relative(rootDir, outPath)} (${sizeKb} KB)`)
  console.log(`> 同时写入: ${path.relative(rootDir, outLatest)}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
