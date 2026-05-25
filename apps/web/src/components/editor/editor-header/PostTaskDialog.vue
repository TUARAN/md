<script setup lang="ts">
import type { Post, PostAccount } from '@md/shared/types'
import type { PluginSyncerTaskProgress } from '@/utils/publishExtensions'
import { RotateCw } from 'lucide-vue-next'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  dispatchPluginSyncerOpenPanel,
  partitionAccountsBySyncSource,
} from '@/utils/publishExtensions'

const props = defineProps<{
  post: Post
  open: boolean
}>()

const emit = defineEmits([`update:open`])

const dialogVisible = computed({
  get: () => props.open,
  set: value => emit(`update:open`, value),
})

const taskStatus = ref<any>(null)
const submitting = ref(false)

function accountKey(a: PostAccount) {
  return `${a.uid}-${a.displayName}-${a.type}`
}

const failedAccounts = computed<PostAccount[]>(() => {
  return (taskStatus.value?.accounts || []).filter((a: PostAccount) => a.status === `failed`)
})

const hasFailed = computed(() => failedAccounts.value.length > 0)

function applyPluginProgress(progress: PluginSyncerTaskProgress) {
  if (!taskStatus.value?.accounts)
    return
  const map = new Map(progress.platforms.map(p => [p.type, p]))
  taskStatus.value = {
    ...taskStatus.value,
    accounts: taskStatus.value.accounts.map((a: PostAccount) => {
      const u = map.get(a.type)
      if (!u || a.syncSource !== `plugin-syncer`)
        return a
      if (u.status === `failed`) {
        return {
          ...a,
          status: `failed`,
          error: u.error || `同步失败`,
        }
      }
      if (u.status === `done`) {
        return {
          ...a,
          status: `done`,
          editResp: u.editResp,
        }
      }
      return {
        ...a,
        status: `uploading`,
        msg: u.msg || `发布中`,
      }
    }),
  }
}

function markAccountsFailed(accounts: PostAccount[], message: string) {
  if (!taskStatus.value?.accounts)
    return
  const keys = new Set(accounts.map(accountKey))
  taskStatus.value = {
    ...taskStatus.value,
    accounts: taskStatus.value.accounts.map((a: PostAccount) =>
      keys.has(accountKey(a)) ? { ...a, status: `failed`, error: message } : a,
    ),
  }
}

async function runPluginSyncerPublish(accounts: PostAccount[]) {
  const api = window.$pluginSyncer
  if (!api) {
    markAccountsFailed(accounts, `未检测到 CSYNC 页面桥接（$pluginSyncer）。请从本站下载 CSYNC 扩展（.zip）解压加载，详见「发布」对话框说明。`)
    return
  }

  if (typeof api.syncArticle === `function`) {
    try {
      await api.syncArticle(
        {
          post: {
            title: props.post.title,
            content: props.post.content,
            markdown: props.post.markdown,
            thumb: props.post.thumb,
          },
          platforms: accounts.map(a => ({ type: a.type, title: a.title })),
        },
        task => applyPluginProgress(task),
      )
    }
    catch (e) {
      markAccountsFailed(accounts, e instanceof Error ? e.message : `CSYNC 发布失败`)
    }
    return
  }

  dispatchPluginSyncerOpenPanel(props.post)
  markAccountsFailed(
    accounts,
    `当前 CSYNC 未暴露 syncArticle：已尝试打开侧栏；请从本站重新下载 CSYNC（.zip）解压加载扩展后重试。`,
  )
}

