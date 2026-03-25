import { api } from '@/lib/api'

export interface TransactionFilters {
  page?: number
  perPage?: number
  type?: 'PAYABLE' | 'RECEIVABLE'
  status?: 'PENDING' | 'PAID' | 'CANCELLED'
  categoryId?: string
  from?: string
  to?: string
}

export async function listTransactions(org: string, filters: TransactionFilters = {}) {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => { if (v !== undefined) params.set(k, String(v)) })
  const { data } = await api.get(`/organizations/${org}/transactions?${params}`)
  return data
}

export async function getTransaction(org: string, id: string) {
  const { data } = await api.get(`/organizations/${org}/transactions/${id}`)
  return data.data
}

export async function createTransaction(org: string, payload: Record<string, unknown>) {
  const { data } = await api.post(`/organizations/${org}/transactions`, payload)
  return data.data
}

export async function updateTransaction(org: string, id: string, payload: Record<string, unknown>) {
  const { data } = await api.patch(`/organizations/${org}/transactions/${id}`, payload)
  return data.data
}

export async function deleteTransaction(org: string, id: string) {
  await api.delete(`/organizations/${org}/transactions/${id}`)
}

export async function payTransaction(org: string, id: string) {
  const { data } = await api.patch(`/organizations/${org}/transactions/${id}/pay`)
  return data.data
}

export async function payInstallment(org: string, txId: string, installmentId: string) {
  const { data } = await api.patch(`/organizations/${org}/transactions/${txId}/installments/${installmentId}/pay`)
  return data.data
}
