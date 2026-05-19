<script setup lang="ts">
import type { Post, PostAccount } from '@md/shared/types'
import { Check, ChevronDown, ChevronRight, ExternalLink, Info, Loader2, Minus, RefreshCw, Send } from 'lucide-vue-next'
import { CheckboxIndicator, CheckboxRoot, Primitive } from 'radix-vue'
import { usePlatformAccountDetection } from '@/composables/usePlatformAccountDetection'
import { useEditorStore } from '@/stores/editor'
import { useRenderStore } from '@/stores/render'
import { CREATOR_PROFILE_ROUTE } from '@/stores/socialAccounts'
import { useUIStore } from '@/stores/ui'
import { downloadCsyncExtensionZip } from '@/utils/downloadCsyncExtension'
import { PLUGIN_SYNCER_PREFERRED_TYPES } from '@/utils/publishExtensions'

defineOptions({
  inheritAttrs: false,
})

const editorStore = useEditorStore()
const { editor } = storeToRefs(editorStore)

const renderStore = useRenderStore()
const { output } = storeToRefs(renderStore)

const uiStore = useUIStore()
const { isMobile } = storeToRefs(uiStore)

const {
  allAccounts,
  extensionInstalled,
  pluginSyncerScriptPresent,
  pluginAuthSnapshot,
  isCheckingLogin,
  getPlatformLoginUrl,
  refreshPluginAuth,
  tryMergePluginIntoAccounts,
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
  const coseOk = extensionInstalled.value
  const pluginOk = pluginAuthSnapshot.value.some(
    a => a.loggedIn && PLUGIN_SYNCER_PREFERRED_TYPES.has(a.type),
  )
  return coseOk || pluginOk
})

const platformCategories = [
  {
    name: `媒体平台`,
    platforms: [`wechat`, `zhihu`, `baijiahao`, `wangyihao`, `sohu`, `weibo`, `bilibili`, `sspai`, `twitter`, `douyin`, `xiaohongshu`, `douban`, `toutiao`],
  },
  {
    name: `博客平台`,
    platforms: [`csdn`, `cnblogs`, `juejin`, `medium`, `cto51`, `segmentfault`, `oschina`, `infoq`, `jianshu`],
  },
  {
    name: `云平台及开发者社区`,
    platforms: [`tencentcloud`, `aliyun`, `huaweicloud`, `huaweidev`, `alipayopen`, `volcengine`, `elecfans`, `qianfan`, `modelscope`],
  },
]

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
  return platformCategories.map(category => ({
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
  if ((extensionInstalled.value || pluginSyncerScriptPresent.value) && allAccounts.value.length === 0)
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
    void refreshPluginAuth().then(() => tryMergePluginIntoAccounts())
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
  cacheAccountsToProfile()
  window.open(CREATOR_PROFILE_ROUTE, `_blank`, `noopener,noreferrer`)
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
              你在这页需要知道的两件事
            </p>
            <ul class="mt-2 list-disc space-y-1.5 pl-5">
              <li>
                <strong class="text-foreground">主推</strong>：点击
                <a
                  href="#"
                  class="font-medium text-primary underline underline-offset-2"
                  @click.prevent="downloadCsyncExtensionZip()"
                >下载 CSYNC 扩展（.zip）</a>
                ——与当前站点配套的包。解压得到 <code class="rounded bg-background px-1 py-0.5 text-xs dark:bg-muted">csync-extension</code> 文件夹，在 Chrome
                <code class="rounded bg-background px-1 py-0.5 text-xs dark:bg-muted">chrome://extensions</code>
                打开开发者模式后，选「加载已解压的扩展程序」并指向该文件夹。（自建部署需在构建前执行 <code class="rounded bg-background px-1 py-0.5 text-xs dark:bg-muted">pnpm package:csync</code>；维护者也可直接加载仓库内 <code class="rounded bg-background px-1 py-0.5 text-xs dark:bg-muted">apps/web/vendor/csync-extension</code>。）
              </li>
              <li>
                安装后若当前访问域名已写在扩展 manifest 中，知乎/公众号/微博会显示 CSYNC 角标并由其写入；未配置时这些站会走 COSE 或提示登录。
              </li>
              <li>
                编辑器侧已把 title / content / markdown 拆开传递；若某平台仍填错栏位，多半是后台改版后扩展选框未跟上，可升级 CSYNC / COSE 或向对应项目提 Issue。
              </li>
            </ul>
          </div>

          <Alert v-if="pluginSyncerScriptPresent && !pluginAuthSnapshot.length">
            <Info class="h-4 w-4" />
            <AlertDescription class="text-sm">
              已检测到 CSYNC 脚本，但未能连接（<code class="text-xs">$pluginSyncer.connected === false</code>）。请确认已通过上方 zip 解压加载扩展，且 manifest 中已包含当前站点域名，然后重新加载扩展。
            </AlertDescription>
          </Alert>

          <Alert v-if="!extensionInstalled && !pluginAuthSnapshot.length">
            <Info class="h-4 w-4" />
            <AlertTitle>未检测到可用发布扩展</AlertTitle>
            <AlertDescription>
              请至少安装 <a href="https://chromewebstore.google.com/detail/ilhikcdphhpjofhlnbojifbihhfmmhfk" target="_blank" class="underline text-primary">COSE（cose 文章同步助手）</a>，或按上方说明下载本站提供的 CSYNC（.zip）解压加载，以支持知乎 / 公众号 / 微博。
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
                  已登录账号会写入创作名片；登录新平台后可点「重新检测账号」刷新。
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
                    :disabled="!allAccounts.some(a => a.loggedIn)"
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
                    :key="`${account.syncSource || 'cose'}-${account.type}-${account.uid}`"
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
                    <span v-if="account.syncSource === 'plugin-syncer'" class="text-xs text-muted-foreground">CSYNC</span>
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
                      class="ml-1 text-sm text-muted-foreground hover:underline"
                    >
                      登录
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
