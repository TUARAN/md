<script setup lang="ts">
import { computed, useSlots } from 'vue'

const props = withDefaults(
  defineProps<{
    /** false：主体纵向铺满（如内容同步页的编辑器区），不在壳层滚动 */
    scrollBody?: boolean
  }>(),
  { scrollBody: true },
)

const slots = useSlots()
const hasRail = computed(() => Boolean(slots.rail))
</script>

<template>
  <!-- 与顶栏区分的「工作区」衬底；实际内容在 surface 卡片内 -->
  <div
    class="workflow-page flex min-h-0 flex-1 flex-col overflow-hidden text-foreground"
  >
    <div
      class="workflow-page-shell-inner flex min-h-0 flex-1 flex-col px-3 pb-3 pt-2 md:px-4 md:pb-4 md:pt-3"
      :class="props.scrollBody ? `overflow-y-auto` : `min-h-0 overflow-hidden`"
    >
      <div
        class="workflow-page-shell-surface flex min-h-0 flex-1 flex-col rounded-xl border border-border/90 bg-card p-4 shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.06] md:p-5"
        :class="props.scrollBody ? `min-h-min` : `min-h-0 overflow-hidden`"
      >
        <div
          v-if="slots.header"
          class="workflow-page-shell-header mb-4 shrink-0 border-b border-border/70 pb-4"
        >
          <slot name="header" />
        </div>

        <!-- 配置区在上、占纵向空间；主内容区全宽铺开 -->
        <div
          class="workflow-page-shell-body flex min-h-0 flex-1 flex-col gap-4"
        >
          <div
            v-if="hasRail"
            class="workflow-page-shell-rail w-full shrink-0"
          >
            <slot name="rail" />
          </div>

          <div
            class="workflow-page-shell-main min-h-0 min-w-0 flex w-full flex-1 flex-col"
          >
            <slot />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
