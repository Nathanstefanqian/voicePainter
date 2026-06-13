<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useDrawStore } from '@/stores/drawStore'

const drawStore = useDrawStore()
const { asrProvider } = storeToRefs(drawStore)

const providers = [
  { value: 'tencent', label: '腾讯云', icon: 'i-carbon-cloud' },
  { value: 'volc', label: '火山引擎', icon: 'i-carbon-fire' },
] as const
</script>

<template>
  <div class="flex flex-col gap-2 w-full">
    <!-- Label (mobile only) -->
    <div class="flex gap-3 min-h-[14px] lg:hidden">
      <span class="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-[0.2em] ml-1.5 opacity-80 self-center whitespace-nowrap">语音识别引擎</span>
    </div>

    <!-- Button row -->
    <div class="flex gap-2 items-center w-full">
      <!-- ASR toggle buttons -->
      <div class="relative flex flex-1 p-1 bg-gray-200/30 dark:bg-zinc-900/50 backdrop-blur-3xl rounded-2xl border-none min-w-0">
        <button
          v-for="provider in providers"
          :key="provider.value"
          @click="drawStore.setAsrProvider(provider.value)"
          class="relative flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl text-xs font-bold transition-all duration-500 z-10 border-none outline-none"
          :class="asrProvider === provider.value
            ? 'text-[var(--vp-primary)] bg-white dark:bg-zinc-800 shadow-[0_4px_12px_-2px_rgba(139,92,246,0.12)]'
            : 'text-gray-400 dark:text-zinc-600 hover:text-gray-600 dark:hover:text-zinc-400 bg-transparent'"
        >
          <div :class="[provider.icon, 'icon', 'text-sm', asrProvider === provider.value ? 'scale-110 opacity-100' : 'opacity-40']"></div>
          <span class="tracking-wider whitespace-nowrap">{{ provider.label }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* No extra styles needed as we use Tailwind/UnoCSS */
</style>
