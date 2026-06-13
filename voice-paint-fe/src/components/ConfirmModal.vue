<script setup lang="ts">
defineProps<{
  show: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  loading?: boolean
  confirmType?: 'primary' | 'danger'
}>()

const emit = defineEmits(['confirm', 'cancel'])
</script>

<template>
  <Transition name="fade">
    <div v-if="show" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div 
        class="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl border border-white/20 dark:border-white/5 overflow-hidden animate-in fade-in zoom-in duration-200"
      >
        <div class="flex flex-col gap-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center">
              <div class="i-carbon-warning icon text-amber-500 text-xl"></div>
            </div>
            <h3 class="text-lg font-black text-gray-800 dark:text-zinc-100 tracking-tight">{{ title }}</h3>
          </div>
          
          <p class="text-sm font-medium text-gray-500 dark:text-zinc-400 leading-relaxed">
            {{ message }}
          </p>

          <div class="flex items-center gap-3 mt-2">
            <button
              @click="emit('cancel')"
              class="flex-1 px-4 py-2.5 rounded-2xl text-sm font-bold text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 bg-gray-100 dark:bg-zinc-800 transition-all active:scale-95 border-none"
            >
              {{ cancelText || '取消' }}
            </button>
            <button
              @click="emit('confirm')"
              :disabled="loading"
              class="flex-1 px-4 py-2.5 rounded-2xl text-sm font-bold text-white shadow-lg transition-all active:scale-95 border-none flex items-center justify-center gap-2"
              :class="[
                confirmType === 'danger' 
                  ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' 
                  : 'bg-violet-500 hover:bg-violet-600 shadow-violet-500/20'
              ]"
            >
              <div v-if="loading" class="i-carbon-progress-bar-round animate-spin"></div>
              {{ confirmText || '确认' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
