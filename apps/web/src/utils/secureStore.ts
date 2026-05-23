/**
 * 凭证安全存储层
 *
 * 用 AES-GCM 加密敏感字符串(API Key / 访问令牌 / 密钥),密文写入底层
 * `store`(localStorage),主密钥写入 IndexedDB 且 `extractable: false`。
 *
 * 防护范围:
 *   - DevTools 直接窥探 localStorage 看到的是密文
 *   - 第三方扩展 / 备份工具读取 localStorage 拿不到明文
 *   - 偶然出现的日志/序列化把 localStorage dump 出去时不再暴露密钥
 *
 * 不能防护:
 *   - 同源 XSS(攻击者依然可以调用 `secureStore.get` 解密)
 *   该层是纵深防御的一层,不是终极方案。真正高敏感凭证应当用后端代理 + 短期 token。
 */
import { store } from './storage'

const DB_NAME = `__md_sec__`
const STORE_NAME = `keys`
const MASTER_KEY_ID = `master`
const CIPHER_PREFIX = `enc:v1:`

let masterKeyPromise: Promise<CryptoKey> | null = null

function isCryptoAvailable(): boolean {
  return typeof globalThis !== `undefined`
    && !!globalThis.crypto?.subtle
    && typeof globalThis.indexedDB !== `undefined`
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME))
        db.createObjectStore(STORE_NAME)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function idbGet(db: IDBDatabase, key: string): Promise<CryptoKey | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, `readonly`)
    const req = tx.objectStore(STORE_NAME).get(key)
    req.onsuccess = () => resolve(req.result as CryptoKey | undefined)
    req.onerror = () => reject(req.error)
  })
}

function idbPut(db: IDBDatabase, key: string, value: CryptoKey): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, `readwrite`)
    tx.objectStore(STORE_NAME).put(value, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function loadMasterKey(): Promise<CryptoKey> {
  if (!isCryptoAvailable())
    throw new Error(`[secureStore] WebCrypto/IndexedDB unavailable`)

  const db = await openDB()
  try {
    const existing = await idbGet(db, MASTER_KEY_ID)
    if (existing)
      return existing

    const generated = await crypto.subtle.generateKey(
      { name: `AES-GCM`, length: 256 },
      // non-extractable: 即使代码被注入也无法导出原始 key bytes
      false,
      [`encrypt`, `decrypt`],
    )
    await idbPut(db, MASTER_KEY_ID, generated)
    return generated
  }
  finally {
    db.close()
  }
}

function getMasterKey(): Promise<CryptoKey> {
  masterKeyPromise ??= loadMasterKey().catch((err) => {
    masterKeyPromise = null
    throw err
  })
  return masterKeyPromise
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = ``
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  return btoa(bin)
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

async function encryptString(plaintext: string): Promise<string> {
  const key = await getMasterKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const data = new TextEncoder().encode(plaintext)
  const buf = await crypto.subtle.encrypt({ name: `AES-GCM`, iv }, key, data)
  // 拼接 iv(12) + ciphertext,统一 base64
  const ct = new Uint8Array(buf)
  const combined = new Uint8Array(iv.length + ct.length)
  combined.set(iv, 0)
  combined.set(ct, iv.length)
  return CIPHER_PREFIX + bytesToBase64(combined)
}

async function decryptString(blob: string): Promise<string | null> {
  if (!blob.startsWith(CIPHER_PREFIX))
    return null
  const key = await getMasterKey()
  const combined = base64ToBytes(blob.slice(CIPHER_PREFIX.length))
  if (combined.length <= 12)
    return null
  const iv = combined.slice(0, 12)
  const ct = combined.slice(12)
  try {
    const buf = await crypto.subtle.decrypt({ name: `AES-GCM`, iv }, key, ct)
    return new TextDecoder().decode(buf)
  }
  catch (err) {
    console.warn(`[secureStore] decrypt failed`, err)
    return null
  }
}

function isCiphertext(value: string): boolean {
  return value.startsWith(CIPHER_PREFIX)
}

/**
 * 安全存储 API
 *
 * 与底层 `store` 同形:`get / set / remove`,但 set 会加密、get 会解密。
 * 读取到旧的明文值时会就地升级(读取明文 → 加密回写),用户无感迁移。
 *
 * 若运行环境不支持 WebCrypto/IndexedDB,会回退到普通 `store`(只警告一次)。
 */
let fallbackWarned = false
function warnFallback(reason: unknown): void {
  if (fallbackWarned)
    return
  fallbackWarned = true
  console.warn(`[secureStore] falling back to plaintext storage:`, reason)
}

export const secureStore = {
  async get(key: string): Promise<string | null> {
    const raw = await store.get(key)
    if (raw == null)
      return null

    if (!isCiphertext(raw)) {
      // 旧版明文:迁移为密文,迁移失败也至少返回明文,保留可用性
      try {
        const enc = await encryptString(raw)
        await store.set(key, enc)
      }
      catch (err) {
        warnFallback(err)
      }
      return raw
    }

    try {
      return await decryptString(raw)
    }
    catch (err) {
      warnFallback(err)
      return null
    }
  },

  async set(key: string, value: string): Promise<void> {
    try {
      const enc = await encryptString(value)
      await store.set(key, enc)
    }
    catch (err) {
      warnFallback(err)
      await store.set(key, value)
    }
  },

  async remove(key: string): Promise<void> {
    await store.remove(key)
  },
}

// 仅供测试/调试使用,默认不导出
export const __internal = { encryptString, decryptString, isCiphertext, CIPHER_PREFIX }
