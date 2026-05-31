/**
 * DeepSeek 后端代理客户端。
 *
 * 真实 API key 仅存在于 Cloudflare Worker secret 中，前端从不持有。
 * 用户用共享密码解锁后，密码写入 sessionStorage（仅当前标签页有效），
 * 后续每次聊天请求带 `x-deepseek-password` 头由后端校验后转发。
 */

const SESSION_KEY = `deepseek_access_password_v1`

export const DEEPSEEK_UNLOCK_ENDPOINT = `/api/deepseek/unlock`
export const DEEPSEEK_CHAT_ENDPOINT = `/api/deepseek/chat`

let cachedPassword: string | null = null

function readSession(): string | null {
  try {
    const v = sessionStorage.getItem(SESSION_KEY)
    return v && v.length > 0 ? v : null
  }
  catch {
    return null
  }
}

function writeSession(password: string): void {
  try {
    sessionStorage.setItem(SESSION_KEY, password)
  }
  catch {}
}

function clearSession(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY)
  }
  catch {}
}

/**
 * 向后端校验密码，校验通过则缓存到 sessionStorage。失败抛错。
 */
export async function unlockDeepSeek(password: string): Promise<void> {
  if (!password)
    throw new Error(`请输入密码`)

  let res: Response
  try {
    res = await fetch(DEEPSEEK_UNLOCK_ENDPOINT, {
      method: `POST`,
      headers: { 'Content-Type': `application/json` },
      body: JSON.stringify({ password }),
    })
  }
  catch {
    throw new Error(`无法连接 DeepSeek 代理`)
  }

  if (res.status === 401)
    throw new Error(`密码错误`)
  if (res.status === 503)
    throw new Error(`DeepSeek 代理未配置`)
  if (!res.ok)
    throw new Error(`解锁失败（${res.status}）`)

  cachedPassword = password
  writeSession(password)
}

export function getDeepSeekPassword(): string | null {
  if (cachedPassword)
    return cachedPassword
  cachedPassword = readSession()
  return cachedPassword
}

export function isDeepSeekUnlocked(): boolean {
  return getDeepSeekPassword() !== null
}

export function lockDeepSeek(): void {
  cachedPassword = null
  clearSession()
}

export interface DeepSeekModelOption {
  value: string
  label: string
  description: string
}

export const DEEPSEEK_MODELS: DeepSeekModelOption[] = [
  {
    value: `deepseek-v4-pro`,
    label: `DeepSeek V4 Pro`,
    description: `主力模型 · 1M 上下文 / 输出最大 384K · 默认思考模式，结构与质量更稳`,
  },
  {
    value: `deepseek-v4-flash`,
    label: `DeepSeek V4 Flash`,
    description: `轻量主力 · 1M 上下文 / 输出最大 384K · 速度更快，适合短平快二创`,
  },
]
