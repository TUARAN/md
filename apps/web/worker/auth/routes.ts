/**
 * Auth route dispatch under /api/auth/*.
 *
 * Routes:
 *   GET  /api/auth/me              — current user (200 { user } | 200 { user: null })
 *   GET  /api/auth/github/start    — 302 to GitHub authorize
 *   GET  /api/auth/github/callback — exchange code → upsert → set session cookie → 302 returnTo
 *   POST /api/auth/logout          — clear session cookie
 */

import type { CookieOpts } from './cookies'
import type { PublicUser, UserRecord } from './types'
import {
  OAUTH_RETURN_TO_COOKIE,
  OAUTH_STATE_COOKIE,
  parseCookies,
  serializeCookie,
  SESSION_COOKIE,
} from './cookies'
import {
  buildAuthorizeUrl,
  exchangeCodeForToken,
  fetchGitHubProfile,
} from './github'
import { toPublicUser } from './quota'
import { consumeRate, getClientIp, rateLimitedResponse } from './rateLimit'
import {
  mintSession,
  randomToken,
  SESSION_TTL_SEC,
  verifySession,
} from './session'
import { getUserById, upsertUserFromGitHub } from './user'

export interface AuthEnv {
  DB?: D1Database
  SESSION_SECRET?: string
  GITHUB_CLIENT_ID?: string
  GITHUB_CLIENT_SECRET?: string
  /** Production: e.g. `https://syncblog.cn`. If absent, falls back to request origin. */
  OAUTH_REDIRECT_HOST?: string
}

const CALLBACK_PATH = `/api/auth/github/callback`

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

function resolveOrigin(env: AuthEnv, request: Request): string {
  if (env.OAUTH_REDIRECT_HOST)
    return env.OAUTH_REDIRECT_HOST.replace(/\/$/, ``)
  return new URL(request.url).origin
}

function isSecureRequest(request: Request): boolean {
  const forwardedProto = request.headers.get(`x-forwarded-proto`)
  return new URL(request.url).protocol === `https:` || forwardedProto === `https`
}

function cookieOpts(request: Request, maxAge: number): CookieOpts {
  return { maxAge, secure: isSecureRequest(request) }
}

function normalizeReturnTo(raw: string | null, origin: string): string {
  if (!raw)
    return `/`
  try {
    const target = new URL(raw, origin)
    if (target.origin !== origin)
      return `/`
    return `${target.pathname}${target.search}${target.hash}` || `/`
  }
  catch {
    return `/`
  }
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

  if (path === `/api/auth/github/start` && request.method === `GET`) {
    if (!env.GITHUB_CLIENT_ID)
      return configError(`GITHUB_CLIENT_ID`)

    // Throttle the OAuth flow per IP — prevents a flood that would burn
    // GitHub's per-IP authorize limit and leave the rest of our users
    // without a usable login button.
    if (env.DB) {
      const rl = await consumeRate(env.DB, `oauth_start`, getClientIp(request), 10, 60)
      if (!rl.allowed)
        return rateLimitedResponse(rl, `oauth_start`)
    }

    const state = randomToken()
    const origin = resolveOrigin(env, request)
    const redirectUri = `${origin}${CALLBACK_PATH}`
    const returnTo = normalizeReturnTo(url.searchParams.get(`returnTo`), origin)
    const authorizeUrl = buildAuthorizeUrl(env.GITHUB_CLIENT_ID, redirectUri, state)

    const headers = new Headers()
    headers.set(`Location`, authorizeUrl)
    headers.append(
      `Set-Cookie`,
      serializeCookie(OAUTH_STATE_COOKIE, state, cookieOpts(request, 600)),
    )
    headers.append(
      `Set-Cookie`,
      serializeCookie(OAUTH_RETURN_TO_COOKIE, returnTo, cookieOpts(request, 600)),
    )
    return new Response(null, { status: 302, headers })
  }

  if (path === CALLBACK_PATH && request.method === `GET`) {
    if (!env.DB)
      return configError(`DB`)
    if (!env.SESSION_SECRET)
      return configError(`SESSION_SECRET`)
    if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET)
      return configError(`GITHUB_CLIENT_ID/SECRET`)

    const code = url.searchParams.get(`code`)
    const stateParam = url.searchParams.get(`state`)
    const cookies = parseCookies(request.headers.get(`cookie`))
    const stateCookie = cookies[OAUTH_STATE_COOKIE]
    const origin = resolveOrigin(env, request)
    const returnTo = normalizeReturnTo(cookies[OAUTH_RETURN_TO_COOKIE] ?? `/`, origin)

    if (!code || !stateParam || !stateCookie || stateParam !== stateCookie) {
      return jsonResponse(
        { ok: false, error: `Invalid OAuth state` },
        { status: 400 },
      )
    }

    const redirectUri = `${origin}${CALLBACK_PATH}`

    try {
      const accessToken = await exchangeCodeForToken(
        env.GITHUB_CLIENT_ID,
        env.GITHUB_CLIENT_SECRET,
        code,
        redirectUri,
      )
      const profile = await fetchGitHubProfile(accessToken)
      const user = await upsertUserFromGitHub(env.DB, profile)
      const sessionToken = await mintSession(env.SESSION_SECRET, {
        sub: user.id,
        ghi: user.github_id,
      })

      const headers = new Headers()
      headers.set(`Location`, returnTo)
      headers.append(
        `Set-Cookie`,
        serializeCookie(SESSION_COOKIE, sessionToken, cookieOpts(request, SESSION_TTL_SEC)),
      )
      // Clear the one-shot state cookie.
      headers.append(
        `Set-Cookie`,
        serializeCookie(OAUTH_STATE_COOKIE, ``, cookieOpts(request, 0)),
      )
      headers.append(
        `Set-Cookie`,
        serializeCookie(OAUTH_RETURN_TO_COOKIE, ``, cookieOpts(request, 0)),
      )
      return new Response(null, { status: 302, headers })
    }
    catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return jsonResponse({ ok: false, error: message }, { status: 502 })
    }
  }

  if (path === `/api/auth/logout` && request.method === `POST`) {
    const headers = new Headers()
    headers.append(
      `Set-Cookie`,
      serializeCookie(SESSION_COOKIE, ``, cookieOpts(request, 0)),
    )
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: (() => {
        headers.set(`Content-Type`, `application/json; charset=utf-8`)
        return headers
      })(),
    })
  }

  return jsonResponse({ ok: false, error: `Not Found` }, { status: 404 })
}

/** Re-export for the chat proxy. */
export type { PublicUser, UserRecord }
