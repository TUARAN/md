<script setup lang="ts">
import { useWorkflowCreatorContext } from '@/composables/useWorkflowCreatorContext'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'

const uiStore = useUIStore()
const { workflowCreatorId } = storeToRefs(uiStore)
const { setWorkflowCreatorId } = uiStore
const { creators } = useWorkflowCreatorContext()
const auth = useAuthStore()
</script>

<template>
  <div
    v-if="creators.length"
    class="flex flex-wrap items-center gap-2"
    role="group"
    aria-label="创作者"
  >
    <span class="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">我的标签</span>
    <div class="inline-flex flex-wrap gap-1 rounded-lg border border-border/80 bg-muted/30 p-0.5">
      <button
        v-for="creator in creators"
        :key="creator.id"
        type="button"
        class="rounded-md px-2.5 py-1 text-xs font-medium transition-colors"
        :class="workflowCreatorId === creator.id
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground'"
        @click="setWorkflowCreatorId(creator.id)"
      >
        {{ creator.displayName }}
        <span class="ml-1 font-mono text-[10px] opacity-70">{{ creator.id }}</span>
      </button>
    </div>
  </div>

  <!--
    无名片时给出明确占位，而不是静默隐藏。
    未登录 → 提示登录；已登录但还没有名片 → 提示去设置创建。
  -->
  <div
    v-else
    class="inline-flex flex-wrap items-center gap-1.5 rounded-lg border border-dashed border-border/70 bg-muted/20 px-2.5 py-1 text-[11px] text-muted-foreground"
    role="group"
    aria-label="创作者"
  >
    <span class="text-[10px] font-medium uppercase tracking-wide">我的标签</span>
    <template v-if="!auth.isAuthenticated">
      <button
        type="button"
        class="font-medium text-primary underline underline-offset-2"
        @click="auth.startLogin()"
      >
        登录后创建
      </button>
    </template>
    <template v-else>
      <RouterLink :to="{ name: 'settings', hash: '#creator' }" class="font-medium text-primary underline underline-offset-2">
        前往设置创建
      </RouterLink>
    </template>
  </div>
</template>
