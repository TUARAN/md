/**
 * Auth route dispatch under /api/auth/*.
 *
 * Routes:
 *   GET  /api/auth/me                 — current user
 *   POST /api/auth/email/send-code    — send email verification code
 *   POST /api/auth/register           — verify code + create user + set session
 *   POST /api/auth/login              — email/password login + set session
 *   POST /api/auth/logout             — clear session cookie
 */

import type { CookieOpts } from './cookies'
import type { EmailCodePurpose } from './emailCode'
import type { PublicUser, UserRecord } from './types'
import { parseCookies, serializeCookie, SESSION_COOKIE } from './cookies'
import { sendVerificationEmail } from './email'
import { consumeEmailCode, generateEmailCode, storeEmailCode } from './emailCode'
import { hashPassword, verifyPassword } from './password'
import { toPublicUser } from './quota'
import { consumeRate, getClientIp, rateLimitedResponse } from './rateLimit'
import { mintSession, SESSION_TTL_SEC, verifySession } from './session'
import { createEmailUser, getUserByEmail, getUserById } from './user'

export interface AuthEnv {
  DB?: D1Database
  SESSION_SECRET?: string
  EMAIL_CODE_SECRET?: string
  EMAIL_PROVIDER?: string
  EMAIL_FROM?: string
  RESEND_API_KEY?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/
const MIN_PASSWORD_LEN = 8

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers)
  headers.set(`Content-Type`, `application/json; charset=utf-8`)
  headers.set(`Cache-Control`, `no-store`)
  return new Response(JSON.stringify(body), { ...init, headers })
}

function configError(missing: string): Response {
  return jsonResponse(
    { ok: false, error: `Auth backend not configured (missing ${missing})` },
    { status: 503 },
  )
}

function isSecureRequest(request: Request): boolean {
  const forwardedProto = request.headers.get(`x-forwarded-proto`)
  return new URL(request.url).protocol === `https:` || forwardedProto === `https`
}

function cookieOpts(request: Request, maxAge: number): CookieOpts {
  return { maxAge, secure: isSecureRequest(request) }
}

function normalizeEmail(raw: unknown): string {
  return typeof raw === `string` ? raw.trim().toLowerCase() : ``
}

function normalizePassword(raw: unknown): string {
  return typeof raw === `string` ? raw : ``
}

function validPurpose(raw: unknown): EmailCodePurpose | null {
  return raw === `register` || raw === `reset_password` ? raw : null
}

function validateEmail(email: string): string | null {
  if (!email)
    return `请输入邮箱`
  if (email.length > 254 || !EMAIL_RE.test(email))
    return `邮箱格式不正确`
  return null
}

function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LEN)
    return `密码至少需要 ${MIN_PASSWORD_LEN} 位`
  if (password.length > 128)
    return `密码不能超过 128 位`
  return null
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

async function authenticatedResponse(
  env: AuthEnv,
  request: Request,
  user: UserRecord,
): Promise<Response> {
  if (!env.SESSION_SECRET)
    return configError(`SESSION_SECRET`)
  const sessionToken = await mintSession(env.SESSION_SECRET, { sub: user.id })
  const headers = new Headers()
  headers.append(
    `Set-Cookie`,
    serializeCookie(SESSION_COOKIE, sessionToken, cookieOpts(request, SESSION_TTL_SEC)),
  )
  return jsonResponse({ ok: true, user: toPublicUser(user) }, { headers })
}

/**
 * Resolve the current authenticated user from cookies. Returns null when
 * unauthenticated or when the backend isn't configured yet.
 */
export async function resolveCurrentUser(
  env: AuthEnv,
  request: Request,
): Promise<UserRecord | null> {
  if (!env.DB || !env.SESSION_SECRET)
    return null
  const cookies = parseCookies(request.headers.get(`cookie`))
  const token = cookies[SESSION_COOKIE]
  if (!token)
    return null
  const claims = await verifySession(env.SESSION_SECRET, token)
  if (!claims)
    return null
  return getUserById(env.DB, claims.sub)
}

