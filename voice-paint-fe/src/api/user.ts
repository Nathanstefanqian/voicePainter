import api from './client'

export async function updateProfile(data: { username?: string; email?: string }) {
  const res = await api.patch('/auth/profile', data)
  return res.data
}

export async function updatePassword(data: { oldPassword: string; newPassword: string }) {
  const res = await api.post('/auth/change-password', data)
  return res.data
}

export async function updateSettings(settings: { preferredModel?: string; asrProvider?: string }) {
  const res = await api.post('/auth/settings', settings)
  return res.data
}

export async function getProfile() {
  const res = await api.get('/auth/profile')
  return res.data
}
