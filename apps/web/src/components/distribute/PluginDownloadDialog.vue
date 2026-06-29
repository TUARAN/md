<script setup lang="ts">
import { CheckCircle2, Download, ExternalLink, Puzzle, ShieldCheck } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { getSyncblogPluginReleaseUrl } from '@/constants/branding'

const installSteps = [
  `下载同步助手 zip，并在浏览器扩展管理页加载解压后的插件。`,
  `先在浏览器里登录微博、公众号、知乎、掘金等目标平台账号。`,
  `回到 AI分发大师选择平台，开启直接发布或同步到草稿。`,
]

const safetyNotes = [
  `插件只在你的浏览器里辅助点击、输入、上传和打开草稿页。`,
  `账号登录态仍保留在各平台网页内，不由 AI分发大师托管。`,
  `需要更多平台时，联系开发者补充对应平台处理器。`,
]
</script>

<template>
  <Dialog>
    <DialogTrigger as-child>
      <slot>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          class="shrink-0 gap-1.5 text-muted-foreground/80 hover:text-foreground"
        >
          <Puzzle class="h-3.5 w-3.5" />
          <span class="hidden text-xs sm:inline">下载插件</span>
          <span class="text-xs sm:hidden">插件</span>
        </Button>
      </slot>
    </DialogTrigger>

    <DialogContent class="max-w-xl">
      <DialogHeader>
        <div class="mb-1 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Puzzle class="size-5" />
        </div>
        <DialogTitle>下载内容同步助手</DialogTitle>
        <DialogDescription>
          观点、文章、电子书、项目共用同一个浏览器插件。插件负责把内容带到各平台页面，四个板块不需要分别安装。
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-3">
        <a
          :href="getSyncblogPluginReleaseUrl()"
          download
          class="plugin-download-card group"
        >
          <span class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-foreground text-background">
            <Download class="size-4" />
          </span>
          <span class="min-w-0 flex-1">
            <span class="block text-sm font-semibold text-foreground">Chrome / Edge 插件包</span>
            <span class="mt-0.5 block text-xs text-muted-foreground">下载后在浏览器扩展管理页加载，适合四类内容分发。</span>
          </span>
          <ExternalLink class="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
        </a>

        <section class="rounded-lg border border-border/60 bg-muted/20 p-3">
          <div class="mb-2 flex items-center gap-2 text-sm font-semibold">
            <CheckCircle2 class="size-4 text-primary" />
            安装后这样使用
          </div>
          <ol class="space-y-1.5 text-xs leading-relaxed text-muted-foreground">
            <li v-for="(step, index) in installSteps" :key="step" class="flex gap-2">
              <span class="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-background text-[10px] font-semibold text-foreground ring-1 ring-border">
                {{ index + 1 }}
              </span>
              <span>{{ step }}</span>
            </li>
          </ol>
        </section>

        <section class="rounded-lg border border-border/60 bg-card p-3">
          <div class="mb-2 flex items-center gap-2 text-sm font-semibold">
            <ShieldCheck class="size-4 text-primary" />
            插件边界
          </div>
          <ul class="space-y-1.5 text-xs leading-relaxed text-muted-foreground">
            <li v-for="note in safetyNotes" :key="note" class="flex gap-2">
              <span class="mt-2 size-1 rounded-full bg-muted-foreground/60" />
              <span>{{ note }}</span>
            </li>
          </ul>
        </section>
      </div>

      <DialogFooter>
        <Button as-child type="button" class="gap-1.5">
          <a :href="getSyncblogPluginReleaseUrl()" download>
            <Download class="size-4" />
            下载插件
          </a>
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
.plugin-download-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid hsl(var(--border) / 0.7);
  background: hsl(var(--muted) / 0.22);
  padding: 0.75rem;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.plugin-download-card:hover {
  border-color: hsl(var(--border));
  background: hsl(var(--muted) / 0.42);
}
</style>
