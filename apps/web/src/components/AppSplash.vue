<script setup lang="ts">
import { APP_SPLASH_SLOGAN, APP_SPLASH_TITLE } from '@/constants/branding'

const loading = ref(true)

onMounted(() => {
  // 让首屏品牌信息看得清(原 100ms 太短,几乎无感)
  setTimeout(() => {
    loading.value = false
  }, 600)
})
</script>

<template>
  <transition name="fade">
    <div
      v-if="loading"
      class="loading"
    >
      <strong class="splash-title">{{ APP_SPLASH_TITLE }}</strong>
      <p class="splash-slogan">
        {{ APP_SPLASH_SLOGAN }}
      </p>
    </div>
  </transition>
</template>

<style lang="less" scoped>
.loading {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100vw;
  height: 100vh;
  background-color: hsl(var(--background));

  &::before {
    content: url('../assets/images/favicon.png');
    width: 160px;
    height: 160px;
    margin-bottom: 1.5rem;
  }
}

.splash-title {
  display: block;
  margin-bottom: 0.6rem;
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: hsl(var(--foreground));
}

.splash-slogan {
  margin: 0;
  max-width: 26rem;
  padding: 0 1rem;
  text-align: center;
  font-size: 1.05rem;
  font-weight: 500;
  line-height: 1.5;
  color: hsl(var(--muted-foreground));
}

@media (max-width: 640px) {
  .loading::before {
    width: 112px;
    height: 112px;
  }
  .splash-title {
    font-size: 1.5rem;
  }
  .splash-slogan {
    font-size: 0.95rem;
  }
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-to,
.fade-leave {
  opacity: 1;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 1s;
}
</style>
