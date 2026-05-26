import type { PostAccount } from '@md/shared/types'

declare global {
  interface Window {
    /** COSE「文章同步助手」扩展在页面注入的桥接对象 */
    $cose?: CoseApi
  }
}

/** COSE 同步任务载荷 */
export interface CoseTask {
  post: {
    title: string
    content: string
    markdown: string
    thumb: string
    desc: string
  }
  accounts: PostAccount[]
}

/** COSE「文章同步助手」在页面注入的桥接 API；方法均为可选，按扩展版本而定 */
export interface CoseApi {
  getPlatforms?: () => PostAccount[]
  getAccounts?: (callback: (accounts: PostAccount[]) => void) => void
  getAccountsProgressive?: (
    onAccount: (account: PostAccount) => void,
    onDone: () => void,
  ) => void
  addTask?: (
    task: CoseTask,
    onProgress: (status: { accounts?: PostAccount[] }) => void,
    onDone: () => void,
  ) => void
}
