<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import AppHeader from '@/components/AppHeader.vue'
import ToastContainer from '@/components/ToastContainer.vue'

const authStore = useAuthStore()

onMounted(async () => {
  if (authStore.isLoggedIn && !authStore.user) {
    await authStore.fetchProfile()
  }
})
</script>

<template>
  <div class="h-screen w-screen flex flex-col overflow-hidden bg-gradient-to-br from-gray-50 via-indigo-50/30 to-violet-50/20 dark:from-gray-950 dark:via-violet-950/20 dark:to-indigo-950/20">
    <!-- Ambient background orbs -->
    <div class="fixed inset-0 -z-10 pointer-events-none">
      <div class="absolute top-0 right-1/4 w-[600px] h-[600px] bg-violet-400/10 rounded-full blur-3xl"></div>
      <div class="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-indigo-400/10 rounded-full blur-3xl"></div>
      <div class="absolute top-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-purple-300/5 rounded-full blur-3xl"></div>
    </div>

    <!-- Loading overlay removed to allow local loading in Canvas -->

    <AppHeader />
    <main class="flex-1 overflow-y-auto lg:overflow-hidden relative no-scrollbar">
      <RouterView />
    </main>
    <ToastContainer />
  </div>
</template>

<style>
.animate-spin-slow {
  animation: spin 3s linear infinite;
}
</style>
