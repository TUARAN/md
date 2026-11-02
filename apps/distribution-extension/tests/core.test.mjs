/* eslint test/no-import-node-test: off */
import assert from 'node:assert/strict'
import test from 'node:test'
import { buildPayload, buildText, CONTENT_TYPES, detectPlatform, detectSite, getCapability, normalizeDraft, PLATFORMS, SITE_URL, validateDraft, validateSettings } from '../master/core.js'

test('site detection matches real domains, rejects lookalikes and non-web URLs', () => {
  assert.equal(SITE_URL, 'https://syncblog.2aran.com')
  assert.equal(detectPlatform('https://creator.xiaohongshu.com/publish').id, 'xiaohongshu')
  assert.equal(detectPlatform('https://x.com/home').id, 'twitter')
  assert.equal(detectPlatform('https://x.com.evil.test'), null)
  assert.equal(detectPlatform('https://notjuejin.cn'), null)
  assert.equal(detectPlatform('javascript:alert(1)'), null)
  assert.equal(detectPlatform('invalid'), null)
})
test('all platform/type combinations declare real capability and HTTPS route', () => {
  for (const p of PLATFORMS) {
    for (const t of CONTENT_TYPES) {
      const c = getCapability(p.id, t.id)
      assert.equal(c.mode !== 'unsupported', p.types.includes(t.id))
      assert.match(c.url, /^https:\/\//)
      if (c.mode !== 'unsupported')
        assert.equal(detectPlatform(c.url).id, p.id)
    }
  }
  assert.equal(getCapability('twitter', 'opinion').mode, 'fill')
  assert.equal(getCapability('twitter', 'project').url, 'https://x.com/compose/post')
  assert.equal(getCapability('juejin', 'opinion').url, 'https://juejin.cn/pin')
  assert.equal(getCapability('juejin', 'article').mode, 'fill')
  assert.equal(getCapability('csdn', 'opinion').mode, 'unsupported')
  assert.equal(getCapability('wechat', 'article').mode, 'manual')
  assert.equal(getCapability('twitter', 'article').mode, 'manual')
})
test('book and project require a title, introduction and safe original link', () => {
  for (const contentType of ['booklet', 'project']) {
    const draft = { contentType, title: '示例', content: '介绍' }
    assert.throws(() => validateDraft(draft), /需要/)
    assert.throws(() => validateDraft({ ...draft, url: 'javascript:alert(1)' }), /HTTP/)
    assert.throws(() => validateDraft({ ...draft, url: 'https://user:pass@example.com' }), /账号/)
    const link = 'https://example.com/book?a=1&b=2'
    const result = buildPayload({ ...draft, url: link })
    assert.equal(result.url, link)
    assert.equal(result.contentType, contentType)
    assert.match(result.markdown, /介绍\n\nhttps:/)
    assert.ok(buildText({ ...draft, url: link }).startsWith('示例\n\n介绍'))
    assert.equal(buildText({ ...draft, content: `介绍 ${link}`, url: link }).split(link).length, 2)
  }
})
test('HTML payload escapes untrusted text while retaining markdown as text', () => {
  const p = buildPayload({ contentType: 'opinion', content: '<script>alert("x")</script> & hello\nworld' })
  assert.ok(!p.body.includes('<script>'))
  assert.match(p.body, /&lt;script&gt;/)
  assert.match(p.body, /&amp;/)
  assert.match(p.body, /<br>/)
  assert.equal(p.markdown, '<script>alert("x")</script> & hello\nworld')
})
test('empty local drafts may be normalized, but distribution rejects empty content', () => {
  assert.equal(normalizeDraft({ title: '稍后写' }).title, '稍后写')
  assert.throws(() => validateDraft({}), /正文/)
  assert.throws(() => validateDraft({ contentType: 'article', content: '正文' }), /标题/)
  assert.throws(() => normalizeDraft({ content: 'x'.repeat(200001) }), /20 万/)
})
test('AI endpoints require HTTPS and forbid URL credentials/query/hash', () => {
  assert.equal(validateSettings({ endpoint: 'https://api.example.com/v1/chat/completions', model: ' test ' }).model, 'test')
  for (const endpoint of ['http://api.example.com', 'https://key@api.example.com', 'https://api.example.com?key=abc', 'https://api.example.com/#secret']) assert.throws(() => validateSettings({ endpoint }))
})

test('owned site identity is recognized without becoming a publication target', () => {
  assert.equal(detectSite('https://2aran.com/articles/hello').title, '2aran 主站')
  assert.equal(detectSite('https://admin.2aran.com/admin/community-actions/monitor').title, '2aran 站长后台')
  assert.equal(detectSite('https://syncblog.2aran.com/').title, 'AI 分发大师创作台')
  for (const host of ['2aran.com', 'www.2aran.com', 'admin.2aran.com']) assert.equal(detectSite(`https://${host}/`).floatingEntry, true)
  for (const value of ['https://2aran.com.evil.test/', 'https://not2aran.com/', 'https://2aran.com@evil.test', 'javascript:alert(1)', 'chrome://extensions/']) assert.equal(detectSite(value), null)
  assert.equal(detectSite('http://admin.2aran.com/').floatingEntry, false)
  assert.equal(detectSite('https://syncblog.2aran.com/').floatingEntry, false)
  for (const host of ['2aran.com', 'admin.2aran.com', 'syncblog.2aran.com']) assert.equal(detectPlatform(`https://${host}/`), null)
  for (const value of ['https://x.com/home', 'https://juejin.cn/', 'https://creator.xiaohongshu.com/']) assert.equal(detectSite(value), null)
})
