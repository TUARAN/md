import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { readFile, writeFile, mkdir, mkdtemp, rm, readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { DatabaseSync } from 'node:sqlite'
import ts from 'typescript'

const root = fileURLToPath(new URL('../', import.meta.url))
const output = await mkdtemp(path.join(tmpdir(), 'syncblog-platform-tests-'))
await writeFile(path.join(output, 'package.json'), '{"type":"module"}')
for (const name of ['platform', 'password', 'quota', 'rateLimit', 'user']) {
  const source = await readFile(path.join(root, `apps/web/worker/auth/${name}.ts`), 'utf8')
  const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText
    .replace(/from '(.\/[^']+)'/g, "from '$1.js'")
  await writeFile(path.join(output, `${name}.js`), compiled)
}
const draftSource = await readFile(path.join(root, 'apps/web/src/utils/draftTransfer.ts'), 'utf8')
await writeFile(path.join(output, 'draftTransfer.js'), ts.transpileModule(draftSource, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText)
const { handlePlatformAuth, resolvePlatformIdentity, resolvePlatformUser, publicProxyHeaders } = await import(pathToFileURL(path.join(output, 'platform.js')))
const { hashPassword } = await import(pathToFileURL(path.join(output, 'password.js')))
const { parseDraftBundle, mergeDrafts } = await import(pathToFileURL(path.join(output, 'draftTransfer.js')))
after(() => rm(output, { recursive: true, force: true }))

const migrationDir = path.join(root, 'apps/web/migrations')
const migrations = await Promise.all((await readdir(migrationDir)).filter(p => p.endsWith('.sql')).sort().map(p => readFile(path.join(migrationDir, p), 'utf8')))
function database() {
  const sqlite = new DatabaseSync(':memory:')
  for (const migration of migrations) sqlite.exec(migration)
  return {
    sqlite,
    prepare(sql) {
      const statement = sqlite.prepare(sql)
      let params = []
      return {
        bind(...values) { params = values; return this },
        async first() { return statement.get(...params) || null },
        async run() { return { meta: { changes: Number(statement.run(...params).changes) } } },
      }
    },
    async batch(statements) {
      sqlite.exec('BEGIN')
      try { const values = []; for (const s of statements) values.push(await s.run()); sqlite.exec('COMMIT'); return values }
      catch (error) { sqlite.exec('ROLLBACK'); throw error }
    },
  }
}
const host = 'https://syncblog.2aran.com'
function request(endpoint = '/api/auth/me', options = {}) {
  return new Request(host + endpoint, { ...options, headers: { cookie: 'tuaran_session=valid; syncblog_session=legacy; private_cookie=secret', origin: host, ...options.headers } })
}
function verifiedFetch(t, id = 'acct_one', extra = {}) {
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    assert.equal(url, 'https://2aran.com/api/subsites/session')
    assert.equal(init.headers.cookie, 'tuaran_session=valid')
    assert.equal(init.redirect, 'manual')
    assert.equal(init.cache, 'no-store')
    return Response.json({ version: 1, isGuest: false, user: { id, name: 'Test Reader' }, ...extra })
  })
}
async function call(db, req) { return handlePlatformAuth({ DB: db }, req, new URL(req.url)) }
async function seedLegacy(db) {
  const password = await hashPassword('correct-password')
  const expires = Math.floor(Date.now() / 1000) + 100000
  db.sqlite.prepare(`INSERT INTO users (id,email,password_hash,login,auth_provider,plan,ai_quota_used,ai_quota_reset_at,pro_expires_at,created_at,updated_at)
    VALUES ('legacy-id','legacy@example.com',?,'legacy','email','pro',7,?, ?,1,1)`).run(password, expires, expires)
  return { password, expires }
}

test('migration is additive and an unlinked verified user does not silently create or merge accounts', async t => {
  verifiedFetch(t)
  const db = database()
  await seedLegacy(db)
  const response = await call(db, request())
  assert.equal(response.status, 200)
  assert.equal((await response.json()).platform.needsSetup, true)
  assert.equal(db.sqlite.prepare('SELECT count(*) AS n FROM users').get().n, 1)
  await assert.rejects(resolvePlatformUser({ DB: db }, request()), error => error.status === 409)
})

test('explicit activation creates one credentialless workspace and repeated activation cannot replace it', async t => {
  verifiedFetch(t)
  const db = database()
  const response = await call(db, request('/api/auth/platform/activate', { method: 'POST' }))
  assert.equal(response.status, 200)
  const user = (await response.json()).user
  assert.equal(user.id, 'platform:acct_one')
  const stored = db.sqlite.prepare('SELECT * FROM users').get()
  assert.equal(stored.password_hash, null)
  assert.equal(stored.email, null)
  assert.equal((await call(db, request('/api/auth/platform/activate', { method: 'POST' }))).status, 409)
  assert.equal(db.sqlite.prepare('SELECT count(*) AS n FROM users').get().n, 1)
})

