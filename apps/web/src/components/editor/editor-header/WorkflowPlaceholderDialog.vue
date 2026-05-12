<script setup lang="ts">
const props = defineProps<{
  visible: boolean
  title: string
  body: string
}>()

const emit = defineEmits([`close`])

function onUpdate(val: boolean) {
  if (!val)
    emit(`close`)
}
</script>

<template>
  <Dialog :open="props.visible" @update:open="onUpdate">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>{{ title }}</DialogTitle>
      </DialogHeader>
      <p class="text-sm leading-relaxed text-muted-foreground">
        {{ body }}
      </p>
      <DialogFooter>
        <Button variant="outline" @click="emit('close')">
          关闭
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
