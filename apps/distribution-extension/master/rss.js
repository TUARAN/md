export const RSS_SOURCES = [
  { id: 'ai-hot', label: 'AI HOT', url: 'https://aihot.news/api/v1/items?mode=selected&window=7d&limit=20' },
  { id: 'ruanyifeng', label: '阮一峰', url: 'https://2aran.com/api/rss-fetch?id=ruanyifeng' },
]

export function normalizeRssItems(data, source) {
  const items = source === 'ai-hot' ? data.items : data.entries
  if (!Array.isArray(items))
    throw new Error('资讯数据格式有误')
  return items.map(item => ({
    source,
    title: String(item.title || ''),
    summary: String(item.summary || ''),
    url: source === 'ai-hot' ? item.links?.original : item.link,
    publishedAt: source === 'ai-hot' ? Date.parse(item.publishedAt) || 0 : Number(item.publishedAt) || 0,
  })).filter(item => /^https?:\/\//i.test(item.url || '') && item.title).sort((a, b) => b.publishedAt - a.publishedAt)
}

export async function loadRssPicks(fetcher = fetch) {
  const results = await Promise.allSettled(RSS_SOURCES.map(async (source) => {
    const response = await fetcher(source.url, { credentials: 'omit', signal: AbortSignal.timeout(15000) })
    if (!response.ok)
      throw new Error(`HTTP ${response.status}`)
    return normalizeRssItems(await response.json(), source.id)
  }))
  const feeds = results.map(result => result.status === 'fulfilled' ? result.value : [])
  const items = []
  for (let index = 0; index < Math.max(...feeds.map(feed => feed.length)); index++) {
    for (const feed of feeds) {
      if (feed[index])
        items.push(feed[index])
    }
  }
  return { items, failedSources: RSS_SOURCES.filter((_, index) => results[index].status === 'rejected').map(source => source.label) }
}
