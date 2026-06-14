<script setup lang="ts">
/**
 * EditorLayout
 *
 * App shell for `/edit` and `/workflow/*`. Renders the shared header on top
 * and the routed page below. Phase 3.2 introduces `data-app-mode` so chrome
 * (header accent, future right-rail behaviour) can branch on whether the
 * user is in editor or workflow mode without splitting layouts — splitting
 * would tear down the KeepAlive cache and lose codemirror cursor/scroll
 * state across mode switches.
 *
 * Routes that don't belong here (e.g. `/pricing`, `/creator-offer/:id`)
 * mount directly without this shell.
 */
import EditorHeader from '@/components/editor/editor-header/index.vue'
import { useAppMode } from '@/composables/useAppMode'

const { mode } = useAppMode()
</script>

<template>
  <div class="container flex flex-col" :data-app-mode="mode">
    <EditorHeader />

    <main class="container-main flex min-h-0 flex-1 flex-col bg-[hsl(var(--surface-subtle))] dark:bg-background">
      <RouterView v-slot="{ Component }">
        <KeepAlive>
          <component :is="Component" />
        </KeepAlive>
      </RouterView>
    </main>
  </div>
</template>

<style lang="less" scoped>
.container {
  height: 100vh;
  min-width: 100%;
  padding: 0;
}

.container-main {
  overflow: hidden;
}
</style>
