import { api } from '@/lib/api'

export async function listOrgs() {
  const { data } = await api.get('/organizations')
  return data.data
}

export async function createOrg(payload: { name: string; type: 'PERSONAL' | 'COMPANY'; cnpj?: string }) {
  const { data } = await api.post('/organizations', payload)
  return data.data
}

export async function getOrg(slug: string) {
  const { data } = await api.get(`/organizations/${slug}`)
  return data.data
}

export async function updateOrg(slug: string, payload: { name?: string; logoUrl?: string | null; cnpj?: string | null }) {
  const { data } = await api.patch(`/organizations/${slug}`, payload)
  return data.data
}

export async function deleteOrg(slug: string) {
  await api.delete(`/organizations/${slug}`)
}

export async function listMembers(slug: string) {
  const { data } = await api.get(`/organizations/${slug}/members`)
  return data.data
}

export async function inviteMember(slug: string, payload: { email: string; role?: 'ADMIN' | 'MEMBER' }) {
  const { data } = await api.post(`/organizations/${slug}/members/invite`, payload)
  return data.data
}

export async function updateMemberRole(slug: string, userId: string, role: 'ADMIN' | 'MEMBER') {
  const { data } = await api.patch(`/organizations/${slug}/members/${userId}/role`, { role })
  return data.data
}

export async function removeMember(slug: string, userId: string) {
  await api.delete(`/organizations/${slug}/members/${userId}`)
}
