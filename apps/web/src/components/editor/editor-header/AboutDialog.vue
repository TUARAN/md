<script setup lang="ts">
import {
  APP_CURRENT_SCOPE,
  APP_CURRENT_STAGE,
  APP_NAME,
  APP_SLOGAN,
  APP_TAGLINE,
  APP_WORKFLOW_VISION,
} from '@/constants/branding'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([`close`])

function onUpdate(val: boolean) {
  if (!val) {
    emit(`close`)
  }
}

const links = [
  { label: `GitHub 仓库`, url: `https://github.com/doocs/md` },
  { label: `Gitee 仓库`, url: `https://gitee.com/doocs/md` },
  { label: `GitCode 仓库`, url: `https://gitcode.com/doocs/md` },
]

function onRedirect(url: string) {
  window.open(url, `_blank`)
}
</script>

<template>
  <Dialog :open="props.visible" @update:open="onUpdate">
    <DialogContent class="max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>关于 {{ APP_NAME }}</DialogTitle>
      </DialogHeader>
      <div class="space-y-4 text-left text-sm leading-relaxed">
        <h3 class="text-center text-base font-semibold">
          {{ APP_NAME }}
        </h3>
        <p class="text-center text-sm font-semibold tracking-tight text-primary">
          {{ APP_SLOGAN }}
        </p>
        <p class="text-muted-foreground text-center text-xs">
          {{ APP_CURRENT_STAGE }}
        </p>
        <p class="text-muted-foreground text-center">
          {{ APP_TAGLINE }}
        </p>
        <div class="rounded-lg border border-border bg-muted/40 p-4">
          <p class="mb-2 font-medium text-foreground">
            流程设计（目标全链路）
          </p>
          <p class="text-muted-foreground">
            {{ APP_WORKFLOW_VISION }}
          </p>
        </div>
        <p class="text-muted-foreground">
          {{ APP_CURRENT_SCOPE }}
        </p>
      </div>
      <DialogFooter class="sm:justify-evenly flex flex-wrap gap-2">
        <Button
          v-for="link in links"
          :key="link.url"
          @click="onRedirect(link.url)"
        >
          {{ link.label }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
