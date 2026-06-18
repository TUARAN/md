import type { PostAccount } from '@md/shared/types'

interface SyncblogPluginPlatform {
  authenticated?: boolean
  disabled?: boolean
  error?: string
  extra?: Record<string, unknown>
  homepage?: string
  icon?: string
  id: string
  name: string
  supports?: string[]
  username?: string
}

interface SyncblogPluginTaskStatus {
  platforms?: Array<Partial<PostAccount> & { type: string }>
}

interface InstalledSyncblogPluginApi {
  connected: boolean
  getPlatforms: () => Promise<SyncblogPluginPlatform[]>
  syncArticle: (
    task: { post: PublishExtensionTask['post'], platforms: PostAccount[] },
    onProgress: (status: SyncblogPluginTaskStatus) => void,
  ) => Promise<unknown>
  version: string
}

declare global {
  interface Window {
    /** 由用户下载安装的 SyncBlog Plugin 注入的页面桥接对象 */
    $syncblogPlugin?: InstalledSyncblogPluginApi
  }
}

/** 多平台同步任务载荷 */
export interface PublishExtensionTask {
  post: {
    title: string
    content: string
    markdown: string
    thumb: string
    desc: string
  }
  accounts: PostAccount[]
}

/** Web 端使用的稳定发布接口，由下载版 SyncBlog Plugin 的原生协议适配而来 */
export interface PublishExtensionApi {
  getAccounts: (callback: (accounts: PostAccount[]) => void) => void
  addTask: (
    task: PublishExtensionTask,
    onProgress: (status: { accounts?: PostAccount[] }) => void,
    onDone: () => void,
  ) => void
}

function stringValue(value: unknown): string {
  return typeof value === `string` ? value : ``
}

function toPostAccount(platform: SyncblogPluginPlatform): PostAccount {
  return {
    avatar: stringValue(platform.extra?.avatar),
    checked: false,
    displayName: platform.username ?? ``,
    error: platform.error,
    home: platform.homepage ?? ``,
    icon: platform.icon ?? ``,
    loggedIn: platform.authenticated ?? false,
    supportTypes: platform.supports,
    title: platform.name,
    type: platform.id,
    uid: stringValue(platform.extra?.uid) || platform.id,
  }
}

function mergeTaskProgress(accounts: PostAccount[], status: SyncblogPluginTaskStatus): PostAccount[] {
  const updates = new Map((status.platforms ?? []).map(platform => [platform.type, platform]))
  return accounts.map((account) => {
    const update = updates.get(account.type)
    return update === undefined ? account : { ...account, ...update }
  })
}

/**
 * 只连接当前下载版 SyncBlog Plugin。
 * 不再探测或回退到历史 `$cose` 插件协议。
 */
export function getPublishExtension(): PublishExtensionApi | undefined {
  const plugin = window.$syncblogPlugin
  if (plugin === undefined || !plugin.connected)
    return undefined

  return {
    getAccounts(callback) {
      void plugin.getPlatforms()
        .then(platforms => callback(platforms.map(toPostAccount)))
        .catch(() => callback([]))
    },
    addTask(task, onProgress, onDone) {
      void plugin.syncArticle(
        { post: task.post, platforms: task.accounts },
        status => onProgress({ accounts: mergeTaskProgress(task.accounts, status) }),
      ).then(() => onDone()).catch((error: unknown) => {
        const message = error instanceof Error ? error.message : `SyncBlog Plugin 发布失败`
        onProgress({
          accounts: task.accounts.map(account => ({ ...account, status: `failed`, error: message })),
        })
        onDone()
      })
    },
  }
}
