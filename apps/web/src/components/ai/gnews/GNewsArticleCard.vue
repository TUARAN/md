<script setup lang="ts">
import type { GNewsArticle } from '@md/shared/utils/gnews'
import { formatArticleDate, stripGNewsContentTailNote } from '@md/shared/utils/gnews'
import { ChevronDown, ChevronUp, ExternalLink, ImageOff } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { Button } from '@/components/ui/button'

const props = defineProps<{
  article: GNewsArticle
  index: number
}>()

const expanded = ref(false)
const imgFailed = ref(false)

const circleNum = computed(() => {
  const n = props.index + 1
  const circles = [`①`, `②`, `③`, `④`, `⑤`, `⑥`, `⑦`, `⑧`, `⑨`, `⑩`]
  return circles[n - 1] ?? `${n}.`
})

const title = computed(() => props.article.title?.trim() || `(无标题)`)
const sourceName = computed(() => props.article.source?.name?.trim() || `未知来源`)
const dateLabel = computed(() => props.article.publishedAt ? formatArticleDate(props.article.publishedAt) : ``)
const desc = computed(() => props.article.description?.trim() || ``)
const body = computed(() => {
  const raw = props.article.content?.trim()
  return raw ? stripGNewsContentTailNote(raw) : ``
})
const hasImage = computed(() => Boolean(props.article.image) && !imgFailed.value)

function openOriginal() {
  const href = props.article.url?.trim()
  if (!href || !/^https?:\/\//i.test(href))
    return
  window.open(href, `_blank`, `noopener,noreferrer`)
}
</script>

<template>
  <article
    class="border-border/70 bg-card hover:border-border group flex flex-col overflow-hidden rounded-lg border shadow-sm transition-colors"
  >
    <div class="flex gap-3 p-3 sm:gap-4 sm:p-4">
      <div
        v-if="hasImage"
        class="bg-muted relative hidden h-20 w-28 shrink-0 overflow-hidden rounded-md sm:block"
      >
        <img
          :src="article.image!"
          :alt="title"
          class="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          loading="lazy"
          referrerpolicy="no-referrer"
          @error="imgFailed = true"
        >
      </div>
      <div
        v-else
        class="bg-muted text-muted-foreground hidden h-20 w-28 shrink-0 items-center justify-center rounded-md sm:flex"
      >
        <ImageOff class="size-5" />
      </div>

      <div class="flex min-w-0 flex-1 flex-col gap-1.5">
        <div class="flex items-start justify-between gap-2">
          <h3 class="line-clamp-2 text-sm font-semibold leading-snug">
            <span class="text-muted-foreground mr-1 tabular-nums">{{ circleNum }}</span>
            <a
              :href="article.url"
              target="_blank"
              rel="noopener noreferrer"
              class="hover:text-primary outline-none transition-colors hover:underline focus-visible:underline"
              @click.stop
            >{{ title }}</a>
          </h3>
        </div>

        <div class="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
          <span class="bg-muted text-foreground/80 inline-flex items-center rounded px-1.5 py-0.5 font-medium">
            {{ sourceName }}
          </span>
          <span v-if="dateLabel" class="tabular-nums">{{ dateLabel }}</span>
          <button
            type="button"
            class="text-primary hover:text-primary/80 inline-flex items-center gap-0.5 outline-none transition-colors focus-visible:underline"
            @click="openOriginal"
          >
            原文 <ExternalLink class="size-3" />
          </button>
        </div>

        <p v-if="desc" class="text-foreground/90 line-clamp-2 text-xs leading-relaxed">
          {{ desc }}
        </p>

        <div v-if="body" class="flex flex-col gap-1.5">
          <Transition name="fade">
            <p
              v-if="expanded"
              class="text-muted-foreground border-primary/30 border-l-2 pl-2 text-xs leading-relaxed whitespace-pre-wrap"
            >
              {{ body }}
            </p>
          </Transition>
          <Button
            class="text-muted-foreground hover:text-foreground -ml-1 h-6 w-fit px-1.5 text-[11px]"
            size="sm"
            type="button"
            variant="ghost"
            @click="expanded = !expanded"
          >
            <component :is="expanded ? ChevronUp : ChevronDown" class="mr-0.5 size-3" />
            {{ expanded ? `收起正文节选` : `展开正文节选` }}
          </Button>
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
