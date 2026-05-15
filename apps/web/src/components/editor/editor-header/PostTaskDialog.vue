<script setup lang="ts">
import type { Post, PostAccount } from '@md/shared/types'
import { RotateCw } from 'lucide-vue-next'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

declare global {
  interface Window {
    $cose: any
  }
}

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
  return `${a.uid}-${a.displayName}`
}

const failedAccounts = computed<PostAccount[]>(() => {
  return (taskStatus.value?.accounts || []).filter((a: PostAccount) => a.status === `failed`)
})

const hasFailed = computed(() => failedAccounts.value.length > 0)

function startPost(targetAccounts?: PostAccount[]) {
  if (!props.post)
    return

  const accountsToPost = targetAccounts ?? props.post.accounts.filter(a => a.checked)
  if (accountsToPost.length === 0)
    return

  const taskData = {
    post: {
      title: props.post.title,
      content: props.post.content,
      markdown: props.post.markdown,
      thumb: props.post.thumb,
      desc: props.post.desc,
    },
    accounts: accountsToPost,
  }

  const isRetry = !!targetAccounts

  const onProgress = (newStatus: any) => {
    if (!isRetry || !taskStatus.value) {
      taskStatus.value = newStatus
      return
    }
    // 重试时保留旧账号状态，只用新结果覆盖参与本次重试的账号
    const updatedMap = new Map<string, PostAccount>()
    for (const a of (newStatus.accounts || [])) {
      updatedMap.set(accountKey(a), a)
    }
    taskStatus.value = {
      ...taskStatus.value,
      ...newStatus,
      accounts: taskStatus.value.accounts.map((a: PostAccount) => {
        return updatedMap.get(accountKey(a)) ?? a
      }),
    }
  }

  const onComplete = () => {
    submitting.value = false
  }

  submitting.value = true
  try {
    window.$cose?.addTask(taskData, onProgress, onComplete)
  }
  catch (error) {
    console.error(`发布失败:`, error)
    submitting.value = false
  }
}

function retryAccount(account: PostAccount) {
  account.status = `uploading`
  account.error = ``
  startPost([account])
}

function retryAllFailed() {
  if (failedAccounts.value.length === 0)
    return
  const targets = [...failedAccounts.value]
  for (const a of targets) {
    a.status = `uploading`
    a.error = ``
  }
  startPost(targets)
}

watch(() => props.open, (newVal) => {
  if (newVal) {
    taskStatus.value = null
    startPost()
  }
})
</script>

<template>
  <Dialog v-model:open="dialogVisible">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>提交发布任务</DialogTitle>
      </DialogHeader>

      <div class="mt-4">
        <div v-if="!taskStatus" class="py-4 text-center">
          等待发布..
        </div>
        <div v-else class="max-h-[400px] flex flex-col overflow-y-auto">
          <div
            v-for="account in taskStatus?.accounts"
            :key="account.uid + account.displayName"
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
