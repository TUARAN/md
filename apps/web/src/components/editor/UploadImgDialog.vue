<script setup lang="ts">
/**
 * 图片上传对话框
 *
 * 顶部是 Tabs:
 *  - "选择上传"            上传/拖拽 + 全局开关(图床选择、压缩、粘贴转存)
 *  - "GitHub" / "阿里云" / "腾讯云" / "七牛云" / "MinIO" / "S3" / "公众号" /
 *    "Cloudflare R2" / "又拍云" / "Telegram" / "Cloudinary"  各家图床的设置表单
 *  - "自定义代码"          用户自定义 JS 上传脚本
 *
 * 2026-05 重构:每个图床的 schema/config/submit/form 拆到 `upload-img-hosts/`
 * 下的子组件,Dialog 本身只剩"壳 + tab 切换 + 上传/拖拽/进度条"。原文件 1356 行,
 * 拆完后这里 ~270 行,每个子组件 ~100 行。
 */
import { UploadCloud } from 'lucide-vue-next'
import { useUIStore } from '@/stores/ui'
import { checkImage } from '@/utils'
import { isImgHostConfigured } from '@/utils/file'
import { store } from '@/utils/storage'
import CustomUploadForm from './CustomUploadForm.vue'
import AliOssHost from './upload-img-hosts/AliOssHost.vue'
import CloudinaryHost from './upload-img-hosts/CloudinaryHost.vue'
import GithubHost from './upload-img-hosts/GithubHost.vue'
import MinioHost from './upload-img-hosts/MinioHost.vue'
import MpHost from './upload-img-hosts/MpHost.vue'
import QiniuHost from './upload-img-hosts/QiniuHost.vue'
import R2Host from './upload-img-hosts/R2Host.vue'
import S3Host from './upload-img-hosts/S3Host.vue'
import TelegramHost from './upload-img-hosts/TelegramHost.vue'
import TxCosHost from './upload-img-hosts/TxCosHost.vue'
import UpyunHost from './upload-img-hosts/UpyunHost.vue'

const emit = defineEmits([`uploadImage`])

const uiStore = useUIStore()
const { enableImageReupload } = storeToRefs(uiStore)
const { toggleImageReupload } = uiStore

interface HostOption {
  value: string
  label: string
  /** 设置面板组件;为空表示该 tab 不渲染表单(如默认/自定义代码) */
  component?: any
}

const options: HostOption[] = [
  { value: `default`, label: `默认` },
  { value: `github`, label: `GitHub`, component: GithubHost },
  { value: `aliOSS`, label: `阿里云`, component: AliOssHost },
  { value: `txCOS`, label: `腾讯云`, component: TxCosHost },
  { value: `qiniu`, label: `七牛云`, component: QiniuHost },
  { value: `minio`, label: `MinIO`, component: MinioHost },
  { value: `s3`, label: `S3`, component: S3Host },
  { value: `mp`, label: `公众号图床`, component: MpHost },
  { value: `r2`, label: `Cloudflare R2`, component: R2Host },
  { value: `upyun`, label: `又拍云`, component: UpyunHost },
  { value: `telegram`, label: `Telegram`, component: TelegramHost },
  { value: `cloudinary`, label: `Cloudinary`, component: CloudinaryHost },
  { value: `formCustom`, label: `自定义代码`, component: CustomUploadForm },
]

const imgHost = store.reactive(`imgHost`, `default`)
const useCompression = store.reactive(`useCompression`, false)
const activeName = ref(`upload`)

async function changeImgHost() {
  toast.success(`图床已切换`)
}

async function changeCompression() {
  // reactive 会自动保存，不需要手动操作
}

async function beforeImageUpload(file: File) {
  const checkResult = checkImage(file)
  if (!checkResult.ok) {
    toast.error(checkResult.msg)
    return false
  }
  const imgHostValue = imgHost.value || `default`
  if (!(await isImgHostConfigured(imgHostValue))) {
    toast.error(`请先配置 ${imgHostValue} 图床参数`)
    return false
  }
  return true
}

const dragover = ref(false)

const { open, reset, onChange } = useFileDialog({
  accept: `image/*`,
})

onChange(async (files) => {
  if (files == null)
    return

  const file = files[0]

  if (await beforeImageUpload(file)) {
    emitUploads(file)
  }
  reset()
})

async function onDrop(e: DragEvent) {
  dragover.value = false
  e.stopPropagation()
  const file = [...e.dataTransfer!.files][0]
  if (await beforeImageUpload(file)) {
    emitUploads(file)
  }
}

const progressValue = ref(0)
const imageUrl = ref(``)

