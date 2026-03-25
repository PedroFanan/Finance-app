import { api } from '@/lib/api'

export interface LoginPayload { email: string; password: string }
export interface RegisterPayload { name: string; email: string; password: string }

export async function login(payload: LoginPayload) {
  const { data } = await api.post('/auth/login', payload)
  return data.data
}

export async function register(payload: RegisterPayload) {
  const { data } = await api.post('/auth/register', payload)
  return data.data
}

export async function logout(refreshToken: string) {
  await api.post('/auth/logout', { refreshToken })
}

export async function getMe() {
  const { data } = await api.get('/auth/me')
  return data.data
}

export async function updateProfile(payload: { name?: string; avatarUrl?: string | null }) {
  const { data } = await api.patch('/auth/me', payload)
  return data.data
}

export async function changePassword(payload: { currentPassword: string; newPassword: string }) {
  await api.patch('/auth/me/password', payload)
}
