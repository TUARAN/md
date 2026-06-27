<script setup lang="ts">
import { ChevronDown, Info } from 'lucide-vue-next'
</script>

<template>
  <details class="plugin-tip">
    <summary class="plugin-tip__summary">
      <Info class="size-3.5" />
      <span>内容同步助手 Tip</span>
      <ChevronDown class="plugin-tip__chevron size-3.5" />
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
  margin-top: 0.5rem;
  border-radius: 0.75rem;
  border: 1px solid hsl(var(--border) / 0.6);
  background: hsl(var(--muted) / 0.22);
  padding: 0.4375rem 0.625rem;
}

.plugin-tip__summary {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  color: hsl(var(--foreground));
  font-size: 0.8125rem;
  font-weight: 600;
  list-style: none;
  cursor: pointer;
  white-space: nowrap;
}

.plugin-tip__summary::-webkit-details-marker {
  display: none;
}

.plugin-tip__chevron {
  margin-left: auto;
  color: hsl(var(--muted-foreground));
  transition: transform 0.15s ease;
}

.plugin-tip[open] .plugin-tip__chevron {
  transform: rotate(180deg);
}

.plugin-tip__list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.1875rem 1rem;
  margin: 0.5rem 0 0;
  padding-left: 1rem;
  color: hsl(var(--muted-foreground));
  font-size: 0.75rem;
  line-height: 1.35;
}

@media (max-width: 767px) {
  .plugin-tip__list {
    grid-template-columns: 1fr;
  }
}
</style>
