<script setup lang="ts">
import {
  Download,
  Eye,
  Loader2,
  Network,
  Play,
  RotateCw,
  Save,
  Trash2,
} from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

const MASKED_91HTTP_API_URL = `http://api.91http.com/v1/get-ip?trade_no=B807601331374&secret=********&num=1&protocol=1&format=text&sep=1&filter=1`

interface VisitPreview {
  status?: number | string
  timeTotal?: number
  preview?: string
  effectiveUrl?: string
  error?: string
}

interface IpResult {
  ok?: boolean
  ip?: string
  proxy?: string
  note?: string
}

interface VisitResult {
  ok?: boolean
  ip?: IpResult
  visit?: VisitPreview
  proxy?: string
  error?: string
}

interface ExtractVisitAttempt {
  index: number
  ok: boolean
  proxy?: string
  ip?: IpResult
  visit?: VisitPreview
  error?: string
}

interface ExtractVisitResult extends VisitResult {
  attempts?: ExtractVisitAttempt[]
}

interface LogItem {
  time: Date
  ok: boolean
  proxy: string
  detail: string
}

const targetUrl = ref(``)
const proxyList = ref(``)
const currentIp = ref(`未检测`)
const currentMode = ref(`直连`)
const lastStatus = ref(`等待中`)
const activeProxy = ref(`未使用代理`)
const preview = ref(`访问后的页面预览会显示在这里。`)
const busy = ref(false)
const logs = ref<LogItem[]>([])
const proxyIndex = ref(-1)
const proxyTextarea = ref<HTMLTextAreaElement | null>(null)

const http91TradeNo = ref(``)
const http91Secret = ref(``)
const http91Num = ref(`5`)
const extractVisitCount = ref(`5`)
const http91Protocol = ref<`http` | `socks5`>(`http`)
const http91Province = ref(``)
const http91City = ref(``)
const http91Tunnel = ref(``)

const queueState = computed(() => `${logs.value.length} 条`)

function readSaved91Http() {
  try {
    return JSON.parse(localStorage.getItem(`muti-ip:91http`) || `{}`) as Record<string, string>
  }
  catch {
    return {}
  }
}

function loadSaved() {
  proxyList.value = localStorage.getItem(`muti-ip:proxies`) || ``
  targetUrl.value = localStorage.getItem(`muti-ip:last-url`) || ``

  const config = readSaved91Http()
  http91TradeNo.value = config.tradeNo || ``
  http91Secret.value = config.secret || ``
  http91Num.value = config.num || `5`
  extractVisitCount.value = config.extractVisitCount || `5`
  http91Protocol.value = config.protocol === `socks5` ? `socks5` : `http`
  http91Province.value = config.province || ``
  http91City.value = config.city || ``
  http91Tunnel.value = config.tunnel || ``
}

function proxies() {
  return proxyList.value
    .split(/\r?\n/)
    .map(item => item.trim())
    .filter(Boolean)
}

function nextProxy() {
  const list = proxies()
  if (!list.length)
    throw new Error(`代理池为空，请先输入至少一个代理`)
  proxyIndex.value = (proxyIndex.value + 1) % list.length
  return list[proxyIndex.value]
}

function selectedProxy() {
  const textarea = proxyTextarea.value
  if (!textarea)
    return proxies()[0] || ``

  const start = textarea.selectionStart
  const value = proxyList.value
  const lineStart = value.lastIndexOf(`\n`, start - 1) + 1
  const lineEnd = value.indexOf(`\n`, start)
  const line = value.slice(lineStart, lineEnd === -1 ? value.length : lineEnd).trim()
  return line || proxies()[0] || ``
}

function current91HttpConfig() {
  return {
    tradeNo: http91TradeNo.value.trim(),
    secret: http91Secret.value.trim(),
    num: http91Num.value.trim() || `1`,
    extractVisitCount: extractVisitCount.value.trim() || `5`,
    protocol: http91Protocol.value === `socks5` ? `2` : `1`,
    province: http91Province.value.trim(),
    city: http91City.value.trim(),
    tunnel: http91Tunnel.value.trim(),
  }
}

function save91HttpConfig() {
  localStorage.setItem(`muti-ip:91http`, JSON.stringify({
    ...current91HttpConfig(),
    protocol: http91Protocol.value,
  }))
}

function addLog(item: Omit<LogItem, 'time'>) {
  logs.value = [{ time: new Date(), ...item }, ...logs.value].slice(0, 80)
}

