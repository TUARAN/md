<script setup lang="ts">
/**
 * AssistDrawer —— 分发优先 IA 的「助手」入口。
 *
 * 分发是主视角；过去占顶栏的上游步骤（提炼 / 创作 / 选题 / 复盘）降级到
 * 这里，按当前内容类型列出。点开就是「没思路？获取灵感 / 用模版创作」的
 * 二级入口，进入仍复用既有的 `Workflow*Page`。
 */
import { Lightbulb } from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { contentTypeOfRoute, getContentType } from '@/constants/contentTypes'

const props = withDefaults(defineProps<{
  floating?: boolean
}>(), {
  floating: false,
})

const router = useRouter()
const route = useRoute()
const open = ref(false)

const contentType = computed(() => getContentType(contentTypeOfRoute(String(route.name ?? ``))))
const steps = computed(() => contentType.value.assistSteps)
const activeStep = computed(() => String(route.name ?? ``))

function goStep(routeName: string) {
  open.value = false
  if (routeName !== activeStep.value)
    router.push({ name: routeName })
}
</script>

<template>
  <Popover v-model:open="open">
    <PopoverTrigger as-child>
      <Button
        type="button"
        :variant="props.floating ? `outline` : `ghost`"
        :size="props.floating ? `sm` : `xs`"
        class="shrink-0 gap-1.5"
        :class="props.floating
          ? ['assist-floating-trigger', { 'assist-floating-trigger--open': open }]
          : ['text-muted-foreground/80 hover:text-foreground', { 'text-foreground': open }]"
        aria-label="创作助手"
      >
        <Lightbulb :class="props.floating ? `size-5` : `h-3.5 w-3.5`" />
        <span :class="props.floating ? `text-sm font-semibold` : `text-xs`">助手</span>
      </Button>
    </PopoverTrigger>
    <PopoverContent
      :side="props.floating ? `left` : `bottom`"
      :align="props.floating ? `center` : `end`"
      :side-offset="props.floating ? 12 : 8"
      class="w-72 p-0"
    >
      <div class="border-b border-border/70 px-3 py-2.5">
        <p class="text-sm font-semibold">
          {{ contentType.label }}创作助手
        </p>
        <p class="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          没思路？获取灵感、用模版创作，再回到分发。
        </p>
      </div>
      <nav class="grid gap-0.5 p-1.5">
        <button
          v-for="step in steps"
          :key="step.routeName"
          type="button"
          class="flex items-start gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors"
          :class="step.routeName === activeStep
            ? 'bg-primary/[0.08] text-primary'
            : 'text-foreground hover:bg-muted/60'"
          @click="goStep(step.routeName)"
        >
          <component :is="step.icon" class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span class="min-w-0">
            <span class="block text-sm font-medium">{{ step.label }}</span>
            <span class="mt-0.5 block text-[11px] leading-snug text-muted-foreground">{{ step.hint }}</span>
          </span>
        </button>
      </nav>
    </PopoverContent>
  </Popover>
</template>

<style lang="less" scoped>
.assist-floating-trigger {
  height: 2.75rem;
  padding: 0 1rem 0 0.875rem;
  border-right: 0;
  border-radius: 999px 0 0 999px;
  background: hsl(var(--card) / 0.96);
  color: hsl(var(--foreground));
  box-shadow: 0 10px 28px hsl(var(--foreground) / 0.12);
  backdrop-filter: blur(12px) saturate(130%);

  &:hover,
  &--open {
    border-color: hsl(var(--primary) / 0.45);
    background: hsl(var(--card));
    color: hsl(var(--primary));
    box-shadow: 0 14px 34px hsl(var(--foreground) / 0.16);
  }
}
</style>