async function startPost(targetAccounts?: PostAccount[]) {
  if (!props.post)
    return

  const accountsToPost = targetAccounts ?? props.post.accounts.filter(a => a.checked)
  if (accountsToPost.length === 0)
    return

  const { pluginSyncer, cose } = partitionAccountsBySyncSource(accountsToPost)

  taskStatus.value = {
    accounts: accountsToPost.map((a) => {
      const base = {
        ...a,
        status: `uploading`,
        msg:
          a.syncSource === `plugin-syncer`
            ? `CSYNC…`
            : `COSE…`,
      }
      return base
    }),
  }

  submitting.value = true

  try {
    if (pluginSyncer.length > 0)
      await runPluginSyncerPublish(pluginSyncer)

    if (cose.length > 0) {
      const coseApi = window.$cose
      if (typeof coseApi?.addTask !== `function`) {
        markAccountsFailed(cose, `未安装 COSE 扩展，无法同步所选平台。`)
      }
      else {
        // 在窄化仍生效处先取出已绑定的方法，供下方 Promise 闭包调用
        const addTask = coseApi.addTask.bind(coseApi)
        const taskData = {
          post: {
            title: props.post.title,
            content: props.post.content,
            markdown: props.post.markdown,
            thumb: props.post.thumb,
            desc: props.post.desc,
          },
          accounts: cose,
        }

        const onProgress = (newStatus: any) => {
          const updatedMap = new Map(
            (newStatus.accounts || []).map((x: PostAccount) => [accountKey(x), x]),
          )
          if (!taskStatus.value?.accounts)
            return
          taskStatus.value = {
            ...taskStatus.value,
            ...newStatus,
            accounts: taskStatus.value.accounts.map((a: PostAccount) => {
              if (a.syncSource === `plugin-syncer`)
                return a
              return updatedMap.get(accountKey(a)) ?? a
            }),
          }
        }

        await new Promise<void>((resolve, reject) => {
          try {
            addTask(taskData, onProgress, () => resolve())
          }
          catch (e) {
            reject(e)
          }
        }).catch((e: unknown) => {
          markAccountsFailed(cose, e instanceof Error ? e.message : `COSE 发布失败`)
        })
      }
    }
  }
  finally {
    submitting.value = false
  }
}

function retryAccount(account: PostAccount) {
  account.status = `uploading`
  account.error = ``
  void startPost([account])
}

function retryAllFailed() {
  if (failedAccounts.value.length === 0)
    return
  const targets = [...failedAccounts.value]
  for (const a of targets) {
    a.status = `uploading`
    a.error = ``
  }
  void startPost(targets)
}

watch(() => props.open, (newVal) => {
  if (newVal) {
    taskStatus.value = null
    void startPost()
  }
})
</script>

<template>
  <Dialog v-model:open="dialogVisible">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>提交发布任务</DialogTitle>
        <DialogDescription>
          任务会先处理列表中标注 (CSYNC) 的平台（CSYNC 扩展），再处理其余平台（COSE）。进度与草稿链接按平台单独展示；失败可单条重试。
        </DialogDescription>
      </DialogHeader>

      <div class="mt-4">
        <div v-if="!taskStatus" class="py-4 text-center">
          等待发布..
        </div>
        <div v-else class="max-h-[400px] flex flex-col overflow-y-auto">
          <div
            v-for="account in taskStatus?.accounts"
            :key="`${account.syncSource || 'cose'}-${account.type}-${account.uid}`"
            class="border-b py-4 last:border-b-0"
          >
            <div class="mb-2 flex items-center gap-2">
              <img
                v-if="account.icon"
                :src="account.icon"
                class="object-cover h-5 w-5"
                alt=""
              >
              <span>{{ account.title }} - {{ account.displayName || account.home }}</span>
              <span v-if="account.syncSource === 'plugin-syncer'" class="text-xs text-muted-foreground">(CSYNC)</span>
            </div>
            <div
              class="w-full flex-1 gap-2 overflow-auto pl-7 text-sm" :class="{
                'text-yellow-600': account.status === 'uploading',
                'text-red-600': account.status === 'failed',
                'text-green-600': account.status === 'done',
              }"
            >
              <template v-if="account.status === 'uploading'">
                {{ account.msg || '发布中' }}
              </template>

              <template v-if="account.status === 'failed'">
                <div class="flex items-start justify-between gap-2">
                  <span class="flex-1">同步失败, 错误内容：{{ account.error }}</span>
                  <button
                    type="button"
                    class="shrink-0 inline-flex items-center gap-1 rounded border border-red-300 px-2 py-0.5 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    :disabled="submitting"
                    @click="retryAccount(account)"
                  >
                    <RotateCw class="h-3 w-3" />
                    重试
                  </button>
                </div>
              </template>

              <template v-if="account.status === 'done' && account.editResp">
                同步成功
                <a
                  v-if="account.type !== 'wordpress' && account.editResp"
                  :href="account.editResp.draftLink"
                  class="ml-2 text-blue-500 hover:underline"
                  referrerPolicy="no-referrer"
                  target="_blank"
                >查看草稿</a>
              </template>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter v-if="hasFailed">
        <Button
          variant="outline"
          :disabled="submitting"
          @click="retryAllFailed"
        >
          <RotateCw class="mr-2 h-4 w-4" />
          重试全部失败 ({{ failedAccounts.length }})
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
.account-item {
  margin-bottom: 1rem;
}
</style>