function updateIpView(result: IpResult, mode: string) {
  currentIp.value = result.ip || `检测失败`
  currentMode.value = mode
  activeProxy.value = result.proxy || `未使用代理`
}

async function postJson<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(path, {
    method: `POST`,
    headers: { 'content-type': `application/json` },
    body: JSON.stringify(payload),
  })
  const data = await response.json() as T & { ok?: boolean, error?: string, visit?: VisitPreview }
  if (!response.ok || data.ok === false)
    throw new Error(data.error || data.visit?.error || `请求失败`)
  return data
}

async function postJsonResult<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(path, {
    method: `POST`,
    headers: { 'content-type': `application/json` },
    body: JSON.stringify(payload),
  })
  const data = await response.json() as T & { error?: string }
  if (!response.ok)
    throw new Error(data.error || `请求失败`)
  return data
}

function appendProxies(newProxies: string[]) {
  const merged = [...new Set([...proxies(), ...newProxies])]
  proxyList.value = merged.join(`\n`)
  localStorage.setItem(`muti-ip:proxies`, proxyList.value)
  return merged
}

async function detect(proxy = ``) {
  busy.value = true
  try {
    const result = await postJson<IpResult>(`/api/ip`, { proxy })
    updateIpView(result, proxy ? `代理` : `直连`)
    addLog({ ok: true, proxy, detail: `出口 IP ${result.ip || `未知`}${result.note ? ` | ${result.note}` : ``}` })
    return result
  }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    currentIp.value = `检测失败`
    addLog({ ok: false, proxy, detail: message })
    throw error
  }
  finally {
    busy.value = false
  }
}

async function visitWithProxy(proxy = ``, options: { throwOnError?: boolean } = {}) {
  const url = targetUrl.value.trim()
  if (!url)
    return false

  localStorage.setItem(`muti-ip:last-url`, url)
  busy.value = true
  try {
    const result = await postJsonResult<VisitResult>(`/api/visit`, { url, proxy })
    if (result.ok === false)
      throw new Error(result.visit?.error || result.error || `代理访问失败`)

    updateIpView({ ...result.ip, proxy }, proxy ? `代理` : `直连`)
    lastStatus.value = `${result.visit?.status || `未知`} ${Number(result.visit?.timeTotal || 0).toFixed(2)}s`
    preview.value = result.visit?.preview || `访问成功，但没有可预览的文本内容。`
    activeProxy.value = proxy || `未使用代理`
    addLog({
      ok: true,
      proxy,
      detail: `IP ${result.ip?.ip || `未知`} | HTTP ${result.visit?.status || `未知`} | ${result.visit?.effectiveUrl || url}`,
    })
    return true
  }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    lastStatus.value = `失败`
    preview.value = message
    addLog({ ok: false, proxy, detail: message })
    if (options.throwOnError)
      throw error
    return false
  }
  finally {
    busy.value = false
  }
}

async function autoRotateVisit() {
  const list = proxies()
  if (!list.length)
    return
  for (let index = 0; index < list.length; index += 1)
    await visitWithProxy(nextProxy())
}

async function extract91Http() {
  save91HttpConfig()
  busy.value = true
  try {
    const result = await postJson<{ proxies: string[] }>(`/api/91http/extract`, current91HttpConfig())
    const merged = appendProxies(result.proxies)
    addLog({
      ok: true,
      proxy: `91HTTP API`,
      detail: `提取 ${result.proxies.length} 个代理，代理池共 ${merged.length} 个`,
    })
  }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    preview.value = message
    addLog({ ok: false, proxy: `91HTTP API`, detail: message })
  }
  finally {
    busy.value = false
  }
}

