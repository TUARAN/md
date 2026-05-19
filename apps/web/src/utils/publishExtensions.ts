import type { Post, PostAccount } from '@md/shared/types'

/** 知乎、公众号、微博优先走 CSYNC（$pluginSyncer），其余走 COSE */
export const PLUGIN_SYNCER_PREFERRED_TYPES = new Set([`zhihu`, `wechat`, `weibo`])

export type PostAccountSyncSource = `cose` | `plugin-syncer`

declare global {
  interface Window {
    /** CSYNC 等在页面注入的桥接对象（需扩展在本页加载 content script 才能 connected） */
    $pluginSyncer?: PluginSyncerApi
  }
}

export interface PluginSyncerApi {
  version: string
  readonly connected: boolean
  getPlatforms: () => Promise<unknown>
  syncArticle?: (task: PluginSyncerTask, onProgress?: (task: PluginSyncerTaskProgress) => void) => Promise<unknown>
  openSyncPanel?: (article: Record<string, unknown>) => Promise<unknown>
}

export interface PluginSyncerTask {
  post: {
    title: string
    content: string
    markdown: string
    thumb: string
  }
  platforms: { type: string, title: string }[]
}

export interface PluginSyncerTaskProgress {
  platforms: Array<{
    type: string
    title?: string
    status: string
    error?: string
    msg?: string
    editResp?: { draftLink?: string }
  }>
}

export function normalizePluginSyncerGetPlatformsResult(data: unknown): unknown[] {
  if (Array.isArray(data))
    return data
  if (data && typeof data === `object`) {
    const o = data as Record<string, unknown>
    if (Array.isArray(o.platforms))
      return o.platforms
    if (Array.isArray(o.data))
      return o.data
  }
  return []
}

export function mapPluginSyncerAuthToAccounts(data: unknown): PostAccount[] {
  const rows = normalizePluginSyncerGetPlatformsResult(data) as Record<string, unknown>[]
  const out: PostAccount[] = []
  for (const row of rows) {
    if (!row || typeof row !== `object`)
      continue
    const meta = row.meta as Record<string, unknown> | undefined
    const id = String(row.id ?? row.platformId ?? meta?.id ?? ``).trim()
    if (!id)
      continue
    const name = String(row.name ?? meta?.name ?? id)
    const icon = String(row.icon ?? meta?.icon ?? ``)
    const home = String(row.homepage ?? row.home ?? ``)
    const auth = row.authenticated === true
    const u = (row.userInfo ?? {}) as Record<string, unknown>
    const displayName = auth ? String(u.name ?? u.nick ?? `已登录`) : `未登录`
    const uid = String(u.id ?? u.weiboId ?? `${id}-plugin`)
    const avatar = u.avatar as string | undefined
    out.push({
      type: id,
      title: name,
      icon: icon || `data:image/gif;base64,R0lGODlhAQABAAAAACw=`,
      home,
      uid,
      displayName,
      avatar,
      checked: false,
      loggedIn: auth,
      isChecking: false,
      syncSource: `plugin-syncer`,
    })
  }
  return out
}

export function mergeCoseAndPluginSyncerAccounts(
  coseRows: PostAccount[],
  pluginRows: PostAccount[],
  channelReady: boolean,
): PostAccount[] {
  if (!channelReady || pluginRows.length === 0)
    return coseRows.map(a => ({ ...a, syncSource: (a.syncSource ?? `cose`) as PostAccountSyncSource }))

  const pluginByType = new Map(pluginRows.map(p => [p.type, p]))
  const usedPlugin = new Set<string>()
  const result: PostAccount[] = []

  for (const c of coseRows) {
    const plug = pluginByType.get(c.type)
    if (plug && PLUGIN_SYNCER_PREFERRED_TYPES.has(c.type) && plug.loggedIn) {
      result.push({
        ...plug,
        checked: c.checked,
        isChecking: false,
        syncSource: `plugin-syncer`,
      })
      usedPlugin.add(c.type)
    }
    else {
      result.push({ ...c, syncSource: `cose` })
    }
  }

  for (const plug of pluginRows) {
    if (!usedPlugin.has(plug.type) && plug.loggedIn && !result.some(r => r.type === plug.type)) {
      result.push({ ...plug, syncSource: `plugin-syncer` })
    }
  }

  return result
}

export function dispatchPluginSyncerOpenPanel(post: Pick<Post, `title` | `content` | `markdown` | `thumb` | `desc`>) {
  window.dispatchEvent(new CustomEvent(`plugin-syncer-open-panel`, {
    detail: {
      title: post.title,
      html: post.content,
      cover: post.thumb,
      markdown: post.markdown,
      summary: post.desc,
    },
  }))
}

export function partitionAccountsBySyncSource(accounts: PostAccount[]): {
  pluginSyncer: PostAccount[]
  cose: PostAccount[]
} {
  const pluginSyncer = accounts.filter(
    a => a.syncSource === `plugin-syncer` && PLUGIN_SYNCER_PREFERRED_TYPES.has(a.type),
  )
  const cose = accounts.filter(
    a => !(a.syncSource === `plugin-syncer` && PLUGIN_SYNCER_PREFERRED_TYPES.has(a.type)),
  )
  return { pluginSyncer, cose }
}
