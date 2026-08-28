import type { UserRecord } from './types'
import { verifyPassword } from './password'
import { toPublicUser } from './quota'
import { consumeRate, getClientIp, rateLimitedResponse } from './rateLimit'
import { getUserByEmail, getUserById } from './user'

export const PLATFORM_HOST = 'syncblog.2aran.com'
const SESSION_URL = 'https://2aran.com/api/subsites/session'
interface PlatformEnv { DB?: D1Database }
interface PlatformIdentity { id: string, name: string }

export class PlatformAuthError extends Error {
  constructor(public status = 503, message = '统一账号暂不可用，请稍后重试') { super(message) }
}

export function isPlatformRequest(request: Request): boolean {
  return new URL(request.url).hostname === PLATFORM_HOST
}

export function publicProxyHeaders(request: Request): Headers {
  const headers = new Headers()
  for (const name of ['accept', 'content-type']) {
    const value = request.headers.get(name)
    if (value)
      headers.set(name, value)
  }
  return headers
}

export function requirePlatformOrigin(request: Request): void {
  if (request.headers.get('origin') !== `https://${PLATFORM_HOST}`)
    throw new PlatformAuthError(403, '请求来源不受信任')
}

export async function resolvePlatformIdentity(request: Request): Promise<PlatformIdentity | null> {
  const cookies = (request.headers.get('cookie') || '').split(';').map(v => v.trim()).filter(v => v.startsWith('tuaran_session='))
  if (!cookies.length)
    return null
  // Reject ambiguous cookies. Never forward the legacy session or any other
  // cookies, and never follow a redirect with credentials.
  if (cookies.length !== 1 || cookies[0].length > 8192)
    throw new PlatformAuthError()
  try {
    const response = await fetch(SESSION_URL, {
      headers: { cookie: cookies[0], accept: 'application/json' },
      redirect: 'manual',
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    })
    if (response.status === 403)
      throw new PlatformAuthError(403, '账号不可用')
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json'))
      throw new PlatformAuthError()
    const data = await response.json() as { version?: number, isGuest?: boolean, user?: PlatformIdentity | null }
    if (data.version !== 1)
      throw new PlatformAuthError()
    if (data.isGuest === true && data.user === null)
      return null
    if (data.isGuest !== false || !data.user || typeof data.user.id !== 'string'
      || !/^[\w:-]{1,180}$/.test(data.user.id) || data.user.id.startsWith('guest:')
      || typeof data.user.name !== 'string') {
      throw new PlatformAuthError()
    }
    return { id: data.user.id, name: data.user.name.slice(0, 100) }
  }
  catch (error) {
    if (error instanceof PlatformAuthError)
      throw error
    throw new PlatformAuthError()
  }
}

async function linkedUser(db: D1Database, platformId: string): Promise<UserRecord | null> {
  const link = await db.prepare('SELECT user_id FROM platform_account_links WHERE platform_id = ?')
    .bind(platformId)
    .first<{ user_id: string }>()
  if (!link)
    return null
  const user = await getUserById(db, link.user_id)
  if (!user)
    throw new PlatformAuthError()
  return user
}

export async function resolvePlatformUser(env: PlatformEnv, request: Request): Promise<UserRecord | null> {
  const identity = await resolvePlatformIdentity(request)
  if (!identity)
    return null
  if (!env.DB)
    throw new PlatformAuthError()
  const user = await linkedUser(env.DB, identity.id)
  if (!user)
    throw new PlatformAuthError(409, '请先关联原账号或创建工作区')
  return user
}

function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store', 'Vary': 'Cookie' } })
}

async function readLinkInput(request: Request): Promise<{ email?: string, password?: string }> {
  const reader = request.body?.getReader()
  if (!reader)
    throw new PlatformAuthError(400, '请求格式错误')
  const chunks: Uint8Array[] = []
  let size = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done)
      break
    size += value.byteLength
    if (size > 4096) { await reader.cancel(); throw new PlatformAuthError(413, '请求过大') }
    chunks.push(value)
  }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength }
  try { return JSON.parse(new TextDecoder().decode(bytes)) }
  catch { throw new PlatformAuthError(400, '请求格式错误') }
}

