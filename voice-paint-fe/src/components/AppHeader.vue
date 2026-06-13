<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/composables/useToast'
import UserSettingsDialog from './UserSettingsDialog.vue'

const router = useRouter()
const authStore = useAuthStore()
const { showToast } = useToast()

const showSettings = ref(false)
type Theme = 'light' | 'dark' | 'forest'
const theme = ref<Theme>('light')

onMounted(() => {
  const savedTheme = localStorage.getItem('theme') as Theme | null
  if (savedTheme) {
    theme.value = savedTheme
    document.documentElement.classList.add(savedTheme)
  } else if (document.documentElement.classList.contains('dark')) {
    theme.value = 'dark'
  }
})

function toggleTheme() {
  const themes: Theme[] = ['light', 'dark', 'forest']
  const currentIndex = themes.indexOf(theme.value)
  const nextIndex = (currentIndex + 1) % themes.length
  const nextTheme = themes[nextIndex]

  // Remove all theme classes
  document.documentElement.classList.remove('dark', 'forest')
  
  // Add next theme class if not light
  if (nextTheme !== 'light') {
    document.documentElement.classList.add(nextTheme)
  }
  
  theme.value = nextTheme
  localStorage.setItem('theme', nextTheme)
}

async function handleLogout() {
  try {
    await authStore.logout()
    showToast('已退出登录', 'info')
    router.push('/login')
  } catch {
    showToast('退出失败', 'error')
  }
}
</script>

<template>
  <header class="sticky top-0 z-40 h-16 px-6 flex items-center justify-between bg-white/70 dark:bg-zinc-950/70 backdrop-blur-xl border-b border-black/5 dark:border-white/5">
    <div class="flex items-center gap-3">
      <div class="relative w-8 h-8 flex items-center justify-center">
        <div class="absolute inset-0 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500 opacity-10 blur-sm dark:opacity-20"></div>
        <div class="relative w-8 h-8 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-lg shadow-violet-500/20">
          <div class="i-carbon-paint-brush icon text-sm text-white"></div>
        </div>
      </div>
      <h1 class="text-base font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent tracking-tight">VoicePaint</h1>
    </div>

    <div class="flex items-center gap-2 lg:gap-3">
      <!-- Theme toggle -->
      <button
        @click="toggleTheme"
        class="w-9 h-9 lg:w-10 lg:h-10 rounded-xl lg:rounded-2xl flex items-center justify-center bg-gray-100/50 dark:bg-zinc-800/50 backdrop-blur-xl hover:bg-white dark:hover:bg-zinc-800 transition-all duration-300 active:scale-90 border-none group"
        :title="theme === 'light' ? '切换到深色' : theme === 'dark' ? '切换到森林绿' : '切换到浅色'"
      >
        <div
          class="text-base transition-transform duration-500 group-hover:rotate-12"
          :class="[
            theme === 'light' ? 'i-carbon-sun text-amber-400' : 
            theme === 'dark' ? 'i-carbon-moon text-violet-400' : 
            'i-carbon-tree text-emerald-400', 
            'icon'
          ]"
        ></div>
      </button>

      <template v-if="authStore.user">
        <div 
          @click="showSettings = true"
          class="flex items-center gap-2.5 px-3 lg:px-4 py-2 rounded-xl lg:rounded-2xl bg-gray-100/50 dark:bg-zinc-800/50 backdrop-blur-xl border-none cursor-pointer hover:bg-white dark:hover:bg-zinc-800 transition-all active:scale-95 group/avatar"
        >
          <div class="w-6 h-6 lg:w-7 lg:h-7 rounded-full bg-gradient-to-br from-[var(--vp-primary)] to-[var(--vp-primary-soft)] flex items-center justify-center shadow-lg shadow-[var(--vp-primary)]/20 group-hover/avatar:scale-110 transition-transform">
            <span class="text-white text-[10px] lg:text-xs font-black">{{ authStore.user.username.charAt(0).toUpperCase() }}</span>
          </div>
          <span class="hidden sm:inline text-sm font-bold text-gray-700 dark:text-zinc-200 tracking-tight group-hover/avatar:text-[var(--vp-primary)] transition-colors">{{ authStore.user.username }}</span>
        </div>
        <button
          @click="handleLogout"
          class="flex items-center gap-2 px-3 lg:px-4 py-2 rounded-xl lg:rounded-2xl text-sm font-bold text-gray-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 bg-gray-100/50 dark:bg-zinc-800/50 backdrop-blur-xl hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-300 active:scale-95 border-none"
        >
          <div class="i-carbon-logout icon text-base"></div>
          <span class="hidden lg:inline tracking-wide">退出</span>
        </button>
      </template>
    </div>

    <!-- User Settings Dialog -->
    <UserSettingsDialog 
      :show="showSettings" 
      @close="showSettings = false" 
    />
  </header>
</template>
