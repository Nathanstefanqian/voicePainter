<script setup lang="ts">
import { computed } from 'vue'
import { useDrawStore } from '@/stores/drawStore'

const drawStore = useDrawStore()

const statusConfig = computed(() => {
  switch (drawStore.status) {
    case 'recording':
      return { text: '录音中...', color: 'text-red-500', bg: 'bg-red-50/80 dark:bg-red-950/40 border border-red-100/50 dark:border-red-900/50', dot: 'bg-red-500', icon: 'i-carbon-recording' }
    case 'recognizing':
      return { text: '识别语音中...', color: 'text-amber-500', bg: 'bg-amber-50/80 dark:bg-amber-950/40 border border-amber-100/50 dark:border-amber-900/50', dot: 'bg-amber-500', icon: 'i-carbon-rotate' }
    case 'thinking':
      return { text: '分析意图中...', color: 'text-indigo-500', bg: 'bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100/50 dark:border-indigo-900/50', dot: 'bg-indigo-500', icon: 'i-carbon-idea' }
    case 'generating':
      return { text: 'AI 创作中...', color: 'text-violet-500', bg: 'bg-violet-50/80 dark:bg-violet-950/40 border border-violet-100/50 dark:border-violet-900/50', dot: 'bg-violet-500', icon: 'i-svg-spinners-90-ring-with-ball' }
    case 'done':
      return { text: '创作完成', color: 'text-emerald-500', bg: 'bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-100/50 dark:border-emerald-900/50', dot: 'bg-emerald-500', icon: 'i-carbon-checkmark-filled' }
    default:
      return null
  }
})

// 只有在非 idle 状态下才显示
const isVisible = computed(() => {
  return drawStore.status !== 'idle'
})
</script>

<template>
  <Transition name="status">
    <div
      v-if="statusConfig && isVisible"
      class="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl backdrop-blur-sm transition-all"
      :class="statusConfig.bg"
    >
      <div :class="[statusConfig.icon, 'icon', statusConfig.color, statusConfig.icon === 'i-carbon-loading' || statusConfig.icon === 'i-svg-spinners-90-ring-with-ball' ? 'animate-spin' : '']"></div>
      <span class="text-sm font-medium" :class="statusConfig.color">{{ statusConfig.text }}</span>
    </div>
  </Transition>
</template>

<style scoped>
.status-enter-active,
.status-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.status-enter-from,
.status-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.96);
}
</style>
