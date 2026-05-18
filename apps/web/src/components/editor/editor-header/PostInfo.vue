<script setup lang="ts">
import type { Post, PostAccount } from '@md/shared/types'
import { Check, ChevronDown, ChevronRight, Info, Loader2, Minus, Send } from 'lucide-vue-next'
import { CheckboxIndicator, CheckboxRoot, Primitive } from 'radix-vue'
import { useEditorStore } from '@/stores/editor'
import { useRenderStore } from '@/stores/render'
import { useUIStore } from '@/stores/ui'
import {
  mapPluginSyncerAuthToAccounts,
  mergeCoseAndPluginSyncerAccounts,
  PLUGIN_SYNCER_PREFERRED_TYPES,
} from '@/utils/publishExtensions'

defineOptions({
  inheritAttrs: false,
})

const editorStore = useEditorStore()
const { editor } = storeToRefs(editorStore)

const renderStore = useRenderStore()
const { output } = storeToRefs(renderStore)

const uiStore = useUIStore()
const { isMobile } = storeToRefs(uiStore)

const dialogVisible = ref(false)
const extensionInstalled = ref(false)
/** 页面已加载 csync 扩展注入的 $pluginSyncer（需 manifest 匹配当前站点且 connected） */
const pluginSyncerScriptPresent = ref(false)
const pluginAuthSnapshot = ref<PostAccount[]>([])
const allAccounts = ref<PostAccount[]>([])
const postTaskDialogVisible = ref(false)
const isCheckingLogin = ref(false)

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

/** 构建时由 package:csync 写入 public，与当前 Vite base 一致 */
const csyncExtensionZipUrl = computed(() => `${import.meta.env.BASE_URL}csync-extension.zip`)

// 平台分类配置
// 注：toutiao / jianshu / qianfan / modelscope 对站外图片审核较严格，统一排到各分类靠后
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

// 分类折叠状态（默认折叠云平台及开发者社区）
const collapsedCategories = ref<Set<string>>(new Set([`云平台及开发者社区`]))

function toggleCategory(categoryName: string) {
  if (collapsedCategories.value.has(categoryName)) {
    collapsedCategories.value.delete(categoryName)
  }
  else {
    collapsedCategories.value.add(categoryName)
  }
}

// 按分类获取账号
const accountsByCategory = computed(() => {
  return platformCategories.map(category => ({
    name: category.name,
    accounts: category.platforms
      .map(type => allAccounts.value.find(a => a.type === type))
      .filter((a): a is PostAccount => a !== undefined),
  }))
})

// 判断分类是否全选（只考虑已登录的账号）
function isCategoryAllSelected(accounts: PostAccount[]) {
  const loggedInAccounts = accounts.filter(a => a.loggedIn)
  return loggedInAccounts.length > 0 && loggedInAccounts.every(a => a.checked)
}

// 判断分类是否部分选中
function isCategoryIndeterminate(accounts: PostAccount[]) {
  const loggedInAccounts = accounts.filter(a => a.loggedIn)
  const checkedCount = loggedInAccounts.filter(a => a.checked).length
  return checkedCount > 0 && checkedCount < loggedInAccounts.length
}

// 切换分类全选
function toggleCategorySelectAll(accounts: PostAccount[]) {
  const loggedInAccounts = accounts.filter(a => a.loggedIn)
  const allSelected = loggedInAccounts.every(a => a.checked)
  loggedInAccounts.forEach(a => a.checked = !allSelected)
}