function emitUploads(file: File) {
  progressValue.value = 0
  const intervalId = setInterval(() => {
    const newProgress = progressValue.value + 1
    if (newProgress >= 100)
      return
    progressValue.value = newProgress
  }, 100)

  // 监听上传完成事件，在真正完成后清除定时器和设置 100%
  const cleanup = (_url: string, data: string) => {
    clearInterval(intervalId)
    progressValue.value = 100
    if (data) {
      imageUrl.value = `data:image/png;base64,${data}`
    }
    // 延迟一段时间后重置进度
    setTimeout(() => {
      progressValue.value = 0
      imageUrl.value = ``
    }, 1000)
  }

  emit(`uploadImage`, file, cleanup, true)
}

function onTabScroll(e: WheelEvent) {
  if (e.deltaY !== 0) {
    e.preventDefault()
    const target = e.currentTarget as HTMLElement
    target.scrollLeft += e.deltaY
  }
}
</script>

<template>
  <Dialog v-model:open="uiStore.isShowUploadImgDialog">
    <DialogContent class="md:max-w-3xl max-h-[90vh] flex flex-col overflow-hidden" @pointer-down-outside="ev => ev.preventDefault()">
      <DialogHeader>
        <DialogTitle>本地上传</DialogTitle>
      </DialogHeader>
      <Tabs v-model="activeName" class="w-full md:w-full flex flex-col flex-1 overflow-hidden">
        <TabsList
          class="flex w-full justify-start overflow-x-auto flex-nowrap gap-1 pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          @wheel="onTabScroll"
        >
          <TabsTrigger value="upload" class="text-xs md:text-sm whitespace-nowrap">
            选择上传
          </TabsTrigger>
          <TabsTrigger
            v-for="item in options.filter(item => item.value !== 'default')"
            :key="item.value"
            :value="item.value"
            class="text-xs md:text-sm whitespace-nowrap"
          >
            {{ item.label }}
          </TabsTrigger>
        </TabsList>

        <!-- 选择上传:全局图床选择 + 拖拽区 -->
        <TabsContent value="upload" class="flex-1 overflow-y-auto p-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <Select v-model="imgHost" class="my-4" @update:model-value="changeImgHost">
            <SelectTrigger>
              <SelectValue placeholder="请选择图床" />
            </SelectTrigger>
            <SelectContent class="max-h-64 md:max-h-96">
              <SelectItem
                v-for="item in options"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              >
                {{ item.label }}
              </SelectItem>
            </SelectContent>
          </Select>
          <p class="text-xs text-muted-foreground">
            「默认」由服务端代传 GitHub 图床，Token 不会暴露在前端；自建部署请配置 <code class="rounded bg-muted px-1">IMGBED_GITHUB_TOKENS</code>。
          </p>

          <div class="space-y-3 my-4">
            <div class="flex items-center justify-between gap-4">
              <span class="text-sm">
                开启图片压缩
              </span>
              <Switch
                v-model:checked="useCompression"
                name="UseCompression"
                @update:checked="changeCompression"
              />
            </div>

            <div class="flex items-center justify-between gap-4">
              <span class="text-sm">
                粘贴图片时自动转存
              </span>
              <Switch
                v-model:checked="enableImageReupload"
                name="EnableImageReupload"
                @update:checked="toggleImageReupload"
              />
            </div>
            <p class="text-xs text-muted-foreground mt-1.5">
              粘贴 Markdown 图片链接时自动转存到配置的图床
            </p>
          </div>

          <div
            class="bg-clip-padding mt-4 h-50 relative flex flex-col cursor-pointer items-center justify-evenly border-2 rounded border-dashed transition-colors hover:border-gray-700 hover:bg-gray-400/50 dark:hover:border-gray-200 dark:hover:bg-gray-500/50"
            :class="{
              'border-gray-700 bg-gray-400/50 dark:border-gray-200 dark:bg-gray-500/50': dragover,
            }"
            @click="open()"
            @drop.prevent="onDrop"
            @dragover.prevent="dragover = true"
            @dragleave.prevent="dragover = false"
          >
            <Progress v-model="progressValue" class="absolute left-0 right-0 rounded-none" style="top: -24px; height: 2px;" />
            <UploadCloud class="size-16 md:size-20" />
            <p class="text-center text-sm md:text-base px-4">
              将图片拖到此处，或
              <strong>点击上传</strong>
            </p>
            <div v-if="imageUrl" class="absolute left-0 right-0 h-full w-full flex items-center justify-center bg-white dark:bg-black">
              <img :src="imageUrl" class="max-h-40 object-contain">
            </div>
          </div>
        </TabsContent>

        <!-- 各家图床的设置面板:每个 tab 挂载对应的子组件 -->
        <TabsContent
          v-for="item in options.filter(item => item.component)"
          :key="item.value"
          :value="item.value"
          class="flex-1 flex flex-col overflow-hidden"
        >
          <component :is="item.component" />
        </TabsContent>
      </Tabs>
    </DialogContent>
  </Dialog>
</template>
