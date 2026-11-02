export const SITE_URL = 'https://syncblog.2aran.com'
// Site identity is separate from the list of publishing targets.
export const ENTRY_MATCHES = ['https://2aran.com/*', 'https://www.2aran.com/*', 'https://admin.2aran.com/*']
export function detectSite(value) {
  try {
    const url = new URL(value)
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password)
      return null
    const names = {
      '2aran.com': '2aran 主站',
      'www.2aran.com': '2aran 主站',
      'admin.2aran.com': '2aran 站长后台',
      'syncblog.2aran.com': 'AI 分发大师创作台',
      'weekly.2aran.com': '前端周看',
      'rank.2aran.com': 'AI 排行榜',
      'bookmarks.2aran.com': '书签导航',
      'poemcn.2aran.com': '诗词',
      'workbuddy.2aran.com': 'WorkBuddy',
      'gptplus.2aran.com': 'GPT 充值服务',
      'ollama.2aran.com': 'Ollama',
      'ops.2aran.com': '运维中心',
    }
    const title = names[url.hostname]
    return title ? { id: url.hostname, title, floatingEntry: url.protocol === 'https:' && ['2aran.com', 'www.2aran.com', 'admin.2aran.com'].includes(url.hostname) } : null
  }
  catch { return null }
}
export const CONTENT_TYPES = [
  { id: 'opinion', title: '观点', description: '短观点与社区动态' },
  { id: 'article', title: '文章', description: '标题与 Markdown 长文' },
  { id: 'booklet', title: '电子书', description: '书籍介绍与阅读链接' },
  { id: 'project', title: '项目', description: '项目介绍与演示 / 仓库链接' },
]
const allTypes = CONTENT_TYPES.map(item => item.id)
export const PLATFORMS = [
  { id: 'twitter', title: 'X', hosts: ['x.com', 'twitter.com'], types: allTypes, short: 'https://x.com/compose/post', article: 'https://x.com/compose/articles/edit/' },
  { id: 'juejin', title: '掘金', hosts: ['juejin.cn'], types: allTypes, short: 'https://juejin.cn/pins/new', article: 'https://juejin.cn/editor/drafts/new?v=2' },
  { id: 'xiaohongshu', title: '小红书', hosts: ['xiaohongshu.com'], types: allTypes, short: 'https://creator.xiaohongshu.com/publish/publish?from=menu&target=article', article: 'https://creator.xiaohongshu.com/publish/publish?from=menu&target=article' },
  { id: 'zhihu', title: '知乎', hosts: ['zhihu.com'], types: allTypes, short: 'https://www.zhihu.com', article: 'https://zhuanlan.zhihu.com/write' },
  { id: 'weibo', title: '微博', hosts: ['weibo.com'], types: allTypes, short: 'https://weibo.com', article: 'https://card.weibo.com/article/v5/editor#/draft' },
  { id: 'wechat', title: '微信公众号', hosts: ['mp.weixin.qq.com'], types: ['article', 'booklet', 'project'], article: 'https://mp.weixin.qq.com' },
  { id: 'csdn', title: 'CSDN', hosts: ['csdn.net'], types: ['article', 'booklet', 'project'], article: 'https://editor.csdn.net/md/' },
  { id: 'segmentfault', title: '思否', hosts: ['segmentfault.com'], types: ['article', 'booklet', 'project'], article: 'https://segmentfault.com/write' },
  { id: 'cnblogs', title: '博客园', hosts: ['cnblogs.com'], types: ['article', 'booklet', 'project'], article: 'https://i.cnblogs.com/posts/edit' },
  { id: 'tencentcloud', title: '腾讯云开发者', hosts: ['cloud.tencent.com'], types: ['article', 'booklet', 'project'], article: 'https://cloud.tencent.com/developer/article/write' },
  { id: 'aliyun', title: '阿里云开发者', hosts: ['aliyun.com'], types: ['article', 'booklet', 'project'], article: 'https://developer.aliyun.com/article/new' },
  { id: 'huaweicloud', title: '华为云', hosts: ['huaweicloud.com'], types: ['article', 'booklet', 'project'], article: 'https://bbs.huaweicloud.com/blogs/article' },
]
export function detectPlatform(value) {
  try {
    const url = new URL(value)
    if (!['https:', 'http:'].includes(url.protocol))
      return null
    return PLATFORMS.find(p => p.hosts.some(host => url.hostname === host || url.hostname.endsWith(`.${host}`))) || null
  }
  catch { return null }
}
export function getCapability(platformId, contentType) {
  const p = PLATFORMS.find(p => p.id === platformId)
  if (!p || !p.types.includes(contentType))
    return { mode: 'unsupported', url: p?.article || SITE_URL, hint: '暂不支持此内容类型' }
  const social = contentType !== 'article' && !!p.short
  const markdownEditor = ['juejin', 'csdn', 'segmentfault', 'cnblogs'].includes(p.id)
  const mode = social || p.id === 'xiaohongshu' || markdownEditor ? 'fill' : 'manual'
  return { mode, url: social ? p.short : p.article, hint: mode === 'fill' ? '仅填写空白编辑器并检查内容；小红书为纯文字，图片需手动准备' : '打开平台入口，复制内容后手动排版；不会调用未验证的写入操作' }
}
export function normalizeDraft(input = {}) {
  const contentType = CONTENT_TYPES.some(t => t.id === input.contentType) ? input.contentType : 'opinion'
  const draft = {
    id: typeof input.id === 'string' ? input.id.slice(0, 100) : '',
    title: String(input.title || '').trim().slice(0, 200),
    content: String(input.content || '').trim(),
    contentType,
    url: String(input.url || '').trim(),
    updatedAt: Date.now(),
  }
  if (draft.content.length > 200000)
    throw new Error('正文不能超过 20 万字符')
  if (draft.url) {
    let url
    try { url = new URL(draft.url) }
    catch { throw new Error('请输入完整的 https:// 或 http:// 链接') }
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password)
      throw new Error('链接必须是无账号信息的 HTTP / HTTPS 地址')
    draft.url = url.href
  }
  return draft
}
export function validateDraft(input) {
  const draft = normalizeDraft(input)
  if (!draft.content)
    throw new Error('请先填写正文或介绍')
  if (draft.contentType !== 'opinion' && !draft.title)
    throw new Error('请填写标题或名称')
  if (['booklet', 'project'].includes(draft.contentType) && !draft.url)
    throw new Error('电子书和项目需要阅读 / 演示 / 仓库链接')
  return draft
}
export function buildText(input) {
  const d = normalizeDraft(input)
  return [d.contentType === 'opinion' ? '' : d.title, d.content, d.url && !d.content.includes(d.url) ? d.url : ''].filter(Boolean).join('\n\n')
}
export function escapeHtml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}
export function buildPayload(input) {
  const d = validateDraft(input)
  const markdown = [d.content, d.url && !d.content.includes(d.url) ? d.url : ''].filter(Boolean).join('\n\n')
  return { title: d.title || d.content.split('\n')[0].slice(0, 60), contentType: d.contentType, url: d.url, markdown, body: markdown.split(/\n{2,}/).map(p => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`).join(''), desc: d.content.slice(0, 120), thumb: '' }
}
export function validateSettings(input = {}) {
  const endpoint = String(input.endpoint || 'https://api.deepseek.com/chat/completions').trim()
  let url
  try { url = new URL(endpoint) }
  catch { throw new Error('模型服务地址无效') }
  if (url.protocol !== 'https:' || url.username || url.password || url.hash || url.search)
    throw new Error('模型服务需使用无查询参数的 HTTPS 地址')
  return { endpoint: url.href, model: String(input.model || '').trim().slice(0, 100), apiKey: String(input.apiKey || '').trim() }
}

export function preparationError(platformId, message = '') {
  const name = PLATFORMS.find(item => item.id === platformId)?.title || '平台'
  if (/error page|net::|ERR_/i.test(message))
    return { code: 'PAGE_UNAVAILABLE', message: `浏览器没有正常打开${name}页面。请先在该页面处理网络错误，能正常打开后再重试。` }
  if (/页面加载超时|navigation.*timeout|loading.*timed out/i.test(message))
    return { code: 'PAGE_TIMEOUT', message: `${name}页面加载超时。请确认已登录且页面正常打开，再重试此平台。` }
  if (/cannot access|permission/i.test(message))
    return { code: 'SITE_PERMISSION_REQUIRED', message: `插件暂时无法访问${name}页面。请检查浏览器中的此网站访问权限后重试。` }
  return { code: 'PREPARATION_FAILED', message: `${name}准备失败：${message || '请检查平台页面后重试。'}` }
}
