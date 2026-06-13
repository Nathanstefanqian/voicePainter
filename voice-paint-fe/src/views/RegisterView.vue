<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const authStore = useAuthStore()
const { showToast } = useToast()

const username = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const showPassword = ref(false)

async function handleRegister() {
  if (!username.value || !email.value || !password.value) {
    showToast('请填写所有字段', 'error')
    return
  }
  if (password.value.length < 8) {
    showToast('密码至少 8 位', 'error')
    return
  }
  loading.value = true
  try {
    await authStore.register(username.value, email.value, password.value)
    showToast('注册成功，请登录', 'success')
    router.push('/login')
  } catch (e: any) {
    showToast(e.response?.data?.message || '注册失败', 'error')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="w-full h-full flex flex-col items-center justify-center px-4">
    <div class="w-full max-w-sm py-8 overflow-y-auto no-scrollbar">
      <div class="text-center mb-10">
        <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-2xl shadow-xl shadow-violet-500/30 mb-4">
          <div class="i-carbon-user-avatar icon text-2xl text-white"></div>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">VoicePaint</h1>
        <p class="text-gray-400 mt-1 text-sm">开始你的 AI 创作之旅</p>
      </div>

      <div class="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 dark:border-zinc-800/80 p-8">

        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">创建账号</h2>

        <form @submit.prevent="handleRegister" class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">用户名</label>
            <div class="relative">
              <div class="i-carbon-id icon absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></div>
              <input
                v-model="username"
                type="text"
                placeholder="painter01"
                class="input-base pl-11"
                autocomplete="username"
              />
            </div>
          </div>

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
                placeholder="至少 8 位"
                class="input-base pl-11 pr-11"
                autocomplete="new-password"
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
            {{ loading ? '注册中...' : '注册' }}
          </button>
        </form>
      </div>

      <p class="text-center mt-6 text-sm text-gray-400">
        已有账号？
        <router-link to="/login" class="text-violet-500 font-medium hover:text-violet-600 transition-colors">
          立即登录
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
