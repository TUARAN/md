<script setup lang="ts">
/**
 * EditorLayout
 *
 * 6 个 workflow 步骤(sync / data / creation / matrix / distribution / stats)的
 * 公共外壳:顶部 EditorHeader 包含工作流导航(内容工厂 → 6 步)和编辑器菜单。
 *
 * 路由切换时用 `<KeepAlive>` 保留各子页面状态(编辑器内容、表单输入、滚动位置等),
 * 与重构前 `v-show` 共存的行为对齐 —— 不退化用户体验。
 */
import EditorHeader from '@/components/editor/editor-header/index.vue'
</script>

<template>
  <div class="container flex flex-col">
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
}

.container-main {
  overflow: hidden;
}
</style>
