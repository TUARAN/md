<script setup lang="ts">
import { Info } from 'lucide-vue-next'
</script>

<template>
  <details class="plugin-tip">
    <summary class="plugin-tip__summary" aria-label="内容同步助手说明" title="内容同步助手说明">
      <Info class="size-3.5" aria-hidden="true" />
    </summary>
    <ul class="plugin-tip__list">
      <li>Chrome / Edge 浏览器插件，可一键同步动态、文章、短视频到社交媒体或自媒体平台。</li>
      <li>使用前需要先在浏览器网页上登录各平台账号，插件才能正常工作。</li>
      <li>插件仅辅助完成点击、输入、上传等浏览器操作，不托管内容，也不接管账号管理。</li>
      <li>想支持更多平台？没问题，联系开发者增加你常用的平台。</li>
    </ul>
  </details>
</template>

<style scoped>
.plugin-tip {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
  vertical-align: middle;
}

.plugin-tip__summary {
  display: inline-flex;
  width: 1.375rem;
  height: 1.375rem;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  color: hsl(var(--muted-foreground));
  list-style: none;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.plugin-tip__summary:hover {
  background: hsl(var(--muted) / 0.55);
  color: hsl(var(--foreground));
}

.plugin-tip__summary::-webkit-details-marker {
  display: none;
}

.plugin-tip[open] .plugin-tip__summary {
  background: hsl(var(--muted) / 0.7);
  color: hsl(var(--foreground));
}

.plugin-tip__list {
  position: absolute;
  top: calc(100% + 0.375rem);
  left: 0;
  z-index: 40;
  display: grid;
  width: min(34rem, calc(100vw - 2rem));
  grid-template-columns: 1fr;
  gap: 0.25rem;
  margin: 0;
  border: 1px solid hsl(var(--border) / 0.75);
  border-radius: 0.75rem;
  background: hsl(var(--popover, var(--card)) / 0.98);
  box-shadow: 0 18px 44px hsl(var(--foreground) / 0.12);
  padding: 0.75rem 0.875rem 0.75rem 1.5rem;
  color: hsl(var(--muted-foreground));
  font-size: 0.75rem;
  line-height: 1.45;
}
</style>
