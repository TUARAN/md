<script setup lang="ts">
/**
 * WorkflowMatrixPage —— workflow 第 4 步「平台矩阵」
 *
 * 与 `/creator-profile` 路由共用 `<CreatorProfileBody />` 主体(2026-05 合并),
 * 本页只负责工作流外壳:页头标题 + 创作者切换 + 「数据从哪来」说明 + 底部
 * 「上一步/下一步」导航。卡片上多一个「宣发」按钮(workflow context),点击后
 * 把该平台写入 ui.workflowDistributionPlatform 并跳 `/distribution`。
 */
import { ArrowRight, Megaphone, Users } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import CreatorProfileBody from '@/components/creator-profile/CreatorProfileBody.vue'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/stores/ui'
import { getPlatformProfileTitle } from '@/utils/socialAccounts'
import WorkflowCreatorPicker from './WorkflowCreatorPicker.vue'
import WorkflowPageShell from './WorkflowPageShell.vue'
import WorkflowPageTitle from './WorkflowPageTitle.vue'

const uiStore = useUIStore()
const { workflowDistributionPlatform, workflowMatrixDataSourceExpanded } = storeToRefs(uiStore)
const { setWorkflowDistributionPlatform } = uiStore
const router = useRouter()

function goDistribution(platformType?: string) {
  if (platformType)
    setWorkflowDistributionPlatform(platformType)
  router.push({ name: `distribution` })
}

function goContentSync() {
  router.push({ name: `sync` })
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
        梳理各平台账号与粉丝/阅读快照，确认渠道后进入「宣发活跃」制定策略。
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
            后，于本页点「重新检测账号」(空状态下出现),扩展会把主页/粉丝/阅读写入本地缓存。
          </p>
          <p>
            <span class="font-medium text-foreground">限制与兜底：</span>
            部分平台无法统计全量阅读、或主页/个人中心难以稳定抓取，此时仅显示已缓存字段。
          </p>
          <p>
            <span class="font-medium text-foreground">创作者 ID：</span>
            默认维护 <span class="font-mono text-foreground">tuaran</span> (安东尼)。其他创作者通过
            <code class="rounded bg-muted px-1 py-px text-[10px]">socialAccounts.ts</code>
            /
            <code class="rounded bg-muted px-1 py-px text-[10px]">creatorOffer/</code>
            PR 接入。
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

    <div class="flex flex-col">
      <CreatorProfileBody
        :enable-workflow-actions="true"
        :show-stats="false"
        @select-distribution="goDistribution"
      />

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
