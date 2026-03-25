import { api } from '@/lib/api'

export async function listCategories(org: string) {
  const { data } = await api.get(`/organizations/${org}/categories`)
  return data.data
}

export async function createCategory(org: string, payload: { name: string; color?: string; icon?: string }) {
  const { data } = await api.post(`/organizations/${org}/categories`, payload)
  return data.data
}

export async function updateCategory(org: string, id: string, payload: { name?: string; color?: string; icon?: string }) {
  const { data } = await api.patch(`/organizations/${org}/categories/${id}`, payload)
  return data.data
}

export async function deleteCategory(org: string, id: string) {
  await api.delete(`/organizations/${org}/categories/${id}`)
}
