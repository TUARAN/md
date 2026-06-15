<script setup lang="ts">
import type { Post, PostAccount } from '@md/shared/types'
import { Check, ChevronDown, ChevronRight, ExternalLink, Info, Loader2, Minus, RefreshCw, Send } from 'lucide-vue-next'
import { CheckboxIndicator, CheckboxRoot, Primitive } from 'radix-vue'
import { usePlatformAccountDetection } from '@/composables/usePlatformAccountDetection'
import { getSyncblogPluginReleaseUrl } from '@/constants/branding'
import { PLATFORM_CATEGORIES } from '@/constants/platforms'
import { useAuthStore } from '@/stores/auth'
import { useCreatorProfileStore } from '@/stores/creatorProfile'
import { useEditorStore } from '@/stores/editor'
import { useRenderStore } from '@/stores/render'
import { useUIStore } from '@/stores/ui'
import { copyPlain } from '@/utils/clipboard'
import { creatorCardRoute } from '@/utils/creatorRoutes'
import { toast } from '@/utils/toast'

defineOptions({
  inheritAttrs: false,
})

const editorStore = useEditorStore()
const { editor } = storeToRefs(editorStore)

const renderStore = useRenderStore()
const { output } = storeToRefs(renderStore)

const uiStore = useUIStore()
const { isMobile } = storeToRefs(uiStore)

const auth = useAuthStore()
const creatorProfile = useCreatorProfileStore()

const {
  allAccounts,
  extensionInstalled,
  isCheckingLogin,
  getPlatformLoginUrl,
  startLoginDetection,
  redetectAccounts,
  cacheAccountsToProfile,
} = usePlatformAccountDetection()

const dialogVisible = ref(false)
const postTaskDialogVisible = ref(false)

const form = ref<Post>({
  title: ``,
  desc: ``,
  thumb: ``,
  content: ``,
  markdown: ``,
  accounts: [] as PostAccount[],
})

const allowPost = computed(() => {
  const hasSelection = allAccounts.value.some(a => a.checked && a.loggedIn)
  if (!hasSelection)
    return false
  return extensionInstalled.value
})

const collapsedCategories = ref<Set<string>>(new Set([`云平台及开发者社区`]))

function toggleCategory(categoryName: string) {
  if (collapsedCategories.value.has(categoryName)) {
    collapsedCategories.value.delete(categoryName)
  }
  else {
    collapsedCategories.value.add(categoryName)
  }
}

const accountsByCategory = computed(() => {
  return PLATFORM_CATEGORIES.map(category => ({
    name: category.name,
    accounts: category.platforms
      .map(type => allAccounts.value.find(a => a.type === type))
      .filter((a): a is PostAccount => a !== undefined),
  }))
})

function isCategoryAllSelected(accounts: PostAccount[]) {
  const loggedInAccounts = accounts.filter(a => a.loggedIn)
  return loggedInAccounts.length > 0 && loggedInAccounts.every(a => a.checked)
}

function isCategoryIndeterminate(accounts: PostAccount[]) {
  const loggedInAccounts = accounts.filter(a => a.loggedIn)
  const checkedCount = loggedInAccounts.filter(a => a.checked).length
  return checkedCount > 0 && checkedCount < loggedInAccounts.length
}

function toggleCategorySelectAll(accounts: PostAccount[]) {
  const loggedInAccounts = accounts.filter(a => a.loggedIn)
  const allSelected = loggedInAccounts.every(a => a.checked)
  loggedInAccounts.forEach(a => a.checked = !allSelected)
}

async function prePost() {
  if (extensionInstalled.value && allAccounts.value.length === 0)
    startLoginDetection({ silent: true })

  let auto: Post = {
    thumb: ``,
    title: ``,
    desc: ``,
    content: ``,
    markdown: ``,
    accounts: [],
  }
  const accounts = allAccounts.value.filter(a => ![`ipfs`].includes(a.type))
  try {
    auto = {
      thumb: document.querySelector<HTMLImageElement>(`#output img`)?.src ?? ``,
      title: [1, 2, 3, 4, 5, 6]
        .map(h => document.querySelector(`#output h${h}`)!)
        .find(h => h)
        ?.textContent ?? ``,
      desc: document.querySelector(`#output p`)?.textContent?.trim() ?? ``,
      content: output.value,
      markdown: editor.value?.state.doc.toString() ?? ``,
      accounts,
    }
  }
  catch (error) {
    console.log(`error`, error)
  }
  finally {
    form.value = {
      ...auto,
    }
  }
}

watch(dialogVisible, (newVal) => {
  if (newVal) {
    prePost()
  }
})

function post() {
  form.value.accounts = allAccounts.value.filter(a => a.checked && a.loggedIn)
  cacheAccountsToProfile()
  postTaskDialogVisible.value = true
  dialogVisible.value = false
}

