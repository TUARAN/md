<script setup lang="ts">
import { ArrowRight, ExternalLink, Megaphone, Users } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { getCreatorPlatformMatrix, getWorkflowCreator } from '@/constants/creators'
import { useUIStore } from '@/stores/ui'
import { creatorPlatformMatrixRoute } from '@/utils/creatorRoutes'
import { getPlatformProfileTitle } from '@/utils/socialAccounts'
import WorkflowCreatorPicker from './WorkflowCreatorPicker.vue'
import WorkflowPageShell from './WorkflowPageShell.vue'
import WorkflowPageTitle from './WorkflowPageTitle.vue'

const uiStore = useUIStore()
const { workflowCreatorId, workflowDistributionPlatform, workflowMatrixDataSourceExpanded } = storeToRefs(uiStore)
const { setWorkflowAppPage, setWorkflowDistributionPlatform } = uiStore

const creator = computed(() => getWorkflowCreator(workflowCreatorId.value))
const matrixRows = computed(() => getCreatorPlatformMatrix(workflowCreatorId.value))

function openFullMatrix() {
  window.open(creatorPlatformMatrixRoute(workflowCreatorId.value), `_blank`, `noopener,noreferrer`)
}

function goDistribution(platformType?: string) {
  if (platformType)
    setWorkflowDistributionPlatform(platformType)
  setWorkflowAppPage(`distribution`)
}

function goContentSync() {
  setWorkflowAppPage(`sync`)
}

function selectRow(type: string) {
  setWorkflowDistributionPlatform(type)
}

function openPlatformUrl(url: string) {
  window.open(url, `_blank`, `noopener,noreferrer`)
}

function onMatrixDataSourceToggle(event: Event) {
  const details = event.target as HTMLDetailsElement
  workflowMatrixDataSourceExpanded.value = details.open
}
</script>

<template>
  <WorkflowPageShell>
    <template #header>
      <WorkflowPageTitle>
        <template #icon>
          <Users />
        </template>
        平台矩阵
      </WorkflowPageTitle>
      <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
        内容同步成稿后，按创作者
        <span class="font-mono text-foreground">{{ workflowCreatorId }}</span>
        梳理各平台账号与粉丝/阅读快照，再进入宣发活跃制定渠道策略。
      </p>
      <details
        class="mt-2 rounded-lg border border-border/50 bg-muted/10 text-xs leading-relaxed text-muted-foreground"
        :open="workflowMatrixDataSourceExpanded"
        @toggle="onMatrixDataSourceToggle"
      >
        <summary class="cursor-pointer px-3 py-2 font-medium text-foreground/90">
          数据从哪来？
        </summary>
        <div class="space-y-2 border-t border-border/40 px-3 py-2.5">
          <p>
            <span class="font-medium text-foreground">常规路径：</span>
            在浏览器安装并登录
            <span class="font-medium">COSE</span>
            与
            <span class="font-medium">CSYNC</span>
            后，于「检测账号 / 完整矩阵」页重新检测，扩展会把主页、粉丝、阅读等字段写入本地缓存，并优先展示在本表。
          </p>
          <p>
            <span class="font-medium text-foreground">限制与兜底：</span>
            部分平台无法统计全量阅读，或主页/个人中心难以稳定抓取（尤其部分大厂云社区），此时会回落到仓库中的静态快照；也支持在代码里
            <span class="font-medium">手动维护</span>
            后随版本更新。
          </p>
          <p>
            <span class="font-medium text-foreground">创作者 ID：</span>
            默认维护
            <span class="font-mono text-foreground">tuaran</span>
            （安东尼）。Fork 本仓库、改
            <code class="rounded bg-muted px-1 py-px text-[10px]">socialAccounts.ts</code>
            /
            <code class="rounded bg-muted px-1 py-px text-[10px]">creatorOffer/</code>
            后提 PR 即可接入其他创作者。
            <a
              href="https://github.com/TUARAN/md/blob/main/docs/creator-profile-urls.md"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary hover:underline"
            >详见文档</a>
          </p>
        </div>
      </details>
      <div class="mt-3">
        <WorkflowCreatorPicker />
      </div>
    </template>

    <div class="space-y-4 pb-4">
      <section v-if="creator" class="rounded-[18px] border border-border/80 bg-white/80 p-4 shadow-sm dark:bg-card">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p class="text-sm font-semibold">
              {{ creator.displayName }}
            </p>
            <p class="text-xs text-muted-foreground">
              {{ creator.subtitle }}
            </p>
          </div>
          <Button variant="outline" size="sm" @click="openFullMatrix">
            检测账号 / 完整矩阵
            <ExternalLink class="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </div>

        <div class="mt-3 max-w-2xl overflow-x-auto rounded-lg border border-border/60">
          <table class="w-full border-collapse text-sm">
            <thead>
              <tr class="border-b border-border/60 bg-muted/30 text-[10px] font-medium text-muted-foreground">
                <th class="px-3 py-2 text-left font-medium">
                  平台
                </th>
                <th class="w-[5.5rem] px-2 py-2 text-right font-medium">
                  粉丝
                </th>
                <th class="w-[5.5rem] px-2 py-2 text-right font-medium">
                  阅读
                </th>
                <th class="w-[4.25rem] px-2 py-2 text-right font-medium">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in matrixRows"
                :key="row.type"
                class="border-b border-border/40 last:border-0"
                :class="workflowDistributionPlatform === row.type ? 'bg-primary/[0.06]' : ''"
              >
                <td class="px-3 py-2">
                  <button
                    type="button"
                    class="inline-flex max-w-full items-center gap-1 text-left font-medium transition-colors"
                    :class="workflowDistributionPlatform === row.type
                      ? 'text-primary'
                      : 'text-foreground hover:text-primary'"
                    @click="selectRow(row.type)"
                  >
                    {{ getPlatformProfileTitle(row.type) }}
                    <ExternalLink
                      v-if="row.url"
                      class="h-3 w-3 shrink-0 opacity-60"
                      @click.stop="openPlatformUrl(row.url)"
                    />
                  </button>
                </td>
                <td class="px-2 py-2 text-right text-xs tabular-nums text-muted-foreground">
                  {{ row.followers }}
                </td>
                <td class="px-2 py-2 text-right text-xs tabular-nums text-muted-foreground">
                  {{ row.reads }}
                </td>
                <td class="px-2 py-2 text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    class="h-7 px-2 text-[10px]"
                    @click="goDistribution(row.type)"
                  >
                    宣发
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="mt-3 text-[11px] leading-snug text-muted-foreground">
          点击平台名可选中当前渠道；「宣发」跳转宣发活跃并加载该平台策略。数字优先来自 COSE/CSYNC 检测缓存，缺省时用仓库快照（可手动改代码更新）。
        </p>
      </section>

      <section v-else class="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        未找到创作者 <span class="font-mono">{{ workflowCreatorId }}</span> 的平台配置。
      </section>

      <section class="flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
        <Button variant="outline" size="sm" @click="goContentSync">
          上一步：内容同步
        </Button>
        <Button variant="default" size="sm" @click="goDistribution()">
          下一步：宣发活跃
          <Megaphone class="ml-1.5 h-4 w-4" />
        </Button>
        <Button
          v-if="workflowDistributionPlatform"
          variant="secondary"
          size="sm"
          @click="goDistribution(workflowDistributionPlatform)"
        >
          宣发 · {{ getPlatformProfileTitle(workflowDistributionPlatform) }}
          <ArrowRight class="ml-1.5 h-4 w-4" />
        </Button>
      </section>
    </div>
  </WorkflowPageShell>
</template>
