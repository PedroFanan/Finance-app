import { api } from '@/lib/api'

export interface ProductFilters {
  page?: number
  perPage?: number
  search?: string
  categoryId?: string
  active?: boolean
}

export async function listProducts(org: string, filters: ProductFilters = {}) {
  const params = new URLSearchParams()
  if (filters.page) params.set('page', String(filters.page))
  if (filters.perPage) params.set('perPage', String(filters.perPage))
  if (filters.search) params.set('search', filters.search)
  if (filters.categoryId) params.set('categoryId', filters.categoryId)
  if (filters.active !== undefined) params.set('active', String(filters.active))
  const { data } = await api.get(`/organizations/${org}/products?${params}`)
  return data
}

export async function getProduct(org: string, id: string) {
  const { data } = await api.get(`/organizations/${org}/products/${id}`)
  return data.data
}

export async function createProduct(org: string, payload: Record<string, unknown>) {
  const { data } = await api.post(`/organizations/${org}/products`, payload)
  return data.data
}

export async function updateProduct(org: string, id: string, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/organizations/${org}/products/${id}`, payload)
  return data.data
}

export async function deleteProduct(org: string, id: string) {
  await api.delete(`/organizations/${org}/products/${id}`)
}

export async function uploadProductPhoto(org: string, id: string, file: File) {
  const formData = new FormData()
  formData.append('photo', file)
  const { data } = await api.post(`/organizations/${org}/products/${id}/photo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data.data
}

export async function adjustStock(org: string, id: string, qty: number, operation: 'add' | 'subtract' | 'set') {
  const { data } = await api.patch(`/organizations/${org}/products/${id}/stock`, { qty, operation })
  return data.data
}