function openCreatorProfile() {
  if (!auth.isAuthenticated) {
    toast.error(`登录后即可查看你的创作名片`)
    auth.startLogin()
    return
  }
  if (!creatorProfile.creatorId) {
    toast.error(`正在加载创作名片，请稍后再试`)
    void creatorProfile.refresh()
    return
  }
  cacheAccountsToProfile()
  window.open(creatorCardRoute(creatorProfile.creatorId), `_blank`, `noopener,noreferrer`)
}

function onUpdate(val: boolean) {
  if (!val)
    dialogVisible.value = false
}

function onAvatarError(account: PostAccount, event: Event) {
  const img = event.target as HTMLImageElement
  if (!account)
    return
  img.style.display = `none`
}

/**
 * 点击平台行「登录」入口：先打开平台页（同步保留用户手势，避免被弹窗拦截），
 * 再异步把当前 Markdown 写入剪贴板，并提示用户登录后直接 Ctrl+V 粘贴。
 * 对很多平台（思否 / 少数派 / 51CTO 等）来说，这个 URL 本来就是编辑器入口，
 * 自动复制能把「打开 → 登录 → 手动回本站复制 → 切回粘贴」缩短为一次粘贴。
 */
async function openPlatformWrite(account: PostAccount, ev: MouseEvent) {
  ev.preventDefault()
  const url = getPlatformLoginUrl(account.type)
  // 必须在用户手势的同步阶段调用 window.open，否则会被 Safari/Chrome 的弹窗拦截
  window.open(url, `_blank`, `noopener,noreferrer`)

  const md = editor.value?.state.doc.toString()?.trim() ?? ``
  if (!md) {
    toast.info(`已打开 ${account.title} 编辑页`)
    return
  }
  try {
    await copyPlain(md)
    toast.success(`Markdown 已复制，登录 ${account.title} 后直接 Ctrl+V 粘贴`)
  }
  catch {
    toast.warning(`已打开 ${account.title}，但剪贴板写入失败，请手动复制 Markdown 后粘贴`)
  }
}
</script>

