import type { AuthEnv } from './auth/routes'
import { resolveCurrentUser } from './auth/routes'

const SITE_OWNER_EMAIL = `tuaran666@gmail.com`
const SITE_OWNER_CREATOR_ID = `tuaran`

const RESERVED_CREATOR_IDS = new Set([
  SITE_OWNER_CREATOR_ID,
  `admin`,
  `api`,
  `settings`,
  `pricing`,
  `edit`,
  `sync`,
  `workflow`,
  `changelog`,
  `import`,
  `creator-offer`,
  `docs`,
  `matrix`,
  `distribution`,
  `stats`,
  `creation`,
  `data`,
])

interface CreatorProfileEnv extends AuthEnv {
  DB?: D1Database
}

interface CreatorProfileRow {
  user_id: string
  creator_id: string
  display_name: string
  tagline: string
  homepage: string | null
  contact_hint: string | null
  social_accounts_json: string
  share_token: string | null
  share_enabled: number
  created_at: number
  updated_at: number
}

export interface StoredCreatorProfile {
  creatorId: string
  displayName: string
  tagline: string
  homepage: string | null
  contactHint: string | null
  socialAccounts: unknown[]
  shareEnabled: boolean
  shareToken: string | null
  updatedAt: number
}

export type PublicCreatorProfile = Omit<StoredCreatorProfile, 'shareToken'>

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers)
  headers.set(`Content-Type`, `application/json; charset=utf-8`)
  headers.set(`Cache-Control`, `no-store`)
  return new Response(JSON.stringify(body), { ...init, headers })
}

function slugifyCreatorId(raw: string): string {
  // 先 slice 再 strip 前后连字符：避免截断点恰好是 - 时尾部留 - 而被后续 regex 拒掉
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, `-`)
    .slice(0, 48)
    .replace(/^-+|-+$/g, ``)
}

function isSiteOwnerEmail(email: string | null | undefined): boolean {
  return (email ?? ``).trim().toLowerCase() === SITE_OWNER_EMAIL
}

function generateShareToken(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, b => b.toString(16).padStart(2, `0`)).join(``)
}

function validateCreatorId(raw: string, allowSiteOwnerId = false): string | null {
  const id = slugifyCreatorId(raw)
  if (id.length < 3)
    return `标签 ID 至少 3 个字符`
  if (!/^[a-z0-9][a-z0-9_-]*[a-z0-9]$/.test(id) && id.length >= 2)
    return `标签 ID 格式不正确`
  if (!allowSiteOwnerId && RESERVED_CREATOR_IDS.has(id))
    return `标签 ID 已被系统保留`
  if (allowSiteOwnerId && id !== SITE_OWNER_CREATOR_ID && RESERVED_CREATOR_IDS.has(id))
    return `标签 ID 已被系统保留`
  return null
}

function defaultCreatorIdForUser(email: string, login: string): string {
  if (isSiteOwnerEmail(email))
    return SITE_OWNER_CREATOR_ID
  const fromLogin = slugifyCreatorId(login)
  if (fromLogin.length >= 3 && !RESERVED_CREATOR_IDS.has(fromLogin))
    return fromLogin
  return `creator-${login.slice(0, 8).toLowerCase().replace(/[^a-z0-9]/g, ``) || `user`}`
}

function defaultDisplayNameForUser(email: string, login: string, name: string | null): string {
  if (isSiteOwnerEmail(email))
    return `安东尼`
  return (name?.trim() || login.trim() || `创作者`).slice(0, 64)
}

function rowToProfile(row: CreatorProfileRow, includeShareToken: boolean): StoredCreatorProfile {
  let socialAccounts: unknown[] = []
  try {
    const parsed = JSON.parse(row.social_accounts_json)
    socialAccounts = Array.isArray(parsed) ? parsed : []
  }
  catch {}
  return {
    creatorId: row.creator_id,
    displayName: row.display_name,
    tagline: row.tagline,
    homepage: row.homepage,
    contactHint: row.contact_hint,
    socialAccounts,
    shareEnabled: row.share_enabled === 1,
    shareToken: includeShareToken ? row.share_token : null,
    updatedAt: row.updated_at,
  }
}

function rowToPublicProfile(row: CreatorProfileRow): PublicCreatorProfile {
  const full = rowToProfile(row, false)
  return {
    creatorId: full.creatorId,
    displayName: full.displayName,
    tagline: full.tagline,
    homepage: full.homepage,
    contactHint: full.contactHint,
    socialAccounts: full.socialAccounts,
    shareEnabled: full.shareEnabled,
    updatedAt: full.updatedAt,
  }
}

async function getProfileRow(db: D1Database, userId: string): Promise<CreatorProfileRow | null> {
  const row = await db
    .prepare(`SELECT * FROM user_creator_profiles WHERE user_id = ?`)
    .bind(userId)
    .first<CreatorProfileRow>()
  return row ?? null
}

