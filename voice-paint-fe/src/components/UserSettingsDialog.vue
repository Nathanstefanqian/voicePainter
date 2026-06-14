<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useDrawStore } from '@/stores/drawStore'
import { updateProfile, updatePassword, updateSettings } from '@/api/user'
import { useToast } from '@/composables/useToast'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits(['close'])

const authStore = useAuthStore()
const drawStore = useDrawStore()
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
  preferredModel: authStore.user?.settings?.preferredModel || 'doubao-seedream-5-0-260128',
  asrProvider: authStore.user?.settings?.asrProvider || drawStore.asrProvider || 'tencent',
  enableSound: drawStore.enableSound
})

// Sync form with store when user data changes
watch(() => authStore.user, (newUser) => {
  if (newUser) {
    profileForm.username = newUser.username || ''
    profileForm.email = newUser.email || ''
    preferencesForm.preferredModel = newUser.settings?.preferredModel || 'doubao-seedream-5-0-260128'
    preferencesForm.asrProvider = newUser.settings?.asrProvider || drawStore.asrProvider || 'tencent'
  }
}, { immediate: true })

watch(() => drawStore.enableSound, (newVal) => {
  preferencesForm.enableSound = newVal
})

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
    const settings = {
      preferredModel: preferencesForm.preferredModel,
      asrProvider: preferencesForm.asrProvider
    }
    await updateSettings(settings)
    if (authStore.user) {
      authStore.user.settings = {
        ...authStore.user.settings,
        ...settings
      }
    }
    // Update draw store
    drawStore.setAsrProvider(preferencesForm.asrProvider as 'volc' | 'tencent')
    drawStore.setEnableSound(preferencesForm.enableSound)
    
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
        <div class="flex p-1.5 bg-gray-100/50 dark:bg-zinc-800/40 border-b border-black/5 dark:border-white/5 flex-shrink-0">
          <button 
            @click="activeTab = 'profile'"
            class="flex-1 py-2 rounded-xl text-xs font-black transition-all border-none outline-none cursor-pointer"
            :class="activeTab === 'profile' ? 'bg-white dark:bg-zinc-700 text-[var(--vp-primary)] shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300'"
          >
            基本资料
          </button>
          <button 
            @click="activeTab = 'preferences'"
            class="flex-1 py-2 rounded-xl text-xs font-black transition-all border-none outline-none cursor-pointer"
            :class="activeTab === 'preferences' ? 'bg-white dark:bg-zinc-700 text-[var(--vp-primary)] shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300'"
          >
            偏好设置
          </button>
          <button 
            @click="activeTab = 'security'"
            class="flex-1 py-2 rounded-xl text-xs font-black transition-all border-none outline-none cursor-pointer"
            :class="activeTab === 'security' ? 'bg-white dark:bg-zinc-700 text-[var(--vp-primary)] shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300'"
          >
            安全设置
          </button>
        </div>

          <!-- Forms -->
          <div class="flex-1 overflow-y-auto p-8 no-scrollbar">
            <!-- Profile Form -->
            <div v-if="activeTab === 'profile'" class="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div class="space-y-3">
                <label class="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest ml-1">用户名</label>
                <div class="relative group">
                  <div class="absolute left-4 top-1/2 -translate-y-1/2 i-carbon-user icon text-gray-400 group-focus-within:text-[var(--vp-primary)] transition-colors"></div>
                  <input 
                    v-model="profileForm.username"
                    type="text" 
                    class="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-gray-100/50 dark:bg-zinc-800/60 border border-transparent focus:border-[var(--vp-primary)]/30 focus:bg-white dark:focus:bg-zinc-800 transition-all outline-none text-sm font-bold dark:text-zinc-100"
                    placeholder="输入新用户名"
                  />
                </div>
              </div>
              <div class="space-y-3">
                <label class="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest ml-1">电子邮箱</label>
                <div class="relative group">
                  <div class="absolute left-4 top-1/2 -translate-y-1/2 i-carbon-email icon text-gray-400 group-focus-within:text-[var(--vp-primary)] transition-colors"></div>
                  <input 
                    v-model="profileForm.email"
                    type="email" 
                    class="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-gray-100/50 dark:bg-zinc-800/60 border border-transparent focus:border-[var(--vp-primary)]/30 focus:bg-white dark:focus:bg-zinc-800 transition-all outline-none text-sm font-bold dark:text-zinc-100"
                    placeholder="输入新邮箱"
                  />
                </div>
              </div>
              <button 
                @click="handleUpdateProfile"
                :disabled="loading"
                class="w-full py-3.5 rounded-2xl bg-[var(--vp-primary)] text-white font-black text-xs shadow-lg shadow-[var(--vp-primary)]/20 hover:shadow-xl hover:translate-y-[-1px] active:translate-y-[0px] active:scale-[0.98] transition-all disabled:opacity-50 border-none mt-4 cursor-pointer"
              >
                <span v-if="!loading">保存修改</span>
                <div v-else class="i-svg-spinners-90-ring-with-ball icon mx-auto"></div>
              </button>
            </div>

            <!-- Preferences Form -->
            <div v-else-if="activeTab === 'preferences'" class="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <!-- ASR Provider Selection -->
              <div class="space-y-4">
                <div class="flex items-center gap-2 px-1">
                  <div class="i-carbon-microphone-filled icon text-[var(--vp-primary)] text-sm"></div>
                  <span class="text-[11px] font-black text-gray-500 dark:text-zinc-400 uppercase tracking-widest">语音识别引擎</span>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                  <label 
                    class="relative flex flex-col items-center justify-center p-5 rounded-2xl border-2 cursor-pointer transition-all overflow-hidden group"
                    :class="preferencesForm.asrProvider === 'tencent' 
                      ? 'bg-white dark:bg-white border-[var(--vp-primary)]' 
                      : 'bg-gray-100 dark:bg-zinc-800 border-transparent hover:bg-gray-200 dark:hover:bg-zinc-700'"
                  >
                    <div class="i-carbon-cloud icon text-2xl mb-2.5" :class="preferencesForm.asrProvider === 'tencent' ? 'text-[var(--vp-primary)]' : 'text-gray-400 dark:text-zinc-500'"></div>
                    <span class="text-xs font-black tracking-wide" :class="preferencesForm.asrProvider === 'tencent' ? 'text-zinc-900' : 'text-gray-600 dark:text-zinc-400'">腾讯云</span>
                    <input type="radio" value="tencent" v-model="preferencesForm.asrProvider" class="hidden" />
                    <div v-if="preferencesForm.asrProvider === 'tencent'" class="absolute top-2 right-2 w-4.5 h-4.5 rounded-full bg-[var(--vp-primary)] flex items-center justify-center">
                      <div class="i-carbon-checkmark text-white text-[10px]"></div>
                    </div>
                  </label>

                  <label 
                    class="relative flex flex-col items-center justify-center p-5 rounded-2xl border-2 cursor-pointer transition-all overflow-hidden group"
                    :class="preferencesForm.asrProvider === 'volc' 
                      ? 'bg-white dark:bg-white border-[var(--vp-primary)]' 
                      : 'bg-gray-100 dark:bg-zinc-800 border-transparent hover:bg-gray-200 dark:hover:bg-zinc-700'"
                  >
                    <div class="i-carbon-fire icon text-2xl mb-2.5" :class="preferencesForm.asrProvider === 'volc' ? 'text-[var(--vp-primary)]' : 'text-gray-400 dark:text-zinc-500'"></div>
                    <span class="text-xs font-black tracking-wide" :class="preferencesForm.asrProvider === 'volc' ? 'text-zinc-900' : 'text-gray-600 dark:text-zinc-400'">火山引擎</span>
                    <input type="radio" value="volc" v-model="preferencesForm.asrProvider" class="hidden" />
                    <div v-if="preferencesForm.asrProvider === 'volc'" class="absolute top-2 right-2 w-4.5 h-4.5 rounded-full bg-[var(--vp-primary)] flex items-center justify-center">
                      <div class="i-carbon-checkmark text-white text-[10px]"></div>
                    </div>
                  </label>
                </div>
              </div>

              <!-- Interaction Sound -->
              <div class="space-y-4">
                <div class="flex items-center gap-2 px-1">
                  <div class="i-carbon-volume-up-filled icon text-[var(--vp-primary)] text-sm"></div>
                  <span class="text-[11px] font-black text-gray-500 dark:text-zinc-400 uppercase tracking-widest">交互音效</span>
                </div>

                <label 
                  class="flex items-center justify-between p-5 rounded-2xl border-2 cursor-pointer transition-all group"
                  :class="preferencesForm.enableSound 
                    ? 'bg-white dark:bg-white border-[var(--vp-primary)]' 
                    : 'bg-gray-100 dark:bg-zinc-800 border-transparent hover:bg-gray-200 dark:hover:bg-zinc-700'"
                >
                  <div class="flex flex-col gap-1.5">
                    <span class="text-sm font-black tracking-tight" :class="preferencesForm.enableSound ? 'text-zinc-900' : 'text-gray-700 dark:text-zinc-200'">开启反馈音效</span>
                    <span class="text-[11px] font-bold leading-tight" :class="preferencesForm.enableSound ? 'text-zinc-600' : 'text-gray-500 dark:text-zinc-400'">在识别成功、绘图完成等关键节点播放提示音</span>
                  </div>
                  <div class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" v-model="preferencesForm.enableSound" class="sr-only peer">
                    <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-[var(--vp-primary)]"></div>
                  </div>
                </label>
              </div>

              <!-- Model Selection -->
              <div class="space-y-4">
                <div class="flex items-center gap-2 px-1">
                  <div class="i-carbon-image-search icon text-[var(--vp-primary)] text-sm"></div>
                  <span class="text-[11px] font-black text-gray-500 dark:text-zinc-400 uppercase tracking-widest">绘图模型选择</span>
                </div>

                <div class="space-y-4">
                  <label 
                    class="flex items-center justify-between p-5 rounded-2xl border-2 cursor-pointer transition-all group"
                    :class="preferencesForm.preferredModel === 'doubao-seedream-5-0-260128' 
                      ? 'bg-white dark:bg-white border-[var(--vp-primary)]' 
                      : 'bg-gray-100 dark:bg-zinc-800 border-transparent hover:bg-gray-200 dark:hover:bg-zinc-700'"
                  >
                    <div class="flex flex-col gap-1.5">
                      <span class="text-sm font-black tracking-tight" :class="preferencesForm.preferredModel === 'doubao-seedream-5-0-260128' ? 'text-zinc-900' : 'text-gray-700 dark:text-zinc-200'">Seedream 5.0</span>
                      <span class="text-[11px] font-bold leading-tight" :class="preferencesForm.preferredModel === 'doubao-seedream-5-0-260128' ? 'text-zinc-600' : 'text-gray-500 dark:text-zinc-400'">最新一代，画质更细腻，构图更合理</span>
                    </div>
                    <input 
                      type="radio" 
                      name="model" 
                      value="doubao-seedream-5-0-260128" 
                      v-model="preferencesForm.preferredModel"
                      class="hidden"
                    />
                    <div 
                      class="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ml-4"
                      :class="preferencesForm.preferredModel === 'doubao-seedream-5-0-260128' ? 'border-[var(--vp-primary)] bg-[var(--vp-primary)]' : 'border-gray-300 dark:border-zinc-600'"
                    >
                      <div v-if="preferencesForm.preferredModel === 'doubao-seedream-5-0-260128'" class="i-carbon-checkmark text-white text-xs"></div>
                    </div>
                  </label>

                  <label 
                    class="flex items-center justify-between p-5 rounded-2xl border-2 cursor-pointer transition-all group"
                    :class="preferencesForm.preferredModel === 'doubao-seedream-4-5-251128' 
                      ? 'bg-white dark:bg-white border-[var(--vp-primary)]' 
                      : 'bg-gray-100 dark:bg-zinc-800 border-transparent hover:bg-gray-200 dark:hover:bg-zinc-700'"
                  >
                    <div class="flex flex-col gap-1.5">
                      <span class="text-sm font-black tracking-tight" :class="preferencesForm.preferredModel === 'doubao-seedream-4-5-251128' ? 'text-zinc-900' : 'text-gray-700 dark:text-zinc-200'">Seedream 4.5</span>
                      <span class="text-[11px] font-bold leading-tight" :class="preferencesForm.preferredModel === 'doubao-seedream-4-5-251128' ? 'text-zinc-600' : 'text-gray-500 dark:text-zinc-400'">经典版本，生成速度快，风格稳定</span>
                    </div>
                    <input 
                      type="radio" 
                      name="model" 
                      value="doubao-seedream-4-5-251128" 
                      v-model="preferencesForm.preferredModel"
                      class="hidden"
                    />
                    <div 
                      class="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ml-4"
                      :class="preferencesForm.preferredModel === 'doubao-seedream-4-5-251128' ? 'border-[var(--vp-primary)] bg-[var(--vp-primary)]' : 'border-gray-300 dark:border-zinc-600'"
                    >
                      <div v-if="preferencesForm.preferredModel === 'doubao-seedream-4-5-251128'" class="i-carbon-checkmark text-white text-xs"></div>
                    </div>
                  </label>
                </div>
              </div>

              <button 
                @click="handleUpdatePreferences"
                :disabled="loading"
                class="w-full py-3.5 rounded-2xl bg-[var(--vp-primary)] text-white font-black text-xs shadow-lg shadow-[var(--vp-primary)]/20 hover:shadow-xl hover:translate-y-[-1px] active:translate-y-[0px] active:scale-[0.98] transition-all disabled:opacity-50 border-none mt-4 cursor-pointer"
              >
                <span v-if="!loading">保存偏好设置</span>
                <div v-else class="i-svg-spinners-90-ring-with-ball icon mx-auto"></div>
              </button>
            </div>

            <!-- Security Form -->
            <div v-else class="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div class="space-y-3">
                <label class="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest ml-1">当前密码</label>
                <div class="relative group">
                  <div class="absolute left-4 top-1/2 -translate-y-1/2 i-carbon-password icon text-gray-400 group-focus-within:text-[var(--vp-primary)] transition-colors"></div>
                  <input 
                    v-model="passwordForm.oldPassword"
                    type="password" 
                    class="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-gray-100/50 dark:bg-zinc-800/60 border border-transparent focus:border-[var(--vp-primary)]/30 focus:bg-white dark:focus:bg-zinc-800 transition-all outline-none text-sm font-bold dark:text-zinc-100"
                    placeholder="输入当前密码以验证身份"
                  />
                </div>
              </div>
              <div class="h-px bg-black/5 dark:bg-white/5 my-2"></div>
              <div class="space-y-3">
                <label class="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest ml-1">新密码</label>
                <div class="relative group">
                  <div class="absolute left-4 top-1/2 -translate-y-1/2 i-carbon-locked icon text-gray-400 group-focus-within:text-[var(--vp-primary)] transition-colors"></div>
                  <input 
                    v-model="passwordForm.newPassword"
                    type="password" 
                    class="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-gray-100/50 dark:bg-zinc-800/60 border border-transparent focus:border-[var(--vp-primary)]/30 focus:bg-white dark:focus:bg-zinc-800 transition-all outline-none text-sm font-bold dark:text-zinc-100"
                    placeholder="输入新密码"
                  />
                </div>
              </div>
              <div class="space-y-3">
                <label class="text-[10px] font-black text-gray-400 dark:text-zinc-500 uppercase tracking-widest ml-1">确认新密码</label>
                <div class="relative group">
                  <div class="absolute left-4 top-1/2 -translate-y-1/2 i-carbon-checkmark icon text-gray-400 group-focus-within:text-[var(--vp-primary)] transition-colors"></div>
                  <input 
                    v-model="passwordForm.confirmPassword"
                    type="password" 
                    class="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-gray-100/50 dark:bg-zinc-800/60 border border-transparent focus:border-[var(--vp-primary)]/30 focus:bg-white dark:focus:bg-zinc-800 transition-all outline-none text-sm font-bold dark:text-zinc-100"
                    placeholder="再次输入新密码"
                  />
                </div>
              </div>
              <button 
                @click="handleChangePassword"
                :disabled="loading"
                class="w-full py-3.5 rounded-2xl bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 text-white font-black text-xs shadow-lg hover:shadow-xl hover:translate-y-[-1px] active:translate-y-[0px] active:scale-[0.98] transition-all disabled:opacity-50 border-none mt-4 cursor-pointer"
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
