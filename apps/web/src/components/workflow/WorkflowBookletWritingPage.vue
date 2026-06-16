<script setup lang="ts">
import type { PublishLabBookletSection } from '@/constants/publishlab'
import {
  BookOpen,
  Copy,
  FileText,
} from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { computed, nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { PanelShell } from '@/components/ui/layout'
import {
  PUBLISH_LAB_BOOKLETS,
} from '@/constants/publishlab'
import { useEditorStore } from '@/stores/editor'
import { usePostStore } from '@/stores/post'
import { copyPlain } from '@/utils/clipboard'
import { toast } from '@/utils/toast'
import WorkflowPageShell from './WorkflowPageShell.vue'
import WorkflowPageTitle from './WorkflowPageTitle.vue'
import WorkflowSectionTitle from './WorkflowSectionTitle.vue'

const router = useRouter()
const postStore = usePostStore()
const editorStore = useEditorStore()
const { currentPostId } = storeToRefs(postStore)

const selectedBookletSlug = ref(PUBLISH_LAB_BOOKLETS[0]?.slug ?? ``)
const selectedSectionSlug = ref(PUBLISH_LAB_BOOKLETS[0]?.sections[0]?.slug ?? ``)

const selectedBooklet = computed(() =>
  PUBLISH_LAB_BOOKLETS.find(booklet => booklet.slug === selectedBookletSlug.value) ?? PUBLISH_LAB_BOOKLETS[0],
)

const selectedSection = computed(() =>
  selectedBooklet.value?.sections.find(section => section.slug === selectedSectionSlug.value)
  ?? selectedBooklet.value?.sections[0],
)

const selectedBookletMarkdown = computed(() => {
  const booklet = selectedBooklet.value
  if (!booklet)
    return ``
  return [
    `# ${booklet.title}`,
    ``,
    booklet.subtitle,
    ``,
    `## 写给谁`,
    ``,
    ...booklet.audience.map(item => `- ${item}`),
    ``,
    `## 读完你将`,
    ``,
    ...booklet.outcomes.map(item => `- ${item}`),
    ``,
    ...booklet.sections.map(section => section.markdown),
  ].join(`\n`)
})

async function copyMarkdown(markdown: string, label: string) {
  try {
    await copyPlain(markdown)
    toast.success(`已复制${label}`)
  }
  catch {
    toast.error(`复制失败`)
  }
}

async function createEditorPost(title: string, markdown: string) {
  const content = markdown.trim()
  if (!content) {
    toast.error(`没有可写入的内容`)
    return
  }

  postStore.addPost(title)
  const postId = currentPostId.value
  if (postId)
    postStore.updatePostContent(postId, content)

  await router.push({ name: `sync` })
  await nextTick()
  editorStore.importContent(content)
  toast.success(`已生成编辑器文稿`)
}

function createSectionPost(section: PublishLabBookletSection) {
  createEditorPost(section.title, section.markdown)
}
</script>

<template>
  <WorkflowPageShell>
    <template #header>
      <div class="min-w-0 space-y-3">
        <div class="inline-flex rounded-full border border-border/70 bg-white/70 px-2.5 py-1 text-xs font-medium text-muted-foreground dark:bg-card">
          内容同步智能体 · 小册线
        </div>
        <WorkflowPageTitle>
          <template #icon>
            <BookOpen />
          </template>
          章节生产
        </WorkflowPageTitle>
        <p class="max-w-3xl text-sm leading-relaxed text-muted-foreground">
          围绕小册目录生产章节草稿、整本 Markdown、样章和可继续分发的内容素材。
        </p>
      </div>
    </template>

    <div class="grid gap-4 pb-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <aside class="space-y-4">
        <WorkflowSectionTitle>
          小册目录
        </WorkflowSectionTitle>
        <PanelShell>
          <div class="space-y-3">
            <button
              v-for="booklet in PUBLISH_LAB_BOOKLETS"
              :key="booklet.slug"
              type="button"
              class="w-full rounded-xl border p-3 text-left transition-colors"
              :class="selectedBookletSlug === booklet.slug ? 'border-primary/50 bg-primary/5' : 'border-border/70 bg-muted/20 hover:border-primary/30'"
              @click="selectedBookletSlug = booklet.slug; selectedSectionSlug = booklet.sections[0]?.slug ?? ''"
            >
              <div class="text-sm font-semibold text-foreground">
                {{ booklet.title }}
              </div>
              <div class="mt-1 text-xs leading-relaxed text-muted-foreground">
                {{ booklet.subtitle }}
              </div>
            </button>
          </div>
        </PanelShell>

        <PanelShell v-if="selectedBooklet">
          <div class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            章节
          </div>
          <div class="mt-3 space-y-1">
            <button
              v-for="section in selectedBooklet.sections"
              :key="section.slug"
              type="button"
              class="flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left text-xs transition-colors"
              :class="selectedSectionSlug === section.slug ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'"
              @click="selectedSectionSlug = section.slug"
            >
              <BookOpen class="mt-0.5 size-3.5 shrink-0" />
              <span>{{ section.title }}</span>
            </button>
          </div>
        </PanelShell>
      </aside>

      <section v-if="selectedBooklet && selectedSection" class="space-y-4">
        <PanelShell tone="primary" radius="xl">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div class="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                {{ selectedBooklet.badge }} · {{ selectedBooklet.suggestedPrice }}
              </div>
              <h2 class="mt-3 text-xl font-semibold tracking-tight text-foreground">
                {{ selectedBooklet.title }}
              </h2>
              <p class="mt-1 text-sm leading-relaxed text-muted-foreground">
                {{ selectedBooklet.subtitle }}
              </p>
            </div>
            <div class="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="secondary" @click="copyMarkdown(selectedBookletMarkdown, '整本小册')">
                <Copy class="mr-1.5 size-3.5" />
                复制整本
              </Button>
              <Button type="button" size="sm" @click="createEditorPost(selectedBooklet.title, selectedBookletMarkdown)">
                <FileText class="mr-1.5 size-3.5" />
                生成小册草稿
              </Button>
            </div>
          </div>
        </PanelShell>

        <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
          <PanelShell radius="xl">
            <div class="flex flex-wrap items-start justify-between gap-3 border-b border-border/70 pb-4">
              <div>
                <div class="text-xs text-muted-foreground">
                  {{ selectedSection.minutes }} min
                </div>
                <h3 class="mt-1 text-lg font-semibold text-foreground">
                  {{ selectedSection.title }}
                </h3>
                <p class="mt-1 text-sm text-muted-foreground">
                  {{ selectedSection.summary }}
                </p>
              </div>
              <div class="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="secondary" @click="copyMarkdown(selectedSection.markdown, '章节 Markdown')">
                  <Copy class="mr-1.5 size-3.5" />
                  复制章节
                </Button>
                <Button type="button" size="sm" @click="createSectionPost(selectedSection)">
                  <FileText class="mr-1.5 size-3.5" />
                  生成章节草稿
                </Button>
              </div>
            </div>
            <pre class="mt-4 max-h-[520px] overflow-auto whitespace-pre-wrap break-words rounded-2xl bg-muted/40 p-4 text-sm leading-relaxed text-foreground">{{ selectedSection.markdown }}</pre>
          </PanelShell>

          <div class="space-y-4">
            <PanelShell tone="success">
              <div class="text-sm font-semibold text-foreground">
                写给谁
              </div>
              <ul class="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
                <li v-for="item in selectedBooklet.audience" :key="item">
                  {{ item }}
                </li>
              </ul>
            </PanelShell>

            <PanelShell tone="warning">
              <div class="text-sm font-semibold text-foreground">
                读完你将
              </div>
              <ul class="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
                <li v-for="item in selectedBooklet.outcomes" :key="item">
                  {{ item }}
                </li>
              </ul>
            </PanelShell>
          </div>
        </div>
      </section>
    </div>
  </WorkflowPageShell>
</template>