async function getProfileRowByCreatorId(db: D1Database, creatorId: string): Promise<CreatorProfileRow | null> {
  const row = await db
    .prepare(`SELECT * FROM user_creator_profiles WHERE creator_id = ?`)
    .bind(creatorId)
    .first<CreatorProfileRow>()
  return row ?? null
}

async function ensureShareToken(db: D1Database, row: CreatorProfileRow): Promise<CreatorProfileRow> {
  if (row.share_token)
    return row
  // 仅在用户首次启用分享时才生成 token；未启用时返回当前行
  return row
}

function fallbackCreatorIdForUser(login: string): string {
  const base = login.slice(0, 8).toLowerCase().replace(/[^a-z0-9]/g, ``) || `user`
  return `creator-${base}`
}

async function pickAvailableCreatorId(
  db: D1Database,
  preferred: string,
  userId: string,
  login: string,
): Promise<string> {
  const taken = await getProfileRowByCreatorId(db, preferred)
  if (!taken || taken.user_id === userId)
    return preferred
  // 历史上有人抢占同 slug：退一层使用 fallback，再不行加随机后缀
  const fallback = fallbackCreatorIdForUser(login)
  const fallbackTaken = await getProfileRowByCreatorId(db, fallback)
  if (!fallbackTaken || fallbackTaken.user_id === userId)
    return fallback
  return `${fallback}-${Math.floor(Math.random() * 1_000_000).toString(36)}`
}

async function ensureProfile(
  db: D1Database,
  user: { id: string, email: string | null, login: string, name: string | null },
): Promise<CreatorProfileRow> {
  const existing = await getProfileRow(db, user.id)
  if (existing)
    return ensureShareToken(db, existing)

  const now = Math.floor(Date.now() / 1000)
  const email = user.email ?? ``
  const preferredCreatorId = defaultCreatorIdForUser(email, user.login)
  // 站长邮箱命中 SITE_OWNER_CREATOR_ID 时也要确认未被旧行占用，避免 UNIQUE 冲突导致 5xx
  const creatorId = await pickAvailableCreatorId(db, preferredCreatorId, user.id, user.login)
  const displayName = defaultDisplayNameForUser(email, user.login, user.name)
  const tagline = isSiteOwnerEmail(email)
    ? `技术向内容创作 · 多平台分发 · 品牌推文与引流合作`
    : ``
  const homepage = isSiteOwnerEmail(email) ? `https://tuaran.me` : null
  const contactHint = isSiteOwnerEmail(email)
    ? `合作咨询请通过 tuaran.me 或微信联系（备注：品牌合作）`
    : null

  // share_token 首次插入留空（NULL），用户点开分享时再按需生成
  await db
    .prepare(
      `INSERT INTO user_creator_profiles
        (user_id, creator_id, display_name, tagline, homepage, contact_hint,
         social_accounts_json, share_token, share_enabled, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, '[]', NULL, 0, ?, ?)`,
    )
    .bind(user.id, creatorId, displayName, tagline, homepage, contactHint, now, now)
    .run()

  const created = await getProfileRow(db, user.id)
  if (!created)
    throw new Error(`Failed to create creator profile`)
  return created
}

async function readJsonObject(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json()
    return body && typeof body === `object` && !Array.isArray(body)
      ? body as Record<string, unknown>
      : {}
  }
  catch {
    return {}
  }
}

function cleanOptionalText(value: unknown, maxLen: number): string | null | undefined {
  if (value === undefined)
    return undefined
  if (value === null)
    return null
  if (typeof value !== `string`)
    return undefined
  const trimmed = value.trim()
  if (!trimmed)
    return null
  return trimmed.slice(0, maxLen)
}

function parseBoolean(value: unknown): boolean | undefined {
  if (typeof value === `boolean`)
    return value
  return undefined
}

