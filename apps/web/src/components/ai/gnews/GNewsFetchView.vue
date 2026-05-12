<script setup lang="ts">
import GNewsFetchRail from './GNewsFetchRail.vue'
import GNewsFetchResults from './GNewsFetchResults.vue'
</script>

<template>
  <div class="gnews-fetch-view flex w-full flex-col gap-6">
    <GNewsFetchRail />
    <GNewsFetchResults />
  </div>
</template>
