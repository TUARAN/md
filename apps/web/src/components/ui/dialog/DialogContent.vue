<script setup lang="ts">
import type { DialogContentEmits, DialogContentProps } from 'radix-vue'
import type { HTMLAttributes } from 'vue'
import { X } from 'lucide-vue-next'
import {
  DialogClose,
  DialogContent,

  DialogOverlay,
  DialogPortal,
  useForwardPropsEmits,
} from 'radix-vue'
import { cn } from '@/lib/utils'

const props = defineProps<DialogContentProps & { class?: HTMLAttributes[`class`] }>()
const emits = defineEmits<DialogContentEmits>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props

  return delegated
})

const forwarded = useForwardPropsEmits(delegatedProps, emits)
</script>

<template>
  <DialogPortal>
    <DialogOverlay
      class="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-200 bg-foreground/45 backdrop-blur-[2px] dark:bg-black/70"
    />
    <DialogContent
      v-bind="forwarded"
      :class="
        cn(
          'fixed left-1/2 top-1/2 z-200 grid w-[90vw] max-w-md sm:max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border border-border/80 bg-card p-6 shadow-2xl shadow-black/10 duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95',
          props.class,
        )"
    >
      <slot />

      <DialogClose
        class="data-[state=open]:bg-accent ring-offset-background data-[state=open]:text-muted-foreground focus:ring-ring absolute right-4 top-4 rounded-md p-1 opacity-70 transition-all disabled:pointer-events-none hover:bg-accent hover:opacity-100 focus:outline-hidden focus:ring-2 focus:ring-offset-2"
      >
        <X class="h-4 w-4" />
        <span class="sr-only">Close</span>
      </DialogClose>
    </DialogContent>
  </DialogPortal>
</template>
