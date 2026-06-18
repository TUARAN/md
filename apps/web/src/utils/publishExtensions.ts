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
  }
  accounts: PostAccount[]
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
}

/** 只使用下载版 Syncblog 同步助手的 COSE 协议，不再接入 CSDN/CSYNC 插件。 */
export function getPublishExtension(): PublishExtensionApi | undefined {
  return window.$cose
}
