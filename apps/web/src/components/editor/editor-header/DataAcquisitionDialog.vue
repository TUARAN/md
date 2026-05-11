<script setup lang="ts">
import { APP_FOCUS, APP_NAME } from '@/constants/branding'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([`close`])

const ALLIANCE_SITE = `https://blogger-alliance.cn/`

function onUpdate(val: boolean) {
  if (!val) {
    emit(`close`)
  }
}

function openAllianceSite() {
  window.open(ALLIANCE_SITE, `_blank`, `noopener,noreferrer`)
}
</script>

<template>
  <Dialog :open="props.visible" @update:open="onUpdate">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>数据获取</DialogTitle>
      </DialogHeader>
      <div class="space-y-3 text-sm leading-relaxed text-muted-foreground">
        <p>
          <span class="font-medium text-foreground">{{ APP_NAME }}</span>
          当前阶段以「<span class="text-foreground">{{ APP_FOCUS }}</span>」为主：编辑、渲染与各渠道复制/同步都在本页完成。
        </p>
        <p>
          <strong class="text-foreground">数据采集、回流与分析仪表盘</strong>
          属于工作流的上一环，将在后续版本接入本工具；在此之前，可通过博主联盟官网关注进展与协作方式。
        </p>
      </div>
      <DialogFooter class="sm:justify-between gap-2">
        <Button variant="outline" @click="emit('close')">
          关闭
        </Button>
        <Button @click="openAllianceSite">
          打开博主联盟官网
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
