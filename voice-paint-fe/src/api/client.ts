import axios from 'axios'

const API_BASE = import.meta.env.PROD ? 'https://paintBe.nathanq.site/api' : '/api'
const LS_ACCESS = 'vp_access_token'
const LS_REFRESH = 'vp_refresh_token'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
  withCredentials: true,
})

let accessToken: string | null = localStorage.getItem(LS_ACCESS)
let refreshToken: string | null = localStorage.getItem(LS_REFRESH)

export function setAccessToken(token: string | null) {
  accessToken = token
  if (token) localStorage.setItem(LS_ACCESS, token)
  else localStorage.removeItem(LS_ACCESS)
}

export function getAccessToken() {
  return accessToken
}

export function setRefreshToken(token: string | null) {
  refreshToken = token
  if (token) localStorage.setItem(LS_REFRESH, token)
  else localStorage.removeItem(LS_REFRESH)
}

export function getRefreshToken() {
  return refreshToken
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

// 响应拦截：401 时自动刷新 Token 并重试
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as any

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const { data } = await api.post(`${API_BASE}/auth/refresh`, {}, {
          withCredentials: true,
        })
        setAccessToken(data.accessToken)
        original.headers.Authorization = `Bearer ${data.accessToken}`
        return api(original)
      } catch {
        accessToken = null
        refreshToken = null
        localStorage.removeItem(LS_ACCESS)
        localStorage.removeItem(LS_REFRESH)
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export default api