test('link requires original password, preserves user ID, paid expiry and quota, and cannot be stolen', async t => {
  verifiedFetch(t)
  const db = database()
  const { password, expires } = await seedLegacy(db)
  const link = pass => request('/api/auth/platform/link', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email: 'legacy@example.com', password: pass, userId: 'attacker' }) })
  assert.equal((await call(db, link('wrong'))).status, 401)
  assert.equal(db.sqlite.prepare('SELECT count(*) AS n FROM platform_account_links').get().n, 0)
  const response = await call(db, link('correct-password'))
  assert.equal(response.status, 200)
  assert.equal((await response.json()).user.plan, 'pro')
  const stored = db.sqlite.prepare('SELECT * FROM users WHERE id = ?').get('legacy-id')
  assert.equal(stored.password_hash, password)
  assert.equal(stored.pro_expires_at, expires)
  assert.equal(stored.ai_quota_used, 7)
  assert.equal((await resolvePlatformUser({ DB: db }, request())).id, 'legacy-id')
  t.mock.restoreAll()
  verifiedFetch(t, 'acct_other')
  assert.equal((await call(db, link('correct-password'))).status, 409)
  assert.equal(db.sqlite.prepare('SELECT count(*) AS n FROM platform_account_links').get().n, 1)
})

test('forged origin cannot create a link, and oversize link bodies are rejected', async t => {
  verifiedFetch(t)
  const db = database()
  await assert.rejects(call(db, request('/api/auth/platform/activate', { method: 'POST', headers: { origin: 'https://evil.2aran.com' } })), e => e.status === 403)
  await assert.rejects(call(db, request('/api/auth/platform/link', { method: 'POST', headers: { 'content-type': 'application/json' }, body: 'x'.repeat(4097) })), e => e.status === 413)
  assert.equal(db.sqlite.prepare('SELECT count(*) AS n FROM platform_account_links').get().n, 0)
})

test('failed, redirected, blocked and malformed canonical sessions never fall back to a legacy session', async t => {
  for (const response of [new Response(null, { status: 302, headers: { location: 'https://evil.test' } }), new Response(null, { status: 503 }), new Response(null, { status: 403 }), Response.json({ version: 1, isGuest: false, user: { id: 'guest:forged', name: 'bad' } })]) {
    t.mock.method(globalThis, 'fetch', async () => response)
    await assert.rejects(resolvePlatformIdentity(request()))
    t.mock.restoreAll()
  }
  t.mock.method(globalThis, 'fetch', () => { throw new Error('should not fetch') })
  assert.equal(await resolvePlatformIdentity(request('/api/auth/me', { headers: { cookie: 'syncblog_session=legacy' } })), null)
})

test('outbound public proxy headers never carry shared cookies, auth or internal identity', () => {
  const headers = publicProxyHeaders(request('/cgi-bin/test', { headers: { authorization: 'secret', 'x-user-id': 'admin', 'content-type': 'application/json', accept: 'application/json' } }))
  assert.deepEqual([...headers.keys()], ['accept', 'content-type'])
})

test('account linking is throttled and cannot be enabled through old local login routes', async t => {
  verifiedFetch(t)
  const db = database()
  await seedLegacy(db)
  for (let i = 0; i < 5; i++) {
    const response = await call(db, request('/api/auth/platform/link', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"email":"legacy@example.com","password":"wrong"}' }))
    assert.equal(response.status, 401)
  }
  assert.equal((await call(db, request('/api/auth/platform/activate', { method: 'POST' }))).status, 429)
  assert.equal((await call(db, request('/api/auth/register', { method: 'POST' }))).status, 410)
})

test('draft import strips unknown fields and merges without replacing existing drafts', () => {
  const first = { id: 'p1', title: 'First', content: 'saved', history: [], createDatetime: new Date(), updateDatetime: new Date() }
  const incoming = parseDraftBundle({ format: 'syncblog-drafts', version: 1, posts: [{ ...first, content: 'imported', apiKey: 'excluded' }] })
  assert.equal(incoming[0].apiKey, undefined)
  const merged = mergeDrafts([first], incoming)
  assert.equal(merged.length, 2)
  assert.equal(merged[0].content, 'saved')
  assert.notEqual(merged[0].id, merged[1].id)
  assert.equal(mergeDrafts(merged, incoming).length, 2)
  assert.throws(() => parseDraftBundle({ format: 'other', posts: [] }))
})
