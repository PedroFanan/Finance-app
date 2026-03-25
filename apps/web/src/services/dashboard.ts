import { api } from '@/lib/api'

export async function getSummary(org: string) {
  const { data } = await api.get(`/organizations/${org}/dashboard/summary`)
  return data.data
}

export async function getMonthly(org: string) {
  const { data } = await api.get(`/organizations/${org}/dashboard/monthly`)
  return data.data
}

export async function getUpcoming(org: string) {
  const { data } = await api.get(`/organizations/${org}/dashboard/upcoming`)
  return data.data
}

export async function getOverdue(org: string) {
  const { data } = await api.get(`/organizations/${org}/dashboard/overdue`)
  return data.data
}