async function extractAndVisit91Http() {
  const url = targetUrl.value.trim()
  if (!url)
    return

  localStorage.setItem(`muti-ip:last-url`, url)
  save91HttpConfig()
  busy.value = true
  try {
    const maxAttempts = Math.min(50, Math.max(1, Number(extractVisitCount.value) || 5))
    extractVisitCount.value = String(maxAttempts)
    addLog({ ok: true, proxy: `91HTTP API`, detail: `服务端提取并访问，最多尝试 ${maxAttempts} 个 IP` })
    const result = await postJsonResult<ExtractVisitResult>(`/api/91http/extract-visit`, {
      url,
      config: { ...current91HttpConfig(), num: `1` },
      maxAttempts,
    })

    for (const attempt of result.attempts || []) {
      addLog({
        ok: attempt.ok,
        proxy: attempt.proxy || `91HTTP API`,
        detail: attempt.ok
          ? `第 ${attempt.index} 次成功 | IP ${attempt.ip?.ip || `未知`} | HTTP ${attempt.visit?.status || `未知`}`
          : `第 ${attempt.index} 次失败 | ${attempt.visit?.error || attempt.error || `未知错误`}`,
      })
    }

    if (!result.ok)
      throw new Error(result.error || `已尝试 ${maxAttempts} 次仍失败`)

    if (result.proxy)
      appendProxies([result.proxy])
    updateIpView({ ...result.ip, proxy: result.proxy }, `代理`)
    lastStatus.value = `${result.visit?.status || `未知`} ${Number(result.visit?.timeTotal || 0).toFixed(2)}s`
    preview.value = result.visit?.preview || `访问成功，但没有可预览的文本内容。`
    activeProxy.value = result.proxy || `91HTTP API`
  }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    lastStatus.value = `失败`
    preview.value = message
    addLog({ ok: false, proxy: `91HTTP API`, detail: message })
  }
  finally {
    busy.value = false
  }
}

function saveProxies() {
  localStorage.setItem(`muti-ip:proxies`, proxyList.value)
  addLog({ ok: true, proxy: ``, detail: `代理池已保存到本机浏览器` })
}

function save91Http() {
  save91HttpConfig()
  addLog({ ok: true, proxy: `91HTTP`, detail: `91HTTP 配置已保存到本机浏览器` })
}

