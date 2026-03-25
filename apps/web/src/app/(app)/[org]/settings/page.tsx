'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { useAuth } from '@/contexts/auth-context'
import { useOrg } from '@/contexts/org-context'
import { updateOrg, listMembers, inviteMember, updateMemberRole, removeMember } from '@/services/organizations'
import { updateProfile, changePassword } from '@/services/auth'
import { UserPlus, Trash2, Shield } from 'lucide-react'

interface Member {
  id: string
  userId: string
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
  user: { id: string; name: string; email: string }
}

const roleLabels = { OWNER: 'Dono', ADMIN: 'Admin', MEMBER: 'Membro' }

export default function SettingsPage() {
  const params = useParams()
  const org = params.org as string
  const { user, refreshUser } = useAuth()
  const { org: orgData, reloadOrgs } = useOrg()

  const [members, setMembers] = useState<Member[]>([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [msg, setMsg] = useState('')
  const [passMsg, setPassMsg] = useState('')

  const orgForm = useForm({ defaultValues: { name: orgData?.name || '' } })
  const profileForm = useForm({ defaultValues: { name: user?.name || '' } })
  const passForm = useForm<{ currentPassword: string; newPassword: string }>()

  useEffect(() => {
    listMembers(org).then(setMembers)
  }, [org])

  const handleOrgUpdate = async (data: { name: string }) => {
    await updateOrg(org, data)
    await reloadOrgs()
    setMsg('Organização atualizada!')
    setTimeout(() => setMsg(''), 3000)
  }

  const handleProfileUpdate = async (data: { name: string }) => {
    await updateProfile(data)
    await refreshUser()
    setMsg('Perfil atualizado!')
    setTimeout(() => setMsg(''), 3000)
  }

  const handlePassChange = async (data: { currentPassword: string; newPassword: string }) => {
    try {
      await changePassword(data)
      passForm.reset()
      setPassMsg('Senha alterada!')
    } catch {
      setPassMsg('Senha atual incorreta.')
    }
    setTimeout(() => setPassMsg(''), 3000)
  }

  const handleInvite = async () => {
    if (!inviteEmail) return
    try {
      await inviteMember(org, { email: inviteEmail })
      setInviteEmail('')
      const m = await listMembers(org)
      setMembers(m)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      alert(e?.response?.data?.message || 'Erro ao convidar')
    }
  }

  const handleRemove = async (userId: string) => {
    if (!confirm('Remover membro?')) return
    await removeMember(org, userId)
    setMembers(await listMembers(org))
  }

  const handleRoleChange = async (userId: string, role: 'ADMIN' | 'MEMBER') => {
    await updateMemberRole(org, userId, role)
    setMembers(await listMembers(org))
  }

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Configurações</h1>

      {msg && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{msg}</div>}

      {/* Organization */}
      <section className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Organização</h2>
        <form onSubmit={orgForm.handleSubmit(handleOrgUpdate)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
            <input
              {...orgForm.register('name', { required: true })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
            Salvar
          </button>
        </form>
      </section>

      {/* Members */}
      <section className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Membros</h2>

        <div className="flex gap-2 mb-4">
          <input
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="email@exemplo.com"
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={handleInvite} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            <UserPlus className="h-4 w-4" />
            Convidar
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 py-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">{m.user.name}</p>
                <p className="text-xs text-slate-500">{m.user.email}</p>
              </div>
              {m.role === 'OWNER' ? (
                <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                  <Shield className="h-3.5 w-3.5" />
                  {roleLabels[m.role]}
                </span>
              ) : (
                <select
                  value={m.role}
                  onChange={(e) => handleRoleChange(m.userId, e.target.value as 'ADMIN' | 'MEMBER')}
                  className="px-2 py-1 border border-slate-300 rounded-lg text-xs bg-white"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="MEMBER">Membro</option>
                </select>
              )}
              {m.role !== 'OWNER' && (
                <button onClick={() => handleRemove(m.userId)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Profile */}
      <section className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Meu perfil</h2>
        <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
            <input
              {...profileForm.register('name', { required: true })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input value={user?.email || ''} disabled className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-400" />
          </div>
          <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
            Atualizar perfil
          </button>
        </form>
      </section>

      {/* Change password */}
      <section className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Alterar senha</h2>
        {passMsg && <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm mb-4">{passMsg}</div>}
        <form onSubmit={passForm.handleSubmit(handlePassChange)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Senha atual</label>
            <input {...passForm.register('currentPassword', { required: true })} type="password" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nova senha</label>
            <input {...passForm.register('newPassword', { required: true, minLength: 6 })} type="password" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
            Alterar senha
          </button>
        </form>
      </section>
    </div>
  )
}
