<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const authStore = useAuthStore()
const { showToast } = useToast()

const email = ref('')
const password = ref('')
const loading = ref(false)
const showPassword = ref(false)

async function handleLogin() {
  if (!email.value || !password.value) {
    showToast('请填写邮箱和密码', 'error')
    return
  }
  loading.value = true
  try {
    await authStore.login(email.value, password.value)
    showToast('登录成功', 'success')
    router.push('/')
  } catch (e: any) {
    showToast(e.response?.data?.message || '登录失败', 'error')
  } finally {
    loading.value = false
  }
}

async function handleQuickLogin() {
  email.value = 'demo@example.com'
  password.value = 'DemoPassword123!'
  await handleLogin()
}
</script>

<template>
  <div class="w-full h-full flex flex-col items-center justify-center px-4">
    <div class="w-full max-w-sm py-8 overflow-y-auto no-scrollbar">
      <!-- Logo -->
      <div class="text-center mb-10">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-2xl shadow-xl shadow-violet-500/30 mb-4">
          <div class="i-carbon-paint-brush icon text-2xl text-white"></div>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">VoicePaint</h1>
        <p class="text-gray-400 mt-1 text-sm">语音驱动的 AI 绘图工具</p>
      </div>

      <!-- Card -->
      <div class="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 dark:border-zinc-800/80 p-8">

        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">欢迎回来</h2>

        <form @submit.prevent="handleLogin" class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">邮箱</label>
            <div class="relative">
              <div class="i-carbon-email icon absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></div>
              <input
                v-model="email"
                type="email"
                placeholder="your@email.com"
                class="input-base pl-11"
                autocomplete="email"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">密码</label>
            <div class="relative">
              <div class="i-carbon-password icon absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></div>
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                class="input-base pl-11 pr-11"
                autocomplete="current-password"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-xl text-gray-400 hover:text-violet-500 hover:bg-violet-500/5 dark:hover:bg-violet-400/5 transition-all duration-300 active:scale-90 border-none bg-transparent outline-none group"
              >
                <div :class="[showPassword ? 'i-carbon-view-off' : 'i-carbon-view', 'icon text-lg transition-transform group-hover:scale-110']"></div>
              </button>
            </div>
          </div>

          <button
            type="submit"
            class="btn-primary w-full py-3 mt-2 text-base"
            :disabled="loading"
          >
            <span v-if="loading" class="i-svg-spinners-90-ring-with-ball icon mr-2"></span>
            {{ loading ? '登录中...' : '登录' }}
          </button>

          <button
            type="button"
            @click="handleQuickLogin"
            class="mt-3 w-full py-2.5 text-sm rounded-xl border border-dashed border-gray-300 dark:border-zinc-700 text-gray-400 dark:text-gray-500 hover:border-violet-400 dark:hover:border-violet-600 hover:text-violet-500 dark:hover:text-violet-400 transition-all"
          >
            <div class="i-carbon-play-filled icon mr-1.5"></div>
            演示账号登录
          </button>
        </form>
      </div>

      <p class="text-center mt-6 text-sm text-gray-400">
        还没有账号？
        <router-link to="/register" class="text-violet-500 font-medium hover:text-violet-600 transition-colors">
          立即注册
        </router-link>
      </p>
    </div>
  </div>
</template>

<style scoped>
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}
.animate-float {
  animation: float 6s ease-in-out infinite;
}
</style>
