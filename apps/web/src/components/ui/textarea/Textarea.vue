<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { useVModel } from '@vueuse/core'
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: HTMLAttributes[`class`]
  defaultValue?: string | number
  modelValue?: string | number
}>()

const emits = defineEmits<{
  (e: `update:modelValue`, payload: string | number): void
}>()

const modelValue = useVModel(props, `modelValue`, emits, {
  passive: true,
  defaultValue: props.defaultValue,
})
</script>

<template>
  <textarea v-model="modelValue" :class="cn('flex min-h-20 w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs ring-offset-background transition-colors placeholder:text-muted-foreground/75 hover:border-border focus-visible:border-primary/60 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50', props.class)" />
</template>