async function prePost() {
  if ((extensionInstalled.value || pluginSyncerScriptPresent.value) && allAccounts.value.length === 0) {
    startLoginDetection()
  }

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

async function refreshPluginAuth() {
  if (!window.$pluginSyncer?.getPlatforms) {
    pluginAuthSnapshot.value = []
    return
  }
  if (!window.$pluginSyncer.connected) {
    pluginAuthSnapshot.value = []
    return
  }
  try {
    const raw = await window.$pluginSyncer.getPlatforms()
    pluginAuthSnapshot.value = mapPluginSyncerAuthToAccounts(raw)
  }
  catch {
    pluginAuthSnapshot.value = []
  }
}

function tryMergePluginIntoAccounts() {
  if (pluginAuthSnapshot.value.length === 0)
    return
  if (allAccounts.value.length === 0) {
    allAccounts.value = pluginAuthSnapshot.value.map(a => ({
      ...a,
      checked: false,
      isChecking: false,
    }))
    return
  }
  allAccounts.value = mergeCoseAndPluginSyncerAccounts(
    allAccounts.value,
    pluginAuthSnapshot.value,
    !!window.$pluginSyncer?.connected,
  )
}

// 监听对话框打开，自动加载数据
watch(dialogVisible, (newVal) => {
  if (newVal) {
    void refreshPluginAuth().then(() => tryMergePluginIntoAccounts())
    prePost()
  }
})

declare global {
  interface Window {
    syncPost: (data: { thumb: string, title: string, desc: string, content: string }) => void
    $cose: any
    $pluginSyncer?: import('@/utils/publishExtensions').PluginSyncerApi
  }
}

// 获取初始平台列表（不带登录状态，用于立即显示）
function getInitialPlatforms(): PostAccount[] {
  if (window.$cose !== undefined && typeof window.$cose.getPlatforms === 'function') {
    return window.$cose.getPlatforms().map((p: any) => ({
      ...p,
      checked: false,
      loggedIn: false,
      isChecking: true, // 标记正在检测中
    }))
  }
  return []
}

// 开始登录检测（异步，不阻塞 UI，渐进式更新）
function startLoginDetection() {
  if (window.$cose !== undefined) {
    const initialPlatforms = getInitialPlatforms()
    if (initialPlatforms.length > 0) {
      allAccounts.value = initialPlatforms
    }

    isCheckingLogin.value = true
    let hasReceivedAny = false

    const timeoutId = setTimeout(() => {
      if (!hasReceivedAny) {
        console.log('[COSE] 登录检测超时，停止检测')
        allAccounts.value = allAccounts.value.map(a => ({ ...a, isChecking: false }))
        isCheckingLogin.value = false
      }
      void refreshPluginAuth().then(() => tryMergePluginIntoAccounts())
    }, 15000)

    const finishCose = () => {
      clearTimeout(timeoutId)
      isCheckingLogin.value = false
      void refreshPluginAuth().then(() => tryMergePluginIntoAccounts())
    }

    if (typeof window.$cose.getAccountsProgressive === 'function') {
      window.$cose.getAccountsProgressive(
        (account: PostAccount, _completed: number, _total: number) => {
          hasReceivedAny = true
          const idx = allAccounts.value.findIndex(a => a.type === account.type)
          if (idx !== -1) {
            allAccounts.value[idx] = { ...account, checked: false, isChecking: false }
          }
        },
        finishCose,
      )
    }
    else {
      window.$cose.getAccounts((resp: PostAccount[]) => {
        hasReceivedAny = true
        clearTimeout(timeoutId)
        allAccounts.value = resp.map(a => ({ ...a, checked: false, isChecking: false }))
        isCheckingLogin.value = false
        void refreshPluginAuth().then(() => tryMergePluginIntoAccounts())
      })
    }
    return
  }

  void refreshPluginAuth().then(() => {
    if (pluginAuthSnapshot.value.length > 0) {
      allAccounts.value = pluginAuthSnapshot.value.map(a => ({
        ...a,
        checked: false,
        isChecking: false,
      }))
    }
  })
}

// 兼容旧的 getAccounts 调用（checkExtension 使用）
async function getAccounts(): Promise<void> {
  startLoginDetection()
}

function post() {
  // 从 allAccounts 获取用户选择的平台（checkbox 绑定在 allAccounts 上）
  form.value.accounts = allAccounts.value.filter(a => a.checked && a.loggedIn)
  postTaskDialogVisible.value = true
  dialogVisible.value = false
}

function onUpdate(val: boolean) {
  if (!val) {
    dialogVisible.value = false
  }
}

function getPlatformUrl(type: string): string {
  const urls: Record<string, string> = {
    csdn: 'https://blog.csdn.net',
    juejin: 'https://juejin.cn',
    wechat: 'https://mp.weixin.qq.com',
    zhihu: 'https://www.zhihu.com/signin',
    toutiao: 'https://mp.toutiao.com',
    segmentfault: 'https://segmentfault.com/user/login',
    cnblogs: 'https://i.cnblogs.com/articles/edit',
    oschina: 'https://my.oschina.net/blog/write',
    cto51: 'https://blog.51cto.com/blogger/publish?&newBloger=2',
    infoq: 'https://xie.infoq.cn/draft/',
    jianshu: 'https://www.jianshu.com/sign_in',
    baijiahao: 'https://baijiahao.baidu.com',
    wangyihao: 'https://mp.163.com/subscribe_v4/index.html#/article-publish',
    tencentcloud: 'https://cloud.tencent.com/developer',
    medium: 'https://medium.com/m/signin',
    sspai: 'https://sspai.com/write',
    sohu: 'https://mp.sohu.com/mpfe/v4/login',
    bilibili: 'https://passport.bilibili.com/login',
    weibo: 'https://passport.weibo.com/sso/signin',
    aliyun: 'https://account.aliyun.com/login/login.htm',
    huaweicloud: 'https://bbs.huaweicloud.com/blogs/article',
    huaweidev: 'https://developer.huawei.com/consumer/cn/blog/create',
    twitter: 'https://x.com/compose/articles/edit/',
    qianfan: 'https://qianfan.cloud.baidu.com/qianfandev/topic/create',
    alipayopen: 'https://open.alipay.com/portal/forum/post/add#article',
    modelscope: 'https://modelscope.cn/learn/create',
    volcengine: 'https://developer.volcengine.com/articles/draft',
    douyin: 'https://creator.douyin.com/creator-micro/content/post/article?default-tab=5&enter_from=publish_page&media_type=article&type=new',
    xiaohongshu: 'https://creator.xiaohongshu.com/publish/publish?from=menu&target=article',
    elecfans: 'https://www.elecfans.com/d/article/md/',
    douban: 'https://www.douban.com/note/create',
  }
  return urls[type] || '#'
}

function onAvatarError(account: PostAccount, event: Event) {
  const img = event.target as HTMLImageElement
  if (!account)
    return
  img.style.display = 'none'
}

function checkExtension() {
  let coseDetectionStarted = false
  let pluginAuthFetched = false
  const probe = () => {
    if (window.$cose !== undefined) {
      extensionInstalled.value = true
      if (!coseDetectionStarted) {
        coseDetectionStarted = true
        void getAccounts()
      }
    }
    if (window.$pluginSyncer !== undefined) {
      pluginSyncerScriptPresent.value = true
      if (!pluginAuthFetched) {
        pluginAuthFetched = true
        void refreshPluginAuth().then(() => tryMergePluginIntoAccounts())
      }
    }
  }
  probe()
  let count = 0
  const timer = setInterval(() => {
    probe()
    count++
    if (count > 10)
      clearInterval(timer)
  }, 500)
}

onBeforeMount(() => {
  checkExtension()
})
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
          <DialogDescription class="space-y-2">
            <p>
              会把当前文章中的标题、描述、封面、预览 HTML 与 Markdown 交给已安装的浏览器扩展，由扩展跳转各平台编辑页并尽量写入草稿；不同站点实现方式不同，失败时可在任务里单独重试。
            </p>
            <p>
              编辑器刻意拆成两条同步链路：知乎、公众号、微博优先用本仓库的 csync，其它平台用 COSE（cose 文章同步助手），从而兼顾「热门三个站」的稳定与其余站点的覆盖面。二者可同时安装，本对话框会自动分流。
            </p>
          </DialogDescription>
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
                  :href="csyncExtensionZipUrl"
                  download
                  class="font-medium text-primary underline underline-offset-2"
                >下载 csync 扩展（.zip）</a>
                ——与当前站点配套的包。解压得到 <code class="rounded bg-background px-1 py-0.5 text-xs dark:bg-muted">csync-extension</code> 文件夹，在 Chrome
                <code class="rounded bg-background px-1 py-0.5 text-xs dark:bg-muted">chrome://extensions</code>
                打开开发者模式后，选「加载已解压的扩展程序」并指向该文件夹。（自建部署需在构建前执行 <code class="rounded bg-background px-1 py-0.5 text-xs dark:bg-muted">pnpm package:csync</code>；维护者也可直接加载仓库内 <code class="rounded bg-background px-1 py-0.5 text-xs dark:bg-muted">apps/web/vendor/csync-extension</code>。）
              </li>
              <li>
                安装后若当前访问域名已写在扩展 manifest 中，知乎/公众号/微博会显示 csync 角标并由其写入；未配置时这些站会走 COSE 或提示登录。
              </li>
              <li>
                编辑器侧已把 title / content / markdown 拆开传递；若某平台仍填错栏位，多半是后台改版后扩展选框未跟上，可升级 csync / COSE 或向对应项目提 Issue。
              </li>
            </ul>
          </div>

          <Alert v-if="pluginSyncerScriptPresent && !pluginAuthSnapshot.length">
            <Info class="h-4 w-4" />
            <AlertDescription class="text-sm">
              已检测到 csync 脚本，但未能连接（<code class="text-xs">$pluginSyncer.connected === false</code>）。请确认已通过上方 zip 解压加载扩展，且 manifest 中已包含当前站点域名，然后重新加载扩展。
            </AlertDescription>
          </Alert>

          <Alert v-if="!extensionInstalled && !pluginAuthSnapshot.length">
            <Info class="h-4 w-4" />
            <AlertTitle>未检测到可用发布扩展</AlertTitle>
            <AlertDescription>
              请至少安装 <a href="https://chromewebstore.google.com/detail/ilhikcdphhpjofhlnbojifbihhfmmhfk" target="_blank" class="underline text-primary">COSE（cose 文章同步助手）</a>，或按上方说明下载本站提供的 csync（.zip）解压加载，以支持知乎 / 公众号 / 微博。
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
                    <span v-if="account.syncSource === 'plugin-syncer'" class="text-xs text-muted-foreground">csync</span>
                    <!-- 检测中：显示转圈动画 -->
                    <template v-if="account.isChecking">
                      <Loader2 class="ml-1 h-3.5 w-3.5 animate-spin text-muted-foreground" />
                      <span class="text-xs text-muted-foreground">检测中</span>
                    </template>
                    <!-- 已登录：显示头像和用户名 -->
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
                    <!-- 未登录：显示登录链接 -->
                    <Primitive
                      v-else
                      as="a"
                      :href="getPlatformUrl(account.type)"
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
