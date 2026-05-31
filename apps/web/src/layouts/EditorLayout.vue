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

    <main class="container-main bg-muted/40 flex min-h-0 flex-1 flex-col dark:bg-muted/15">
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

  /*
   * Mode accent — a 2px coloured strip at the very top, distinct between
   * editor and workflow. Subtle enough to ignore on focused work, present
   * enough to register peripherally when context changes.
   */
  &::before {
    content: '';
    display: block;
    height: 2px;
    flex-shrink: 0;
    transition: background-color 0.25s ease;
  }

  &[data-app-mode='editor']::before {
    background: hsl(var(--primary));
  }

  &[data-app-mode='workflow']::before {
    background: hsl(var(--muted-foreground) / 0.35);
  }
}

.container-main {
  overflow: hidden;
}
</style>