export async function handlePlatformAuth(env: PlatformEnv, request: Request, url: URL): Promise<Response> {
  if (!env.DB)
    throw new PlatformAuthError()
  const identity = await resolvePlatformIdentity(request)
  if (url.pathname === '/api/auth/me' && request.method === 'GET') {
    const user = identity ? await linkedUser(env.DB, identity.id) : null
    return json({ user: user ? toPublicUser(user) : null, platform: identity ? { user: identity, needsSetup: !user } : null })
  }
  if (request.method !== 'POST')
    return json({ error: 'Method Not Allowed' }, 405)
  requirePlatformOrigin(request)
  if (!identity)
    return json({ error: '请先登录 2aran 主站' }, 401)
  if (!['/api/auth/platform/activate', '/api/auth/platform/link'].includes(url.pathname))
    return json({ error: '请使用 2aran 主站登录与退出' }, 410)

  for (const [scope, subject, max] of [
    ['platform_link_user', identity.id, 5],
    ['platform_link_ip', getClientIp(request), 20],
  ] as const) {
    const limit = await consumeRate(env.DB, scope, subject, max, 300)
    if (!limit.allowed)
      return rateLimitedResponse(limit, scope)
  }
  // Never replace an existing mapping, even if the caller supplies different
  // valid credentials. This preserves the current workspace and its assets.
  const existing = await linkedUser(env.DB, identity.id)
  if (existing)
    return json({ error: '此主站账号已关联工作区，不能重复绑定' }, 409)

  let userId: string
  if (url.pathname.endsWith('/link')) {
    if (!request.headers.get('content-type')?.startsWith('application/json'))
      return json({ error: '需要 JSON 请求' }, 415)
    const input = await readLinkInput(request)
    if (!input || typeof input.email !== 'string' || typeof input.password !== 'string'
      || input.email.length > 254 || input.password.length > 128) {
      return json({ error: '账号或密码错误' }, 401)
    }
    const emailLimit = await consumeRate(env.DB, 'platform_link_email', input.email.trim().toLowerCase(), 10, 300)
    if (!emailLimit.allowed)
      return rateLimitedResponse(emailLimit, 'platform_link_email')
    const legacy = await getUserByEmail(env.DB, input.email.trim().toLowerCase())
    if (!legacy || !await verifyPassword(input.password, legacy.password_hash))
      return json({ error: '账号或密码错误' }, 401)
    userId = legacy.id
    // Unique constraints enforce both directions, including simultaneous links.
    await env.DB.prepare('INSERT OR IGNORE INTO platform_account_links (platform_id, user_id, created_at) VALUES (?, ?, ?)')
      .bind(identity.id, userId, Date.now())
      .run()
  }
  else {
    userId = `platform:${identity.id}`
    const now = Math.floor(Date.now() / 1000)
    await env.DB.batch([
      // Existing schema uses an email/legacy enum. This credentialless row has
      // neither email nor password; federation is recorded in the link table.
      env.DB.prepare(`INSERT OR IGNORE INTO users
        (id, email, password_hash, login, name, avatar_url, auth_provider, email_verified_at,
         plan, ai_quota_used, ai_quota_reset_at, pro_expires_at, created_at, updated_at)
        VALUES (?, NULL, NULL, ?, ?, NULL, 'email', NULL, 'free', 0, 0, 0, ?, ?)`)
        .bind(userId, identity.id, identity.name, now, now),
      env.DB.prepare('INSERT OR IGNORE INTO platform_account_links (platform_id, user_id, created_at) VALUES (?, ?, ?)')
        .bind(identity.id, userId, Date.now()),
    ])
  }
  const user = await linkedUser(env.DB, identity.id)
  if (!user || user.id !== userId)
    return json({ error: '账号已有关联，请刷新后查看；不会覆盖已有权益' }, 409)
  return json({ ok: true, user: toPublicUser(user), platform: { user: identity, needsSetup: false } })
}