function downloadLogs() {
  if (!logs.value.length) {
    addLog({ ok: false, proxy: ``, detail: `当前没有可下载的日志` })
    return
  }

  const header = [`time`, `status`, `proxy`, `detail`]
  const rows = logs.value.map(log => [
    log.time.toISOString(),
    log.ok ? `success` : `failed`,
    log.proxy || ``,
    log.detail || ``,
  ])
  const csv = [header, ...rows]
    .map(row => row.map(value => `"${String(value ?? ``).replace(/"/g, `""`)}"`).join(`,`))
    .join(`\n`)
  const blob = new Blob([`\uFEFF${csv}`], { type: `text/csv;charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const link = document.createElement(`a`)
  const stamp = new Date().toISOString().replace(/[:.]/g, `-`)
  link.href = url
  link.download = `IP访达工具-运行日志-${stamp}.csv`
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function testSelectedProxy() {
  const proxy = selectedProxy()
  if (!proxy)
    return
  void detect(proxy)
}

function visitNextProxy() {
  try {
    void visitWithProxy(nextProxy())
  }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    addLog({ ok: false, proxy: ``, detail: message })
  }
}

function visitTunnel() {
  const proxy = current91HttpConfig().tunnel
  save91HttpConfig()
  if (!proxy) {
    addLog({ ok: false, proxy: `91HTTP 隧道`, detail: `请先填写 91HTTP 隧道代理地址` })
    return
  }
  void visitWithProxy(proxy)
}

function clearLogs() {
  logs.value = []
}

onMounted(() => {
  loadSaved()
  void detect().catch(() => {})
})
</script>

<template>
  <section class="space-y-4">
    <div class="rounded-[18px] border border-primary/25 bg-primary/[0.05] p-4 dark:bg-primary/10">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="flex items-center gap-1.5 text-xs font-medium text-primary">
            <Eye class="h-3.5 w-3.5" />
            IP 访达工具
          </p>
          <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
            从宣发活跃页直接完成出口 IP 检测、目标链接访问、代理池轮换和 91HTTP 配置管理。
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" :disabled="busy" @click="detect()">
          <Loader2 v-if="busy" class="mr-1.5 h-4 w-4 animate-spin" />
          <RotateCw v-else class="mr-1.5 h-4 w-4" />
          检测直连 IP
        </Button>
      </div>
    </div>

    <section class="grid gap-3 sm:grid-cols-3">
      <div class="rounded-xl border border-border/80 bg-white/80 p-4 dark:bg-card">
        <p class="text-xs font-medium text-muted-foreground">
          当前出口 IP
        </p>
        <p class="mt-1 break-all text-lg font-semibold tabular-nums">
          {{ currentIp }}
        </p>
      </div>
      <div class="rounded-xl border border-border/80 bg-white/80 p-4 dark:bg-card">
        <p class="text-xs font-medium text-muted-foreground">
          当前模式
        </p>
        <p class="mt-1 text-lg font-semibold">
          {{ currentMode }}
        </p>
      </div>
      <div class="rounded-xl border border-border/80 bg-white/80 p-4 dark:bg-card">
        <p class="text-xs font-medium text-muted-foreground">
          最近访问状态
        </p>
        <p class="mt-1 break-all text-lg font-semibold tabular-nums">
          {{ lastStatus }}
        </p>
      </div>
    </section>

    <section class="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
      <span class="font-semibold">运行说明：</span>
      当前项目的 Cloudflare Worker 可检测 Worker 出口 IP，但不能执行本地
      <span class="font-mono">curl --proxy</span>
      或消费 HTTP/SOCKS 代理；完整代理访问需要连接独立 Node/VPS 后端。
    </section>

    <section class="rounded-xl border border-border/80 bg-white/80 p-4 dark:bg-card">
      <label class="grid gap-1.5 text-sm font-medium">
        目标链接
        <input
          v-model="targetUrl"
          type="url"
          class="min-h-10 rounded-md border border-input bg-background px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="https://example.com"
          autocomplete="off"
        >
      </label>
      <div class="mt-3 flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" :disabled="busy" @click="visitWithProxy()">
          <Play class="mr-1.5 h-4 w-4" />
          直连访问
        </Button>
        <Button type="button" size="sm" :disabled="busy" @click="visitNextProxy">
          <Network class="mr-1.5 h-4 w-4" />
          切换 IP 并访问
        </Button>
        <Button type="button" variant="outline" size="sm" :disabled="busy" @click="visitTunnel">
          91HTTP 隧道访问
        </Button>
        <Button type="button" variant="outline" size="sm" :disabled="busy" @click="autoRotateVisit">
          自动轮换
        </Button>
      </div>
    </section>

    <section class="rounded-xl border border-border/80 bg-white/80 p-4 dark:bg-card">
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3">
        <h2 class="text-sm font-semibold">
          91HTTP 接入
        </h2>
        <Button type="button" variant="outline" size="sm" :disabled="busy" @click="save91Http">
          <Save class="mr-1.5 h-4 w-4" />
          保存配置
        </Button>
      </div>

      <label class="mt-3 grid gap-1.5 text-sm font-medium">
        默认 API 提取链接
        <input
          :value="MASKED_91HTTP_API_URL"
          type="password"
          class="min-h-10 rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground"
          readonly
        >
        <span class="text-xs font-normal leading-relaxed text-muted-foreground">
          已内置固定 91HTTP API 链接，页面仅脱敏展示，实际请求会使用完整链接。
        </span>
      </label>

      <div class="mt-3 rounded-lg border border-primary/20 bg-primary/[0.04] p-3 text-xs leading-relaxed text-muted-foreground">
        <span class="font-medium text-foreground">白名单说明：</span>
        91HTTP 的 API 安全白名单校验发起请求的终端公网 IP。新增白名单后通常约 5 分钟生效；切换网络、VPN 或热点后需要重新添加。
      </div>

      <div class="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(10rem,1fr)_minmax(10rem,1fr)_7rem_8rem_8rem_minmax(8rem,1fr)_minmax(8rem,1fr)]">
        <label class="grid gap-1.5 text-sm font-medium">
          trade_no
          <input v-model="http91TradeNo" class="ip-tool-input" type="text" autocomplete="off" placeholder="订单号 / 套餐编号">
        </label>
        <label class="grid gap-1.5 text-sm font-medium">
          secret
          <input v-model="http91Secret" class="ip-tool-input" type="password" autocomplete="off" placeholder="API Secret">
        </label>
        <label class="grid gap-1.5 text-sm font-medium">
          代理数
          <input v-model="http91Num" class="ip-tool-input" type="number" min="1" max="200">
        </label>
        <label class="grid gap-1.5 text-sm font-medium">
          访问次数
          <input v-model="extractVisitCount" class="ip-tool-input" type="number" min="1" max="50">
        </label>
        <label class="grid gap-1.5 text-sm font-medium">
          协议
          <select v-model="http91Protocol" class="ip-tool-input">
            <option value="http">
              HTTP
            </option>
            <option value="socks5">
              SOCKS5
            </option>
          </select>
        </label>
        <label class="grid gap-1.5 text-sm font-medium">
          省份
          <input v-model="http91Province" class="ip-tool-input" type="text" autocomplete="off" placeholder="可选">
        </label>
        <label class="grid gap-1.5 text-sm font-medium">
          城市
          <input v-model="http91City" class="ip-tool-input" type="text" autocomplete="off" placeholder="可选">
        </label>
      </div>

      <div class="mt-3 flex flex-wrap gap-2">
        <Button type="button" size="sm" :disabled="busy" @click="extractAndVisit91Http">
          提取并访问
        </Button>
        <Button type="button" variant="outline" size="sm" :disabled="busy" @click="extract91Http">
          提取到代理池
        </Button>
      </div>

      <label class="mt-3 grid gap-1.5 text-sm font-medium">
        91HTTP 隧道代理
        <input v-model="http91Tunnel" class="ip-tool-input" type="text" autocomplete="off" placeholder="例如 http://user:pass@host:port 或 host:port">
      </label>
    </section>

    <section class="grid gap-4 xl:grid-cols-[minmax(20rem,0.95fr)_minmax(24rem,1.05fr)]">
      <div class="rounded-xl border border-border/80 bg-white/80 p-4 dark:bg-card">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3">
          <h2 class="text-sm font-semibold">
            代理池
          </h2>
          <Button type="button" variant="outline" size="sm" :disabled="busy" @click="saveProxies">
            <Save class="mr-1.5 h-4 w-4" />
            保存
          </Button>
        </div>
        <textarea
          ref="proxyTextarea"
          v-model="proxyList"
          class="mt-3 min-h-56 w-full resize-y rounded-md border border-input bg-muted/60 p-3 font-mono text-xs leading-relaxed outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
          spellcheck="false"
          placeholder="每行一个代理，例如：
http://127.0.0.1:7890
socks5://127.0.0.1:9050
user:pass@1.2.3.4:8080"
        />
        <div class="mt-3 flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" :disabled="busy" @click="testSelectedProxy">
            检测选中代理
          </Button>
          <Button type="button" variant="outline" size="sm" :disabled="busy" @click="clearLogs">
            <Trash2 class="mr-1.5 h-4 w-4" />
            清空日志
          </Button>
        </div>
      </div>

      <div class="rounded-xl border border-border/80 bg-white/80 p-4 dark:bg-card">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3">
          <h2 class="text-sm font-semibold">
            访问结果
          </h2>
          <span class="break-all text-xs text-muted-foreground">{{ activeProxy }}</span>
        </div>
        <pre class="mt-3 max-h-80 min-h-56 overflow-auto whitespace-pre-wrap break-words rounded-md border border-input bg-muted/60 p-3 text-xs leading-relaxed">{{ preview }}</pre>
      </div>
    </section>

    <section class="rounded-xl border border-border/80 bg-white/80 p-4 dark:bg-card">
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3">
        <h2 class="text-sm font-semibold">
          运行日志
        </h2>
        <div class="flex items-center gap-2">
          <span class="text-xs text-muted-foreground">{{ queueState }}</span>
          <Button type="button" variant="outline" size="sm" @click="downloadLogs">
            <Download class="mr-1.5 h-4 w-4" />
            下载日志
          </Button>
        </div>
      </div>
      <ol class="mt-2 divide-y divide-border/70 text-xs leading-relaxed text-muted-foreground">
        <li v-for="log in logs" :key="`${log.time.toISOString()}-${log.detail}`" class="py-2">
          <span class="font-semibold" :class="log.ok ? 'text-primary' : 'text-destructive'">
            {{ log.ok ? '成功' : '失败' }}
          </span>
          <span class="ml-1">{{ log.time.toLocaleTimeString() }}</span>
          <span class="ml-1">{{ log.proxy ? `| 代理 ${log.proxy}` : '| 直连' }}</span>
          <span v-if="log.detail" class="ml-1">| {{ log.detail }}</span>
        </li>
      </ol>
    </section>
  </section>
</template>

<style scoped>
.ip-tool-input {
  min-height: 2.5rem;
  border-radius: 0.375rem;
  border: 1px solid hsl(var(--input));
  background: hsl(var(--background));
  padding: 0 0.75rem;
  font-size: 0.875rem;
  outline: none;
}

.ip-tool-input:focus-visible {
  box-shadow: 0 0 0 2px hsl(var(--ring));
}
</style>
