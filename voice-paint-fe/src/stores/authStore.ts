import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api, { setAccessToken, getAccessToken, setRefreshToken } from '@/api/client'

export interface User {
  userId: string
  username: string
  email: string
  role: 'user' | 'admin'
  settings?: {
    preferredModel?: string
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(getAccessToken())
  const loading = ref(false)

  if (token.value) setAccessToken(token.value)

  const isLoggedIn = computed(() => !!token.value)

  function setToken(newToken: string) {
    token.value = newToken
    setAccessToken(newToken)
  }

  function clearToken() {
    token.value = null
    setAccessToken(null)
    setRefreshToken(null)
  }

  function setUser(newUser: User) {
    user.value = newUser
  }

  async function login(email: string, password: string) {
    loading.value = true
    try {
      const response = await api.post('/auth/login', { email, password }, {
        withCredentials: true,
      })
      const data = response.data
      setToken(data.accessToken)
      // refreshToken 由后端通过 HttpOnly Cookie 管理，前端无需存储
      setUser(data.user)
      return data
    } finally {
      loading.value = false
    }
  }

  async function register(username: string, email: string, password: string) {
    loading.value = true
    try {
      const response = await api.post('/auth/register', { username, email, password })
      return response.data
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    try {
      await api.post('/auth/logout', {}, {
        withCredentials: true,
      })
    } finally {
      clearToken()
      user.value = null
    }
  }

  async function fetchProfile() {
    if (!token.value) return
    try {
      const response = await api.get('/auth/profile')
      user.value = response.data
    } catch {
      clearToken()
      user.value = null
    }
  }

  return {
    user,
    token,
    loading,
    isLoggedIn,
    setToken,
    clearToken,
    setUser,
    login,
    register,
    logout,
    fetchProfile,
  }
})
