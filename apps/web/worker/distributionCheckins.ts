import type { AuthEnv } from './auth/routes'
import { resolveCurrentUser } from './auth/routes'

interface DistributionCheckinEnv extends AuthEnv {
  DB?: D1Database
}

interface CheckinRow {
  item_id: string
  done: number
}

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers)
  headers.set(`Content-Type`, `application/json; charset=utf-8`)
  headers.set(`Cache-Control`, `no-store`)
  return new Response(JSON.stringify(body), { ...init, headers })
}

function cleanToken(value: string | null, fallback = ``): string {
  return (value ?? fallback).trim().toLowerCase().replace(/[^a-z0-9_-]/g, ``).slice(0, 64)
}

function cleanDate(value: string | null): string {
  const v = (value ?? ``).trim()
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : ``
}

function parseBody(body: unknown): { itemId: string, done: boolean } | null {
  if (!body || typeof body !== `object`)
    return null
  const input = body as { itemId?: unknown, done?: unknown }
  if (typeof input.itemId !== `string` || typeof input.done !== `boolean`)
    return null
  const itemId = cleanToken(input.itemId)
  if (!itemId)
    return null
  return { itemId, done: input.done }
}

export async function handleDistributionCheckinsApi(
  env: DistributionCheckinEnv,
  request: Request,
  url: URL,
): Promise<Response> {
  if (request.method !== `GET` && request.method !== `PUT`) {
    return jsonResponse({ ok: false, error: `Method Not Allowed` }, { status: 405 })
  }

  if (!env.DB)
    return jsonResponse({ ok: false, error: `DB not configured` }, { status: 503 })

  const user = await resolveCurrentUser(env, request)
  if (!user)
    return jsonResponse({ ok: false, error: `Unauthenticated` }, { status: 401 })

  const creatorId = cleanToken(url.searchParams.get(`creatorId`), `tuaran`)
  const platformType = cleanToken(url.searchParams.get(`platformType`))
  const checkinDate = cleanDate(url.searchParams.get(`date`))

  if (!creatorId || !platformType || !checkinDate) {
    return jsonResponse(
      { ok: false, error: `Missing creatorId, platformType, or date` },
      { status: 400 },
    )
  }

  if (request.method === `GET`) {
    const rows = await env.DB
      .prepare(
        `SELECT item_id, done
         FROM distribution_checkins
         WHERE user_id = ? AND creator_id = ? AND platform_type = ? AND checkin_date = ?`,
      )
      .bind(user.id, creatorId, platformType, checkinDate)
      .all<CheckinRow>()

    const checkins: Record<string, boolean> = {}
    for (const row of rows.results ?? [])
      checkins[row.item_id] = row.done === 1

    return jsonResponse({ ok: true, checkins })
  }

  let parsed: { itemId: string, done: boolean } | null = null
  try {
    parsed = parseBody(await request.json())
  }
  catch {}

  if (!parsed)
    return jsonResponse({ ok: false, error: `Invalid body` }, { status: 400 })

  const now = Math.floor(Date.now() / 1000)
  const id = `${user.id}:${creatorId}:${platformType}:${checkinDate}:${parsed.itemId}`

  await env.DB
    .prepare(
      `INSERT INTO distribution_checkins
        (id, user_id, creator_id, platform_type, checkin_date, item_id, done, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, creator_id, platform_type, checkin_date, item_id)
       DO UPDATE SET done = excluded.done, updated_at = excluded.updated_at`,
    )
    .bind(
      id,
      user.id,
      creatorId,
      platformType,
      checkinDate,
      parsed.itemId,
      parsed.done ? 1 : 0,
      now,
      now,
    )
    .run()

  return jsonResponse({ ok: true, itemId: parsed.itemId, done: parsed.done })
}
