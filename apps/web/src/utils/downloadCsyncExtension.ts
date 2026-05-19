import { toast } from '@/utils/toast'

const MIN_ZIP_BYTES = 50_000

/** GitHub 主分支上的备用下载（线上静态资源异常时） */
export const CSYNC_EXTENSION_GITHUB_ZIP
  = `https://raw.githubusercontent.com/TUARAN/md/main/apps/web/public/csync-extension.zip`

export function getCsyncExtensionZipUrl() {
  return `${import.meta.env.BASE_URL}csync-extension.zip`
}

function isZipBuffer(buffer: ArrayBuffer) {
  if (buffer.byteLength < MIN_ZIP_BYTES)
    return false
  const bytes = new Uint8Array(buffer.slice(0, 2))
  return bytes[0] === 0x50 && bytes[1] === 0x4B
}

async function fetchZip(url: string) {
  const response = await fetch(url, { cache: `no-store` })
  if (!response.ok)
    throw new Error(`HTTP ${response.status}`)
  const buffer = await response.arrayBuffer()
  if (!isZipBuffer(buffer))
    throw new Error(`not-a-zip`)
  return buffer
}

function triggerBlobDownload(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], { type: `application/zip` })
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement(`a`)
  anchor.href = objectUrl
  anchor.download = filename
  anchor.rel = `noopener`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 2000)
}

/**
 * 以二进制方式下载 CSYNC 扩展，避免浏览器把 SPA 的 index.html 当成 zip 保存。
 */
export async function downloadCsyncExtensionZip() {
  const primary = getCsyncExtensionZipUrl()
  const candidates = [primary, CSYNC_EXTENSION_GITHUB_ZIP]

  for (const url of candidates) {
    try {
      const buffer = await fetchZip(url)
      triggerBlobDownload(buffer, `csync-extension.zip`)
      toast.success(`CSYNC 扩展已开始下载（${Math.round(buffer.byteLength / 1024)} KB）`)
      return
    }
    catch (error) {
      console.warn(`[CSYNC] download failed for ${url}`, error)
    }
  }

  toast.error(
    `下载失败：服务器返回的不是有效 zip（常见原因是线上尚未部署静态包）。请改用仓库目录 apps/web/vendor/csync-extension 在 Chrome 中「加载已解压的扩展程序」。`,
    { duration: 8000 },
  )
}
