/**
 * DeepSeek 固定密钥的密码解锁工具。
 *
 * 出厂内联一个 AES-256-GCM 加密的 blob，需要正确密码才能在浏览器内解出明文。
 * 解锁后明文 key 暂存于内存 + sessionStorage（仅当前标签页有效）。
 */

const ENCRYPTED_BLOB_BASE64 = `DSOOARGiWwod1aj1blImo98Q+DGg9jNu9SU6tTJoBPPBG1nEIjaa66wbn2hnnB3D6yqFA3sw0GBfyOcdt/wxw5bdyKP6Nrr9M/txldUnWA==`

const SALT_LEN = 16
const IV_LEN = 12
const TAG_LEN = 16
const PBKDF2_ITERATIONS = 200_000

const SESSION_KEY = `deepseek_unlocked_key_v1`

let cachedKey: string | null = null

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++)
    bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function deriveAesKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const baseKey = await crypto.subtle.importKey(
    `raw`,
    enc.encode(password),
    `PBKDF2`,
    false,
    [`deriveKey`],
  )
  return crypto.subtle.deriveKey(
    {
      name: `PBKDF2`,
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: `SHA-256`,
    },
    baseKey,
    { name: `AES-GCM`, length: 256 },
    false,
    [`decrypt`],
  )
}

/**
 * 尝试用密码解开内联的 blob。成功返回明文 API key，失败抛错。
 */
export async function unlockDeepSeekKey(password: string): Promise<string> {
  const blob = base64ToBytes(ENCRYPTED_BLOB_BASE64)
  if (blob.length <= SALT_LEN + IV_LEN + TAG_LEN)
    throw new Error(`密文格式错误`)

  const salt = blob.slice(0, SALT_LEN)
  const iv = blob.slice(SALT_LEN, SALT_LEN + IV_LEN)
  const ciphertextAndTag = blob.slice(SALT_LEN + IV_LEN)

  const key = await deriveAesKey(password, salt)
  let plainBuf: ArrayBuffer
  try {
    plainBuf = await crypto.subtle.decrypt({ name: `AES-GCM`, iv }, key, ciphertextAndTag)
  }
  catch {
    throw new Error(`密码错误`)
  }
  const plain = new TextDecoder().decode(plainBuf)
  if (!plain.startsWith(`sk-`))
    throw new Error(`解密结果异常`)

  cachedKey = plain
  try {
    sessionStorage.setItem(SESSION_KEY, plain)
  }
  catch {
    // sessionStorage 可能被禁用，忽略
  }
  return plain
}

/**
 * 返回当前已解锁的 API key（未解锁返回 null）。
 */
export function getUnlockedDeepSeekKey(): string | null {
  if (cachedKey)
    return cachedKey
  try {
    const cached = sessionStorage.getItem(SESSION_KEY)
    if (cached && cached.startsWith(`sk-`)) {
      cachedKey = cached
      return cached
    }
  }
  catch {}
  return null
}

export function isDeepSeekUnlocked(): boolean {
  return getUnlockedDeepSeekKey() !== null
}

export function lockDeepSeek(): void {
  cachedKey = null
  try {
    sessionStorage.removeItem(SESSION_KEY)
  }
  catch {}
}

export const DEEPSEEK_ENDPOINT = `https://api.deepseek.com/v1/chat/completions`

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
