<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { updateProfile, updatePassword, updateSettings } from '@/api/user'
import { useToast } from '@/composables/useToast'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits(['close'])

const authStore = useAuthStore()
const { showToast } = useToast()

const activeTab = ref<'profile' | 'security' | 'preferences'>('profile')
const loading = ref(false)

const profileForm = reactive({
  username: authStore.user?.username || '',
  email: authStore.user?.email || ''
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const preferencesForm = reactive({
  preferredModel: authStore.user?.settings?.preferredModel || 'doubao-seedream-5-0-260128'
})

// Sync form with store when user data changes
watch(() => authStore.user, (newUser) => {
  if (newUser) {
    profileForm.username = newUser.username || ''
    profileForm.email = newUser.email || ''
    preferencesForm.preferredModel = newUser.settings?.preferredModel || 'doubao-seedream-5-0-260128'
  }
}, { immediate: true })

async function handleUpdateProfile() {
  if (!profileForm.username || !profileForm.email) {
    showToast('请填写完整信息', 'warning')
    return
  }
  
  loading.value = true
  try {
    const updatedUser = await updateProfile({
      username: profileForm.username,
      email: profileForm.email
    })
    authStore.setUser(updatedUser)
    showToast('个人资料已更新', 'success')
  } catch (err: any) {
    showToast(err.response?.data?.message || '更新失败', 'error')
  } finally {
    loading.value = false
  }
}

async function handleChangePassword() {
  if (!passwordForm.oldPassword || !passwordForm.newPassword) {
    showToast('请填写完整密码信息', 'warning')
    return
  }
  
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    showToast('两次输入的新密码不一致', 'warning')
    return
  }
  
  loading.value = true
  try {
    await updatePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword
    })
    showToast('密码修改成功', 'success')
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
    activeTab.value = 'profile'
  } catch (err: any) {
    showToast(err.response?.data?.message || '修改失败', 'error')
  } finally {
    loading.value = false
  }
}

