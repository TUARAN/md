<script setup lang="ts">
import { APP_CURRENT_STAGE, APP_SPLASH_SLOGAN, APP_SPLASH_TITLE } from '@/constants/branding'

const loading = ref(true)

onMounted(() => {
  setTimeout(() => {
    loading.value = false
  }, 100)
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
      <p class="splash-stage">
        {{ APP_CURRENT_STAGE }}
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
  font-size: 18px;
  background-color: hsl(var(--background));

  &::before {
    content: url('../assets/images/favicon.png');
    width: 100px;
    height: 100px;
    margin-bottom: 1rem;
  }
}

.splash-title {
  display: block;
  margin-bottom: 0.5rem;
}

.splash-slogan {
  margin: 0;
  max-width: 22rem;
  padding: 0 1rem;
  text-align: center;
  font-size: 0.95rem;
  font-weight: 500;
  line-height: 1.45;
  color: hsl(var(--muted-foreground));
}

.splash-stage {
  margin: 0.4rem 0 0;
  max-width: 26rem;
  padding: 0 1rem;
  text-align: center;
  font-size: 0.78rem;
  line-height: 1.4;
  color: hsl(var(--muted-foreground) / 0.75);
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
