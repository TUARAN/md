<script setup lang="ts">
import type { Component } from 'vue'
import { Code2, Copy, FileCode2, FileText, GitBranch, Github, PackageOpen, Rocket, Sparkles } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'
import { computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { PanelShell } from '@/components/ui/layout'
import { useEditorStore } from '@/stores/editor'
import { usePostStore } from '@/stores/post'
import { copyPlain } from '@/utils/clipboard'
import { toast } from '@/utils/toast'
import WorkflowPageShell from './WorkflowPageShell.vue'
import WorkflowPageTitle from './WorkflowPageTitle.vue'
import WorkflowSectionTitle from './WorkflowSectionTitle.vue'

type RepositoryStageId = `repo-idea` | `repo-plan` | `repo-build`

interface RepositoryStage {
  id: RepositoryStageId
  title: string
  subtitle: string
  icon: Component
  goal: string
  outputs: string[]
  promptFocus: string[]
}

const route = useRoute()
const router = useRouter()
const postStore = usePostStore()
const editorStore = useEditorStore()
const { currentPostId } = storeToRefs(postStore)

const repositoryStages: RepositoryStage[] = [
  {
    id: `repo-idea`,
    title: `项目选题`,
    subtitle: `找到值得开源的小工具 / 模板 / Agent 项目`,
    icon: Sparkles,
    goal: `把一个模糊想法筛成 GitHub 项目命题，明确目标用户、使用场景、差异点和最小可验证版本。`,
    outputs: [`目标用户画像`, `痛点与替代方案`, `MVP 功能边界`, `项目命名与 tagline`],
    promptFocus: [`评估项目是否值得做`, `列出 3 个可开源方向`, `判断最小功能闭环`, `给出 GitHub repo 命名建议`],
  },
  {
    id: `repo-plan`,
    title: `仓库策划`,
    subtitle: `把项目想法拆成 README、目录结构和里程碑`,
    icon: Github,
    goal: `让大模型先产出仓库规格说明，包含 README 信息架构、模块拆分、技术栈、开发任务和发布清单。`,
    outputs: [`README 大纲`, `目录结构`, `技术栈选择`, `Issue / Milestone 拆解`],
    promptFocus: [`生成 README 初稿`, `设计目录结构`, `拆解 v0.1 开发任务`, `补充安装与使用示例`],
  },
  {
    id: `repo-build`,
    title: `代码脚手架`,
    subtitle: `生成首版代码、示例、测试和发布说明`,
    icon: Code2,
    goal: `把仓库规格转成可运行的起始工程，优先生成核心文件、示例命令、测试用例和下一步迭代清单。`,
    outputs: [`核心文件清单`, `初始化命令`, `测试样例`, `Release checklist`],
    promptFocus: [`生成首版代码文件`, `补齐 package/script 配置`, `写 smoke test`, `输出发布前检查清单`],
  },
]

const activeStageId = computed<RepositoryStageId>(() => {
  const name = String(route.name ?? ``)
  if (name === `repo-idea` || name === `repo-plan` || name === `repo-build`)
    return name
  return `repo-plan`
})

const activeStage = computed(() =>
  repositoryStages.find(stage => stage.id === activeStageId.value) ?? repositoryStages[1],
)

const repoPrompt = computed(() => {
  const stage = activeStage.value
  return [
    `你是一个资深开源项目产品经理和全栈工程师。请帮我策划一个适合发布到 GitHub 的项目。`,
    ``,
    `当前阶段：${stage.title}`,
    `阶段目标：${stage.goal}`,
    ``,
    `请输出 Markdown，包含：`,
    ...stage.outputs.map((output, index) => `${index + 1}. ${output}`),
    ``,
    `项目方向：{填写你的项目想法，例如：用大模型自动生成技术周报 / GitHub Issue Agent / 开源模板生成器}`,
    `目标用户：{填写开发者、内容创作者、独立开发者、团队等}`,
    `约束条件：{填写技术栈、部署环境、时间、人力、是否开源商用等}`,
    ``,
    `要求：`,
    `- 不要泛泛而谈，要给出可执行的文件、命令、任务或 README 段落。`,
    `- 如果信息不足，先列出需要确认的问题，再给出一个合理默认方案。`,
    `- 适合直接复制到 GitHub README、Issue 或项目文档中继续修改。`,
  ].join(`\n`)
})

async function copyPrompt() {
  try {
    await copyPlain(repoPrompt.value)
    toast.success(`已复制仓库创作提示词`)
  }
  catch {
    toast.error(`复制失败`)
  }
}

async function createRepoDraft() {
  const stage = activeStage.value
  const title = `GitHub 项目 · ${stage.title}草稿`
  const content = repoPrompt.value.trim()

  postStore.addPost(title)
  const postId = currentPostId.value
  if (postId)
    postStore.updatePostContent(postId, content)

  await router.push({ name: `sync` })
  await nextTick()
  editorStore.importContent(content)
  toast.success(`已生成仓库创作文稿`)
}

function openStage(stage: RepositoryStage) {
  router.push({ name: stage.id })
}
</script>

<template>
  <WorkflowPageShell>
    <template #header>
      <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div class="min-w-0 space-y-3">
          <div class="inline-flex rounded-full border border-border/70 bg-white/70 px-2.5 py-1 text-xs font-medium text-muted-foreground dark:bg-card">
            RepoLab · 仓库线
          </div>
          <WorkflowPageTitle>
            <template #icon>
              <Github />
            </template>
            用大模型创作 GitHub 项目
          </WorkflowPageTitle>
          <p class="max-w-3xl text-sm leading-relaxed text-muted-foreground">
            从一个项目想法出发，让大模型帮你完成开源项目选题、仓库规格、README、Issue 拆解和首版代码脚手架。
          </p>
          <p class="text-sm font-medium text-foreground">
            仓库线服务于「做一个可发布的 GitHub 项目」，和文章线、小册线并列。
          </p>
        </div>

        <PanelShell>
          <div class="text-xs font-semibold uppercase text-muted-foreground">
            适合产出
          </div>
          <div class="mt-3 grid gap-2 text-sm">
            <div class="flex items-start gap-2">
              <PackageOpen class="mt-0.5 size-4 text-primary" />
              <span>开源工具、模板仓库、CLI、Agent、插件或示例项目</span>
            </div>
            <div class="flex items-start gap-2">
              <FileCode2 class="mt-0.5 size-4 text-primary" />
              <span>README、目录结构、Issue、测试样例和发布说明</span>
            </div>
            <div class="flex items-start gap-2">
              <Rocket class="mt-0.5 size-4 text-primary" />
              <span>从 v0.1 能跑起来开始，逐步迭代到可展示项目</span>
            </div>
          </div>
        </PanelShell>
      </div>
    </template>

    <div class="grid gap-4 pb-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(26rem,1fr)]">
      <section class="space-y-4">
        <WorkflowSectionTitle>
          仓库创作阶段
        </WorkflowSectionTitle>

        <div class="grid gap-3">
          <button
            v-for="stage in repositoryStages"
            :key="stage.id"
            type="button"
            class="rounded-lg border bg-card p-4 text-left shadow-sm transition-colors"
            :class="activeStageId === stage.id ? 'border-primary/50 ring-2 ring-primary/15' : 'border-border/80 hover:border-primary/35'"
            @click="openStage(stage)"
          >
            <div class="flex items-start gap-3">
              <span class="inline-flex size-10 shrink-0 items-center justify-center rounded-md border border-primary/15 bg-primary/10 text-primary">
                <component :is="stage.icon" class="size-5" />
              </span>
              <span class="min-w-0">
                <span class="block text-sm font-semibold text-foreground">{{ stage.title }}</span>
                <span class="mt-1 block text-xs leading-relaxed text-muted-foreground">{{ stage.subtitle }}</span>
              </span>
            </div>
            <p class="mt-3 text-xs leading-relaxed text-muted-foreground">
              {{ stage.goal }}
            </p>
          </button>
        </div>
      </section>

      <section class="space-y-4">
        <WorkflowSectionTitle>
          当前阶段输出
        </WorkflowSectionTitle>

        <PanelShell tone="primary" radius="xl">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div class="text-sm font-semibold text-foreground">
                {{ activeStage.title }}
              </div>
              <p class="mt-1 text-sm leading-relaxed text-muted-foreground">
                {{ activeStage.goal }}
              </p>
            </div>
            <div class="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="secondary" @click="copyPrompt">
                <Copy class="mr-1.5 size-3.5" />
                复制提示词
              </Button>
              <Button type="button" size="sm" @click="createRepoDraft">
                <FileText class="mr-1.5 size-3.5" />
                生成文稿
              </Button>
            </div>
          </div>
        </PanelShell>

        <div class="grid gap-3 sm:grid-cols-2">
          <div v-for="output in activeStage.outputs" :key="output" class="rounded-lg border border-border/70 bg-card p-3">
            <div class="flex items-center gap-2 text-sm font-semibold text-foreground">
              <GitBranch class="size-4 text-primary" />
              {{ output }}
            </div>
          </div>
        </div>

        <section class="rounded-lg border border-border/80 bg-card shadow-sm">
          <div class="border-b border-border/70 px-4 py-3">
            <div class="text-sm font-semibold text-foreground">
              大模型提示词
            </div>
            <p class="mt-1 text-xs leading-relaxed text-muted-foreground">
              复制后可直接贴到 ChatGPT、Claude、豆包或本地模型中执行。
            </p>
          </div>
          <pre class="max-h-[28rem] overflow-auto whitespace-pre-wrap break-words p-4 text-xs leading-relaxed text-muted-foreground">{{ repoPrompt }}</pre>
        </section>
      </section>

      <section class="space-y-4 xl:col-span-2">
        <WorkflowSectionTitle>
          推荐工作法
        </WorkflowSectionTitle>

        <div class="grid gap-4 lg:grid-cols-3">
          <PanelShell v-for="stage in repositoryStages" :key="stage.id">
            <div class="flex items-center gap-2 text-sm font-semibold text-foreground">
              <component :is="stage.icon" class="size-4 text-primary" />
              {{ stage.title }}
            </div>
            <div class="mt-3 flex flex-wrap gap-1.5">
              <span v-for="item in stage.promptFocus" :key="item" class="rounded-full bg-muted/50 px-2 py-1 text-[11px] text-muted-foreground">
                {{ item }}
              </span>
            </div>
          </PanelShell>
        </div>
      </section>
    </div>
  </WorkflowPageShell>
</template>