export async function handleAuthApi(
  env: AuthEnv,
  request: Request,
  url: URL,
): Promise<Response> {
  const path = url.pathname

  if (path === `/api/auth/me`) {
    const user = await resolveCurrentUser(env, request)
    return jsonResponse({ user: user ? toPublicUser(user) : null })
  }

  if (path === `/api/auth/email/send-code` && request.method === `POST`) {
    if (!env.DB)
      return configError(`DB`)
    if (!env.EMAIL_CODE_SECRET)
      return configError(`EMAIL_CODE_SECRET`)

    const body = await readJsonObject(request)
    const email = normalizeEmail(body.email)
    const purpose = validPurpose(body.purpose) ?? `register`
    const emailError = validateEmail(email)
    if (emailError)
      return jsonResponse({ ok: false, error: emailError }, { status: 400 })

    const ipRate = await consumeRate(env.DB, `email_code_ip`, getClientIp(request), 6, 60)
    if (!ipRate.allowed)
      return rateLimitedResponse(ipRate, `email_code_ip`)
    const emailRate = await consumeRate(env.DB, `email_code_email`, `${purpose}:${email}`, 1, 60)
    if (!emailRate.allowed)
      return rateLimitedResponse(emailRate, `email_code_email`)
    const dailyRate = await consumeRate(env.DB, `email_code_email_daily`, `${purpose}:${email}`, 10, 24 * 60 * 60)
    if (!dailyRate.allowed)
      return rateLimitedResponse(dailyRate, `email_code_email_daily`)

    if (purpose === `register`) {
      const existing = await getUserByEmail(env.DB, email)
      if (existing)
        return jsonResponse({ ok: false, error: `该邮箱已注册，请直接登录` }, { status: 409 })
    }

    const code = generateEmailCode()
    await storeEmailCode(env.DB, {
      email,
      code,
      purpose,
      secret: env.EMAIL_CODE_SECRET,
    })

    try {
      await sendVerificationEmail(env, { to: email, code, purpose })
      return jsonResponse({ ok: true })
    }
    catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[auth email] send failed`, { message })
      return jsonResponse({ ok: false, error: `验证码邮件发送失败：${message}` }, { status: 502 })
    }
  }

  if (path === `/api/auth/register` && request.method === `POST`) {
    if (!env.DB)
      return configError(`DB`)
    if (!env.SESSION_SECRET)
      return configError(`SESSION_SECRET`)
    if (!env.EMAIL_CODE_SECRET)
      return configError(`EMAIL_CODE_SECRET`)

    const body = await readJsonObject(request)
    const email = normalizeEmail(body.email)
    const password = normalizePassword(body.password)
    const code = typeof body.code === `string` ? body.code.trim() : ``

    const emailError = validateEmail(email)
    if (emailError)
      return jsonResponse({ ok: false, error: emailError }, { status: 400 })
    const passwordError = validatePassword(password)
    if (passwordError)
      return jsonResponse({ ok: false, error: passwordError }, { status: 400 })
    if (!/^\d{6}$/.test(code))
      return jsonResponse({ ok: false, error: `请输入 6 位验证码` }, { status: 400 })

    const existing = await getUserByEmail(env.DB, email)
    if (existing)
      return jsonResponse({ ok: false, error: `该邮箱已注册，请直接登录` }, { status: 409 })

    const codeResult = await consumeEmailCode(env.DB, {
      email,
      code,
      purpose: `register`,
      secret: env.EMAIL_CODE_SECRET,
    })
    if (!codeResult.ok)
      return jsonResponse({ ok: false, error: codeResult.error }, { status: 400 })

    const passwordHash = await hashPassword(password)
    const user = await createEmailUser(env.DB, { email, passwordHash })
    return authenticatedResponse(env, request, user)
  }

  if (path === `/api/auth/login` && request.method === `POST`) {
    if (!env.DB)
      return configError(`DB`)
    if (!env.SESSION_SECRET)
      return configError(`SESSION_SECRET`)

    const body = await readJsonObject(request)
    const email = normalizeEmail(body.email)
    const password = normalizePassword(body.password)

    const emailError = validateEmail(email)
    if (emailError)
      return jsonResponse({ ok: false, error: emailError }, { status: 400 })
    if (!password)
      return jsonResponse({ ok: false, error: `请输入密码` }, { status: 400 })

    const rl = await consumeRate(env.DB, `login_email`, email, 8, 10 * 60)
    if (!rl.allowed)
      return rateLimitedResponse(rl, `login_email`)

    const user = await getUserByEmail(env.DB, email)
    const passwordOk = user ? await verifyPassword(password, user.password_hash) : false
    if (!user || user.auth_provider !== `email` || !passwordOk)
      return jsonResponse({ ok: false, error: `邮箱或密码错误` }, { status: 401 })

    return authenticatedResponse(env, request, user)
  }

  if (path === `/api/auth/logout` && request.method === `POST`) {
    const headers = new Headers()
    headers.append(
      `Set-Cookie`,
      serializeCookie(SESSION_COOKIE, ``, cookieOpts(request, 0)),
    )
    return jsonResponse({ ok: true }, { headers })
  }

  return jsonResponse({ ok: false, error: `Not Found` }, { status: 404 })
}

/** Re-export for the chat proxy. */
export type { PublicUser, UserRecord }
