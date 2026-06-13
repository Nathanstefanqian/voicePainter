<script setup lang="ts">
import { useToast, type ToastType } from '@/composables/useToast'

const { toasts, removeToast } = useToast()

const config: Record<ToastType, { icon: string; border: string; iconColor: string; bg: string }> = {
  success: { icon: 'i-carbon-checkmark-filled', border: 'border-emerald-200/50 dark:border-emerald-800/50', iconColor: 'text-emerald-500', bg: 'bg-emerald-50/60 dark:bg-emerald-950/40' },
  error: { icon: 'i-carbon-close-filled', border: 'border-red-200/50 dark:border-red-800/50', iconColor: 'text-red-500', bg: 'bg-red-50/60 dark:bg-red-950/40' },
  warning: { icon: 'i-carbon-warning-filled', border: 'border-amber-200/50 dark:border-amber-800/50', iconColor: 'text-amber-500', bg: 'bg-amber-50/60 dark:bg-amber-950/40' },
  info: { icon: 'i-carbon-information-filled', border: 'border-violet-200/50 dark:border-violet-800/50', iconColor: 'text-violet-500', bg: 'bg-violet-50/60 dark:bg-violet-950/40' },
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-2xl backdrop-blur-xl shadow-xl shadow-black/5 dark:shadow-black/20 ring-1 ring-black/5 dark:ring-white/5 min-w-72 max-w-96"
          :class="[config[toast.type].bg, config[toast.type].border]"
        >
          <div :class="[config[toast.type].icon, 'icon', config[toast.type].iconColor, 'text-lg', 'flex-shrink-0', 'mt-0.5']"></div>
          <span class="text-sm text-gray-700 dark:text-gray-200 flex-1 leading-relaxed">{{ toast.message }}</span>
          <button
            @click="removeToast(toast.id)"
            class="i-carbon-close icon text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm flex-shrink-0 mt-0.5 transition-colors"
          ></button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(120%) scale(0.9);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(120%) scale(0.9);
}
</style>
