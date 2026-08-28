import type { Post } from '@/types/post'

export function parseDraftBundle(input: unknown): Post[] {
  if (!input || typeof input !== 'object')
    throw new Error('草稿文件格式不正确')
  const bundle = input as { format?: unknown, version?: unknown, posts?: unknown }
  if (bundle.format !== 'syncblog-drafts' || bundle.version !== 1 || !Array.isArray(bundle.posts)
    || bundle.posts.length > 1000) {
    throw new Error('不支持的草稿文件')
  }
  const ids = new Set<string>()
  return bundle.posts.map((value: unknown) => {
    if (!value || typeof value !== 'object')
      throw new Error('草稿格式不正确')
    const post = value as Record<string, unknown>
    if (typeof post.id !== 'string' || !post.id || post.id.length > 200 || ids.has(post.id)
      || typeof post.title !== 'string' || post.title.length > 2000 || typeof post.content !== 'string'
      || post.content.length > 5_000_000) {
      throw new Error('草稿内容或编号不正确')
    }
    ids.add(post.id)
    return {
      id: post.id,
      title: post.title,
      content: post.content,
      history: Array.isArray(post.history)
        ? post.history.filter(h => h && typeof h.datetime === 'string' && typeof h.content === 'string').slice(-100).map(h => ({ datetime: h.datetime, content: h.content }))
        : [],
      createDatetime: new Date(typeof post.createDatetime === 'string' ? post.createDatetime : Date.now()),
      updateDatetime: new Date(),
      parentId: typeof post.parentId === 'string' ? post.parentId : null,
    }
  })
}

export function mergeDrafts(existing: Post[], incoming: Post[]): Post[] {
  const ids = new Map<string, string>()
  const added: Post[] = []
  for (const post of incoming) {
    const same = existing.find(p => p.title === post.title && p.content === post.content)
    if (same) { ids.set(post.id, same.id); continue }
    const id = existing.some(p => p.id === post.id) ? crypto.randomUUID() : post.id
    ids.set(post.id, id)
    added.push({ ...post, id })
  }
  return [...existing, ...added.map(p => ({ ...p, parentId: p.parentId ? ids.get(p.parentId) || null : null }))]
}