<template>
  <div v-bind="$attrs">
    <Dialog v-model:open="dialogVisible" @update:open="onUpdate">
      <DialogTrigger>
        <Button v-if="!isMobile" variant="outline" class="h-9">
          <Send class="mr-2 h-4 w-4" />
          发布
        </Button>
      </DialogTrigger>
      <DialogContent class="!w-[750px] !max-w-[95vw] max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>发布与多平台同步</DialogTitle>
        </DialogHeader>
        <div class="flex-1 overflow-y-auto p-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex flex-col gap-4">
          <div class="rounded-lg border border-border/80 bg-muted/25 px-4 py-3 text-sm leading-relaxed text-muted-foreground dark:bg-muted/15">
            <p class="font-medium text-foreground">
              发布前请安装 SyncBlog 发布插件
            </p>
            <ol class="mt-2 list-decimal space-y-2 pl-5">
              <li>
                <strong class="text-foreground">推荐：SyncBlog Plugin</strong>：
                <a
                  :href="getSyncblogPluginReleaseUrl()"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="font-medium text-primary underline underline-offset-2"
                >下载 SyncBlog Plugin</a>，覆盖知乎 / 公众号 / 微博 / CSDN / 掘金等主流平台的草稿写入。
              </li>
              <li>
                <strong class="text-foreground">安装方式</strong>：下载最新 zip，解压后在
                <code class="rounded bg-background px-1 py-0.5 text-xs dark:bg-muted">chrome://extensions</code>
                开启「开发者模式」→「加载已解压的扩展程序」，然后刷新本页并重新检测账号。
              </li>
            </ol>
            <p class="mt-2 text-xs">
              标题或正文写错？多为目标平台后台改版所致，先升级 SyncBlog Plugin 到最新；仍异常请到插件仓库反馈。批量队列、数据回流等能力会随版本迭代陆续开放，工具本身永久免费。
            </p>
          </div>

          <Alert v-if="!extensionInstalled">
            <Info class="h-4 w-4" />
            <AlertTitle>未检测到可用发布扩展</AlertTitle>
            <AlertDescription>
              请安装
              <a :href="getSyncblogPluginReleaseUrl()" target="_blank" rel="noopener noreferrer" class="underline text-primary">SyncBlog Plugin</a>，安装后刷新页面并点「重新检测账号」。
            </AlertDescription>
          </Alert>

          <div class="w-full flex items-center gap-4">
            <Label for="thumb" class="w-10 text-end">
              封面
            </Label>
            <Input id="thumb" v-model="form.thumb" placeholder="自动提取第一张图" />
          </div>
          <div class="w-full flex items-center gap-4">
            <Label for="title" class="w-10 text-end">
              标题
            </Label>
            <Input id="title" v-model="form.title" placeholder="自动提取第一个标题" />
          </div>
          <div class="w-full flex items-start gap-4">
            <Label for="desc" class="w-10 text-end">
              描述
            </Label>
            <Textarea id="desc" v-model="form.desc" placeholder="自动提取第一个段落" />
          </div>

          <div class="w-full flex items-start gap-4">
            <Label class="w-10 text-end">
              平台
            </Label>
            <div class="flex-1 space-y-3">
              <div class="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/70 bg-muted/20 px-3 py-2 text-sm">
                <span class="text-muted-foreground">
                  已登录账号会写入你的创作名片；登录 PublishLab 后可查看个人标签，登录新平台后可点「重新检测账号」刷新。
                </span>
                <div class="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    :disabled="isCheckingLogin"
                    @click="redetectAccounts"
                  >
                    <Loader2 v-if="isCheckingLogin" class="mr-2 h-4 w-4 animate-spin" />
                    <RefreshCw v-else class="mr-2 h-4 w-4" />
                    重新检测账号
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    :disabled="!auth.isAuthenticated || !allAccounts.some(a => a.loggedIn)"
                    @click="openCreatorProfile"
                  >
                    <ExternalLink class="mr-2 h-4 w-4" />
                    创作名片
                  </Button>
                </div>
              </div>
              <div v-for="category in accountsByCategory" :key="category.name">
                <div class="flex items-center gap-2 mb-2">
                  <div
                    class="flex items-center gap-1 cursor-pointer select-none text-sm font-medium text-muted-foreground hover:text-foreground"
                    @click="toggleCategory(category.name)"
                  >
                    <ChevronDown v-if="!collapsedCategories.has(category.name)" class="h-4 w-4" />
                    <ChevronRight v-else class="h-4 w-4" />
                    <span>{{ category.name }}</span>
                    <span class="text-xs">({{ category.accounts.length }})</span>
                  </div>
                  <div class="flex items-center gap-1 ml-2">
                    <CheckboxRoot
                      :checked="isCategoryAllSelected(category.accounts) ? true : isCategoryIndeterminate(category.accounts) ? 'indeterminate' : false"
                      class="bg-background hover:bg-muted h-[18px] w-[18px] flex shrink-0 appearance-none items-center justify-center border border-gray-300 rounded-[3px] outline-hidden"
                      @click.stop="toggleCategorySelectAll(category.accounts)"
                    >
                      <CheckboxIndicator>
                        <Check v-if="isCategoryAllSelected(category.accounts)" class="h-3 w-3" />
                        <Minus v-else-if="isCategoryIndeterminate(category.accounts)" class="h-3 w-3" />
                      </CheckboxIndicator>
                    </CheckboxRoot>
                    <span class="text-xs text-muted-foreground">全选</span>
                  </div>
                </div>
                <div v-show="!collapsedCategories.has(category.name)" class="grid grid-cols-2 gap-x-8 gap-y-2 pl-5">
                  <div
                    v-for="account in category.accounts"
                    :key="`${account.type}-${account.uid}`"
                    class="flex items-center gap-2 whitespace-nowrap"
                  >
                    <CheckboxRoot
                      v-model:checked="account.checked"
                      :disabled="!account.loggedIn"
                      class="bg-background hover:bg-muted h-[18px] w-[18px] flex shrink-0 appearance-none items-center justify-center border border-gray-300 rounded-[3px] outline-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <CheckboxIndicator>
                        <Check v-if="account.checked" class="h-3 w-3" />
                      </CheckboxIndicator>
                    </CheckboxRoot>
                    <img
                      :src="account.icon"
                      alt=""
                      class="inline-block h-[16px] w-[16px] shrink-0"
                    >
                    <span class="text-sm font-medium">{{ account.title }}</span>
                    <template v-if="account.isChecking">
                      <Loader2 class="ml-1 h-3.5 w-3.5 animate-spin text-muted-foreground" />
                      <span class="text-xs text-muted-foreground">检测中</span>
                    </template>
                    <template v-else-if="account.loggedIn">
                      <img
                        v-if="account.avatar"
                        :src="account.avatar"
                        alt=""
                        class="ml-1 h-4 w-4 rounded-full object-cover"
                        @error="onAvatarError(account, $event)"
                      >
                      <span class="text-sm text-muted-foreground">@{{ account.displayName }}</span>
                    </template>
                    <Primitive
                      v-else
                      as="a"
                      :href="getPlatformLoginUrl(account.type)"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="ml-1 text-sm text-muted-foreground hover:underline"
                      :title="`打开 ${account.title} 编辑页，并把当前 Markdown 复制到剪贴板`"
                      @click="openPlatformWrite(account, $event)"
                    >
                      去发布
                    </Primitive>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="dialogVisible = false">
            取 消
          </Button>
          <Button :disabled="!allowPost" @click="post">
            确 定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <PostTaskDialog v-model:open="postTaskDialogVisible" :post="form" />
  </div>
</template>
