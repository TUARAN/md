import type { PostAccount } from '@md/shared/types'

declare global {
  interface Window {
    /** 下载版 Syncblog 同步助手（TUARAN/cose）注入的页面桥接对象 */
    $cose?: PublishExtensionApi
  }
}

/** COSE 多平台同步任务载荷 */
export interface PublishExtensionTask {
  post: {
    title: string
    content: string
    markdown: string
    thumb: string
    desc: string
    /** 内容类型：opinion | article | booklet | project，缺省按 article 处理（插件 >= 1.1.0） */
    contentType?: string
    /** booklet / project 等链接帖的原始链接（插件 >= 1.1.0） */
    url?: string
  }
  accounts: PostAccount[]
}

export interface PublishExtensionContent {
  title?: string
  body?: string
  markdown?: string
  thumb?: string
  desc?: string
  contentType?: string
  url?: string
  wechatHtml?: string | null
}

export interface PublishExtensionSyncResult {
  success?: boolean
  message?: string
  error?: string
  tabId?: number
  [key: string]: unknown
}

/** Syncblog 同步助手沿用的 COSE 原生页面 API */
export interface PublishExtensionApi {
  getPlatforms?: () => PostAccount[]
  getAccounts?: (callback: (accounts: PostAccount[]) => void) => void
  getAccountsProgressive?: (
    onAccount: (account: PostAccount) => void,
    onDone: () => void,
  ) => void
  addTask?: (
    task: PublishExtensionTask,
    onProgress: (status: { accounts?: PostAccount[] }) => void,
    onDone: () => void,
  ) => void
  syncToPlatform?: (
    platformId: string,
    content: PublishExtensionContent,
  ) => Promise<PublishExtensionSyncResult>
}

/** 只使用下载版 Syncblog 同步助手的 COSE 协议，不再接入 CSDN/CSYNC 插件。 */
export function getPublishExtension(): PublishExtensionApi | undefined {
  return window.$cose
}
