/**
 * pluginDistribution —— 四个分发台（观点 / 文章 / 电子书 / 项目）共用的
 * SyncBlog 插件分发服务。
 *
 * 职责：
 * - md 平台 type → 插件平台 type 的别名归一（如 `x` → `twitter`）
 * - 按内容类型过滤插件账号（优先用插件声明的 `supportTypes`，
 *   旧版插件没有该字段时回退到标题关键词启发式）
 * - 组装 `addTask` 载荷（带 `contentType` / `url`，插件 >= 1.1.0）并回收
 *   逐平台成功 / 失败状态
 */
import type { PostAccount } from '@md/shared/types'
import { getPublishExtension } from '@/utils/publishExtensions'

export type DistributionContentType = `opinion` | `article` | `booklet` | `project`

export interface DistributionPost {
  title: string
  /** 正文（观点为原文，链接帖为「简介 + 链接」组装文本） */
  content: string
  markdown?: string
  desc?: string
  thumb?: string
  /** 链接帖（文章导入 / 小册 / 项目）的原始链接 */
  url?: string
}

export type PluginDistributionResult
  = | { status: `no-plugin` }
    | { status: `no-accounts`, unsupported: string[] }
    | { status: `done`, total: number, failed: PostAccount[], unsupported: string[] }

/** md 分发台平台命名与插件平台 type 不一致时的别名表 */
const PLUGIN_TYPE_ALIASES: Record<string, string> = {
  'x': `twitter`,
  // 观点台的细分入口 → 插件平台（插件按 contentType 路由到沸点 / 想法发布框）
  'juejin-pin': `juejin`,
  'zhihu-thought': `zhihu`,
}

/** 旧版插件（无 supportTypes）识别纯长文入口的标题关键词 */
const ARTICLE_ONLY_TITLE_MARKS = [`头条`, `articles`, `文章`, `专栏`]

export function toPluginType(type: string): string {
  const normalized = type.trim().toLowerCase()
  return PLUGIN_TYPE_ALIASES[normalized] ?? normalized
}

function supportsContentType(account: PostAccount, contentType: DistributionContentType): boolean {
  if (account.supportTypes?.length)
    return account.supportTypes.includes(contentType)
  // 旧版插件：全部平台视作长文入口，观点只排除明显的头条 / 专栏 / Articles 类
  if (contentType !== `opinion`)
    return true
  const label = `${account.title} ${account.displayName}`.toLowerCase()
  return !ARTICLE_ONLY_TITLE_MARKS.some(mark => label.includes(mark))
}

export interface ResolvedPluginAccounts {
  accounts: PostAccount[]
  /** 勾选了但插件覆盖不到（或不支持该内容类型）的 md 平台 type */
  unsupported: string[]
}

export function resolvePluginAccounts(
  types: string[],
  contentType: DistributionContentType,
  homeUrlOf?: (type: string) => string,
): ResolvedPluginAccounts {
  const publishExtension = getPublishExtension()
  const extensionPlatforms = publishExtension?.getPlatforms?.() ?? []
  const accountMap = new Map<string, PostAccount>()
  for (const account of extensionPlatforms) {
    const key = account.type.trim().toLowerCase()
    if (!accountMap.has(key))
      accountMap.set(key, account)
  }

  const accounts: PostAccount[] = []
  const unsupported: string[] = []
  for (const type of types) {
    const account = accountMap.get(toPluginType(type))
    if (!account || !supportsContentType(account, contentType)) {
      unsupported.push(type)
      continue
    }
    accounts.push({
      ...account,
      checked: true,
      home: account.home || homeUrlOf?.(type) || ``,
      displayName: account.displayName || account.title,
    })
  }
  return { accounts, unsupported }
}

/** 把「简介 + 链接」组装成链接帖正文（文章导入 / 小册 / 项目共用） */
export function buildLinkPostContent(post: { title?: string, summary?: string, url?: string }): { content: string, markdown: string } {
  const parts = [post.summary?.trim(), post.url?.trim()].filter(Boolean) as string[]
  const markdown = parts.join(`\n\n`)
  const content = parts
    .map(part => `<p>${part.replace(/</g, `&lt;`).replace(/>/g, `&gt;`)}</p>`)
    .join(``)
  return { content, markdown }
}

/** 从正文提炼标题（首个非空行，超长截断） */
export function buildTitleFromContent(raw: string, fallback = `未命名内容`): string {
  const firstLine = raw
    .split(/\r?\n/)
    .map(line => line.trim())
    .find(Boolean) || fallback
  const title = firstLine.replace(/\s+/g, ` `)
  return title.length > 36 ? `${title.slice(0, 36)}...` : title
}

export function buildDescFromContent(raw: string): string {
  return raw.replace(/\s+/g, ` `).trim().slice(0, 120)
}

/**
 * 广播分发意图（供未来的自动化监听方 / 埋点使用；插件本身走 addTask，
 * 不消费这条消息）
 */
export function postDistributionIntent(contentType: DistributionContentType, payload: Record<string, unknown>) {
  window.postMessage(
    { source: `ai-distribution-master`, type: `distribute-${contentType}`, payload },
    window.location.origin,
  )
}

/**
 * 通过 SyncBlog 插件把内容同步到所选平台。
 * 调用方根据返回值决定 toast 文案与「打开发布页」兜底。
 */
export async function distributeWithPlugin(options: {
  contentType: DistributionContentType
  post: DistributionPost
  platformTypes: string[]
  homeUrlOf?: (type: string) => string
}): Promise<PluginDistributionResult> {
  const { contentType, post, platformTypes, homeUrlOf } = options

  const publishExtension = getPublishExtension()
  if (typeof publishExtension?.addTask !== `function`)
    return { status: `no-plugin` }

  const { accounts, unsupported } = resolvePluginAccounts(platformTypes, contentType, homeUrlOf)
  if (accounts.length === 0)
    return { status: `no-accounts`, unsupported }

  const addTask = publishExtension.addTask.bind(publishExtension)
  let latestAccounts: PostAccount[] = accounts

  await new Promise<void>((resolve, reject) => {
    try {
      addTask(
        {
          post: {
            title: post.title,
            content: post.content,
            markdown: post.markdown ?? post.content,
            thumb: post.thumb ?? ``,
            desc: post.desc ?? ``,
            contentType,
            url: post.url ?? ``,
          },
          accounts,
        },
        (status) => {
          if (status.accounts)
            latestAccounts = status.accounts
        },
        () => resolve(),
      )
    }
    catch (e) {
      reject(e)
    }
  })

  return {
    status: `done`,
    total: accounts.length,
    failed: latestAccounts.filter(account => account.status === `failed`),
    unsupported,
  }
}
