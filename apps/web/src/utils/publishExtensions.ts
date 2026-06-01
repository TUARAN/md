import type { PostAccount } from '@md/shared/types'

declare global {
  interface Window {
    /** SyncBlog 发布插件新版桥接对象 */
    $syncblogPlugin?: PublishExtensionApi
    /** 旧版 COSE / TUARAN fork 注入的桥接对象，保留兼容 */
    $cose?: CoseApi
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

/** SyncBlog 发布插件在页面注入的桥接 API；方法均为可选，按扩展版本而定 */
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
}

/** 兼容旧命名，避免一次性改动扩展协议导致发布链路中断 */
export type CoseTask = PublishExtensionTask
export type CoseApi = PublishExtensionApi

export function getPublishExtension(): PublishExtensionApi | undefined {
  return window.$syncblogPlugin ?? window.$cose
}