async function handleUpdatePreferences() {
  loading.value = true
  try {
    await updateSettings({
      preferredModel: preferencesForm.preferredModel
    })
    if (authStore.user) {
      authStore.user.settings = {
        ...authStore.user.settings,
        preferredModel: preferencesForm.preferredModel
      }
    }
    showToast('偏好设置已更新', 'success')
  } catch (err: any) {
    showToast(err.response?.data?.message || '更新失败', 'error')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-6">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-md" @click="emit('close')"></div>
        
        <!-- Content -->
        <div class="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-white/20 dark:border-white/5 flex flex-col max-h-[calc(100vh-40px)]">
          <!-- Header -->
        <div class="px-6 py-5 border-b border-black/5 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-zinc-800/30 flex-shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-[var(--vp-primary)] to-[var(--vp-primary-soft)] flex items-center justify-center shadow-lg shadow-[var(--vp-primary)]/20">
              <div class="i-carbon-user-settings icon text-white text-xl"></div>
            </div>
            <div>
              <h3 class="text-lg font-black text-gray-800 dark:text-white tracking-tight">个人设置</h3>
              <p class="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest">Account Settings</p>
            </div>
          </div>
          <button @click="emit('close')" class="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 flex items-center justify-center text-gray-400 transition-colors border-none">
            <div class="i-carbon-close icon text-xl"></div>
          </button>
        </div>

        <!-- Tabs -->
        <div class="flex p-2 bg-gray-50/50 dark:bg-zinc-800/20 border-b border-black/5 dark:border-white/5 flex-shrink-0">
          <button 
            @click="activeTab = 'profile'"
            class="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border-none outline-none"
            :class="activeTab === 'profile' ? 'bg-white dark:bg-zinc-700 text-[var(--vp-primary)] shadow-sm' : 'text-gray-400 hover:text-gray-600'"
          >
            基本资料
          </button>
          <button 
            @click="activeTab = 'preferences'"
            class="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border-none outline-none"
            :class="activeTab === 'preferences' ? 'bg-white dark:bg-zinc-700 text-[var(--vp-primary)] shadow-sm' : 'text-gray-400 hover:text-gray-600'"
          >
            偏好设置
          </button>
          <button 
            @click="activeTab = 'security'"
            class="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border-none outline-none"
            :class="activeTab === 'security' ? 'bg-white dark:bg-zinc-700 text-[var(--vp-primary)] shadow-sm' : 'text-gray-400 hover:text-gray-600'"
          >
            安全设置
          </button>
        </div>

          <!-- Forms -->
          <div class="flex-1 overflow-y-auto p-6 no-scrollbar">
            <!-- Profile Form -->
            <div v-if="activeTab === 'profile'" class="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div class="space-y-2">
                <label class="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest ml-1">用户名</label>
                <div class="relative group">
                  <div class="absolute left-4 top-1/2 -translate-y-1/2 i-carbon-user icon text-gray-400 group-focus-within:text-[var(--vp-primary)] transition-colors"></div>
                  <input 
                    v-model="profileForm.username"
                    type="text" 
                    class="w-full pl-11 pr-4 py-3 rounded-2xl bg-gray-100/50 dark:bg-zinc-800/50 border border-transparent focus:border-[var(--vp-primary)]/30 focus:bg-white dark:focus:bg-zinc-800 transition-all outline-none text-sm font-bold dark:text-white"
                    placeholder="输入新用户名"
                  />
                </div>
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest ml-1">电子邮箱</label>
                <div class="relative group">
                  <div class="absolute left-4 top-1/2 -translate-y-1/2 i-carbon-email icon text-gray-400 group-focus-within:text-[var(--vp-primary)] transition-colors"></div>
                  <input 
                    v-model="profileForm.email"
                    type="email" 
                    class="w-full pl-11 pr-4 py-3 rounded-2xl bg-gray-100/50 dark:bg-zinc-800/50 border border-transparent focus:border-[var(--vp-primary)]/30 focus:bg-white dark:focus:bg-zinc-800 transition-all outline-none text-sm font-bold dark:text-white"
                    placeholder="输入新邮箱"
                  />
                </div>
              </div>
              <button 
                @click="handleUpdateProfile"
                :disabled="loading"
                class="w-full py-4 rounded-2xl bg-[var(--vp-primary)] text-white font-black text-sm shadow-xl shadow-[var(--vp-primary)]/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 border-none mt-4"
              >
                <span v-if="!loading">保存修改</span>
                <div v-else class="i-svg-spinners-90-ring-with-ball icon mx-auto"></div>
              </button>
            </div>

            <!-- Preferences Form -->
            <div v-else-if="activeTab === 'preferences'" class="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div class="space-y-4">
                <div class="p-4 rounded-2xl bg-violet-500/5 border border-violet-500/10">
                  <div class="flex items-center gap-2 mb-2">
                    <div class="i-carbon-image-search icon text-violet-500"></div>
                    <span class="text-xs font-bold text-violet-600 dark:text-violet-400">绘图模型选择</span>
                  </div>
                  <p class="text-[10px] text-gray-500 dark:text-zinc-400 leading-relaxed">
                    您可以选择不同的 AI 绘图模型。Seedream 5 是最新版本，Seedream 4.5 作为稳定备选。
                  </p>
                </div>

                <div class="space-y-3">
                  <label 
                    class="flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all"
                    :class="preferencesForm.preferredModel === 'doubao-seedream-5-0-260128' 
                      ? 'bg-violet-500/10 border-violet-500 shadow-lg shadow-violet-500/10' 
                      : 'bg-gray-50 dark:bg-zinc-800/50 border-transparent hover:bg-gray-100 dark:hover:bg-zinc-800'"
                  >
                    <div class="flex flex-col gap-1">
                      <span class="text-sm font-black" :class="preferencesForm.preferredModel === 'doubao-seedream-5-0-260128' ? 'text-violet-600 dark:text-violet-400' : 'text-gray-700 dark:text-zinc-300'">Seedream 5.0</span>
                      <span class="text-[10px] opacity-60">最新一代，画质更细腻，构图更合理</span>
                    </div>
                    <input 
                      type="radio" 
                      name="model" 
                      value="doubao-seedream-5-0-260128" 
                      v-model="preferencesForm.preferredModel"
                      class="hidden"
                    />
                    <div 
                      class="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                      :class="preferencesForm.preferredModel === 'doubao-seedream-5-0-260128' ? 'border-violet-500 bg-violet-500' : 'border-gray-300 dark:border-zinc-600'"
                    >
                      <div v-if="preferencesForm.preferredModel === 'doubao-seedream-5-0-260128'" class="i-carbon-checkmark text-white text-xs"></div>
                    </div>
                  </label>

                  <label 
                    class="flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all"
                    :class="preferencesForm.preferredModel === 'doubao-seedream-4-5-251128' 
                      ? 'bg-violet-500/10 border-violet-500 shadow-lg shadow-violet-500/10' 
                      : 'bg-gray-50 dark:bg-zinc-800/50 border-transparent hover:bg-gray-100 dark:hover:bg-zinc-800'"
                  >
                    <div class="flex flex-col gap-1">
                      <span class="text-sm font-black" :class="preferencesForm.preferredModel === 'doubao-seedream-4-5-251128' ? 'text-violet-600 dark:text-violet-400' : 'text-gray-700 dark:text-zinc-300'">Seedream 4.5</span>
                      <span class="text-[10px] opacity-60">经典版本，生成速度快，风格稳定</span>
                    </div>
                    <input 
                      type="radio" 
                      name="model" 
                      value="doubao-seedream-4-5-251128" 
                      v-model="preferencesForm.preferredModel"
                      class="hidden"
                    />
                    <div 
                      class="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
                      :class="preferencesForm.preferredModel === 'doubao-seedream-4-5-251128' ? 'border-violet-500 bg-violet-500' : 'border-gray-300 dark:border-zinc-600'"
                    >
                      <div v-if="preferencesForm.preferredModel === 'doubao-seedream-4-5-251128'" class="i-carbon-checkmark text-white text-xs"></div>
                    </div>
                  </label>
                </div>
              </div>

              <button 
                @click="handleUpdatePreferences"
                :disabled="loading"
                class="w-full py-4 rounded-2xl bg-[var(--vp-primary)] text-white font-black text-sm shadow-xl shadow-[var(--vp-primary)]/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 border-none mt-4"
              >
                <span v-if="!loading">保存偏好设置</span>
                <div v-else class="i-svg-spinners-90-ring-with-ball icon mx-auto"></div>
              </button>
            </div>

            <!-- Security Form -->
            <div v-else class="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div class="space-y-2">
                <label class="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest ml-1">当前密码</label>
                <div class="relative group">
                  <div class="absolute left-4 top-1/2 -translate-y-1/2 i-carbon-password icon text-gray-400 group-focus-within:text-[var(--vp-primary)] transition-colors"></div>
                  <input 
                    v-model="passwordForm.oldPassword"
                    type="password" 
                    class="w-full pl-11 pr-4 py-3 rounded-2xl bg-gray-100/50 dark:bg-zinc-800/50 border border-transparent focus:border-[var(--vp-primary)]/30 focus:bg-white dark:focus:bg-zinc-800 transition-all outline-none text-sm font-bold dark:text-white"
                    placeholder="输入当前密码以验证身份"
                  />
                </div>
              </div>
              <div class="h-px bg-black/5 dark:bg-white/5 my-2"></div>
              <div class="space-y-2">
                <label class="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest ml-1">新密码</label>
                <div class="relative group">
                  <div class="absolute left-4 top-1/2 -translate-y-1/2 i-carbon-locked icon text-gray-400 group-focus-within:text-[var(--vp-primary)] transition-colors"></div>
                  <input 
                    v-model="passwordForm.newPassword"
                    type="password" 
                    class="w-full pl-11 pr-4 py-3 rounded-2xl bg-gray-100/50 dark:bg-zinc-800/50 border border-transparent focus:border-[var(--vp-primary)]/30 focus:bg-white dark:focus:bg-zinc-800 transition-all outline-none text-sm font-bold dark:text-white"
                    placeholder="输入新密码"
                  />
                </div>
              </div>
              <div class="space-y-2">
                <label class="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest ml-1">确认新密码</label>
                <div class="relative group">
                  <div class="absolute left-4 top-1/2 -translate-y-1/2 i-carbon-checkmark icon text-gray-400 group-focus-within:text-[var(--vp-primary)] transition-colors"></div>
                  <input 
                    v-model="passwordForm.confirmPassword"
                    type="password" 
                    class="w-full pl-11 pr-4 py-3 rounded-2xl bg-gray-100/50 dark:bg-zinc-800/50 border border-transparent focus:border-[var(--vp-primary)]/30 focus:bg-white dark:focus:bg-zinc-800 transition-all outline-none text-sm font-bold dark:text-white"
                    placeholder="再次输入新密码"
                  />
                </div>
              </div>
              <button 
                @click="handleChangePassword"
                :disabled="loading"
                class="w-full py-4 rounded-2xl bg-zinc-800 dark:bg-white dark:text-zinc-900 text-white font-black text-sm shadow-xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 border-none mt-4"
              >
                <span v-if="!loading">更新密码</span>
                <div v-else class="i-svg-spinners-90-ring-with-ball icon mx-auto"></div>
              </button>
            </div>
          </div>
          
          <!-- Footer -->
          <div class="px-6 py-4 bg-gray-50/50 dark:bg-zinc-800/30 border-t border-black/5 dark:border-white/5 flex-shrink-0">
            <p class="text-[9px] text-center text-gray-400 dark:text-zinc-600 font-bold uppercase tracking-wider">
              VoicePaint Security & Privacy &bull; 2024
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active, .modal-leave-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.modal-enter-from, .modal-leave-to {
  opacity: 0;
  transform: scale(0.9) translateY(20px);
}
</style>
