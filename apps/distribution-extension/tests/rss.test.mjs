/* eslint test/no-import-node-test: off */
import assert from 'node:assert/strict'
import test from 'node:test'
import { loadRssPicks, normalizeRssItems } from '../master/rss.js'

test('RSS normalization rejects unsafe links and orders newest first', () => {
  const items = normalizeRssItems({ items: [
    { title: 'unsafe', links: { original: 'javascript:alert(1)' } },
    { title: 'old', links: { original: 'https://example.com/1' }, publishedAt: '2026-11-01' },
    { title: 'new', links: { original: 'https://example.com/2' }, publishedAt: '2026-11-02' },
  ] }, 'ai-hot')
  assert.deepEqual(items.map(item => item.title), ['new', 'old'])
})
test('loads the homepage sources, interleaves them and omits credentials', async () => {
  const result = await loadRssPicks(async (url, options) => {
    assert.equal(options.credentials, 'omit')
    return { ok: true, json: async () => url.includes('aihot.news')
      ? { items: [{ title: 'AI', links: { original: 'https://example.com/ai' } }] }
      : { entries: [{ title: 'weekly', link: 'https://example.com/weekly', publishedAt: 123 }] } }
  })
  assert.deepEqual(result.items.map(item => item.source), ['ai-hot', 'ruanyifeng'])
  assert.deepEqual(result.failedSources, [])
})
test('partial and total outages are retryable and never fabricate content', async () => {
  const partial = await loadRssPicks(async (url) => {
    if (url.includes('aihot.news'))
      throw new Error('offline')
    return { ok: true, json: async () => ({ entries: [{ title: 'weekly', link: 'https://example.com/weekly' }] }) }
  })
  assert.equal(partial.items.length, 1)
  assert.deepEqual(partial.failedSources, ['AI HOT'])
  const failed = await loadRssPicks(async () => ({ ok: false, status: 503 }))
  assert.equal(failed.items.length, 0)
  assert.equal(failed.failedSources.length, 2)
})