async function handleMeApi(
  env: CreatorProfileEnv,
  request: Request,
  user: NonNullable<Awaited<ReturnType<typeof resolveCurrentUser>>>,
): Promise<Response> {
  const db = env.DB!

  if (request.method === `GET`) {
    try {
      const row = await ensureProfile(db, user)
      return jsonResponse({ ok: true, profile: rowToProfile(row, true) })
    }
    catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return jsonResponse({ ok: false, error: message }, { status: 500 })
    }
  }

  const body = await readJsonObject(request)
  const row = await ensureProfile(db, user)
  const displayName = cleanOptionalText(body.displayName, 64)
  const tagline = cleanOptionalText(body.tagline, 240)
  const homepage = cleanOptionalText(body.homepage, 512)
  const contactHint = cleanOptionalText(body.contactHint, 512)
  const shareEnabled = parseBoolean(body.shareEnabled)
  const regenerateShareToken = parseBoolean(body.regenerateShareToken) === true
  let socialAccountsJson: string | undefined
  let nextCreatorId: string | undefined

  if (`creatorId` in body && typeof body.creatorId === `string`) {
    if (isSiteOwnerEmail(user.email) && row.creator_id === SITE_OWNER_CREATOR_ID) {
      return jsonResponse({ ok: false, error: `站长标签 ID 固定为 tuaran，不可修改` }, { status: 400 })
    }
    const validationError = validateCreatorId(body.creatorId, false)
    if (validationError)
      return jsonResponse({ ok: false, error: validationError }, { status: 400 })
    nextCreatorId = slugifyCreatorId(body.creatorId)
    const taken = await getProfileRowByCreatorId(db, nextCreatorId)
    if (taken && taken.user_id !== user.id)
      return jsonResponse({ ok: false, error: `标签 ID「${nextCreatorId}」已被占用` }, { status: 409 })
  }

  if (`socialAccounts` in body) {
    if (!Array.isArray(body.socialAccounts))
      return jsonResponse({ ok: false, error: `socialAccounts must be an array` }, { status: 400 })
    socialAccountsJson = JSON.stringify(body.socialAccounts).slice(0, 512_000)
  }

  const now = Math.floor(Date.now() / 1000)
  let nextShareToken = row.share_token
  // 仅在用户显式开启分享或手动重置时才生成 token；关闭状态保持 NULL
  const willEnableShare = shareEnabled === true || (shareEnabled === undefined && row.share_enabled === 1)
  if (regenerateShareToken || (willEnableShare && !nextShareToken))
    nextShareToken = generateShareToken()

  await db
    .prepare(
      `UPDATE user_creator_profiles SET
         creator_id = COALESCE(?, creator_id),
         display_name = COALESCE(?, display_name),
         tagline = COALESCE(?, tagline),
         homepage = COALESCE(?, homepage),
         contact_hint = COALESCE(?, contact_hint),
         social_accounts_json = COALESCE(?, social_accounts_json),
         share_enabled = COALESCE(?, share_enabled),
         share_token = ?,
         updated_at = ?
       WHERE user_id = ?`,
    )
    .bind(
      nextCreatorId ?? null,
      displayName ?? null,
      tagline ?? null,
      homepage ?? null,
      contactHint ?? null,
      socialAccountsJson ?? null,
      shareEnabled === undefined ? null : (shareEnabled ? 1 : 0),
      nextShareToken,
      now,
      user.id,
    )
    .run()

  const updated = await getProfileRow(db, user.id)
  if (!updated)
    return jsonResponse({ ok: false, error: `Profile not found` }, { status: 404 })

  return jsonResponse({ ok: true, profile: rowToProfile(updated, true) })
}

export async function handlePublicCreatorProfileApi(
  env: CreatorProfileEnv,
  request: Request,
  url: URL,
): Promise<Response> {
  if (request.method !== `GET`)
    return jsonResponse({ ok: false, error: `Method Not Allowed` }, { status: 405 })

  if (!env.DB)
    return jsonResponse({ ok: false, error: `Creator profile backend not configured` }, { status: 503 })

  const creatorId = slugifyCreatorId(url.searchParams.get(`creatorId`) ?? ``)
  const token = (url.searchParams.get(`token`) ?? ``).trim().toLowerCase()

  if (!creatorId || !token)
    return jsonResponse({ ok: false, error: `Missing creatorId or token` }, { status: 400 })

  const row = await env.DB
    .prepare(
      `SELECT * FROM user_creator_profiles
       WHERE creator_id = ? AND share_enabled = 1 AND share_token = ?`,
    )
    .bind(creatorId, token)
    .first<CreatorProfileRow>()

  if (!row)
    return jsonResponse({ ok: false, error: `分享链接无效或已关闭`, code: `SHARE_NOT_FOUND` }, { status: 404 })

  return jsonResponse({ ok: true, profile: rowToPublicProfile(row) })
}

export async function handleCreatorProfileApi(
  env: CreatorProfileEnv,
  request: Request,
  url: URL,
): Promise<Response> {
  if (url.pathname === `/api/creator-profile/public`)
    return handlePublicCreatorProfileApi(env, request, url)

  if (request.method !== `GET` && request.method !== `PUT`)
    return jsonResponse({ ok: false, error: `Method Not Allowed` }, { status: 405 })

  if (!env.DB)
    return jsonResponse({ ok: false, error: `Creator profile backend not configured` }, { status: 503 })

  const user = await resolveCurrentUser(env, request)
  if (!user)
    return jsonResponse({ ok: false, error: `未登录`, code: `LOGIN_REQUIRED` }, { status: 401 })

  if (url.pathname !== `/api/creator-profile/me`)
    return jsonResponse({ ok: false, error: `Not Found` }, { status: 404 })

  return handleMeApi(env, request, user)
}
