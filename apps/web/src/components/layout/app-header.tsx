'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, LogOut, User, Building2, Plus } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useOrg } from '@/contexts/org-context'
import { cn } from '@/lib/utils'

interface Props { orgSlug: string }

export default function AppHeader({ orgSlug }: Props) {
  const { user, logout } = useAuth()
  const { org, orgs } = useOrg()
  const router = useRouter()
  const [orgOpen, setOrgOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const orgRef = useRef<HTMLDivElement>(null)
  const userRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (orgRef.current && !orgRef.current.contains(e.target as Node)) setOrgOpen(false)
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    await logout()
    router.replace('/login')
  }

  const handleOrgSwitch = (slug: string) => {
    setOrgOpen(false)
    router.push(`/${slug}/dashboard`)
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
      {/* Org Switcher */}
      <div className="relative" ref={orgRef}>
        <button
          onClick={() => setOrgOpen(!orgOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <div className="w-7 h-7 bg-blue-100 rounded-md flex items-center justify-center">
            <Building2 className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-slate-900 leading-none">{org?.name || orgSlug}</p>
            <p className="text-xs text-slate-500 mt-0.5">{org?.type === 'COMPANY' ? 'Empresa' : 'Pessoal'}</p>
          </div>
          <ChevronDown className="h-4 w-4 text-slate-400 ml-1" />
        </button>

        {orgOpen && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50">
            <p className="px-3 py-1.5 text-xs font-medium text-slate-400 uppercase tracking-wide">Organizações</p>
            {orgs.map((o) => (
              <button
                key={o.slug}
                onClick={() => handleOrgSwitch(o.slug)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 transition-colors',
                  o.slug === orgSlug && 'bg-blue-50 text-blue-700'
                )}
              >
                <Building2 className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left truncate">{o.name}</span>
                {o.slug === orgSlug && <span className="text-xs text-blue-500">atual</span>}
              </button>
            ))}
            <div className="border-t border-slate-100 mt-1 pt-1">
              <button
                onClick={() => { setOrgOpen(false); router.push('/new-org') }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                <Plus className="h-4 w-4" />
                Nova organização
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Menu */}
      <div className="relative" ref={userRef}>
        <button
          onClick={() => setUserOpen(!userOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-slate-600" />
          </div>
          <span className="text-sm font-medium text-slate-700">{user?.name?.split(' ')[0]}</span>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </button>

        {userOpen && (
          <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50">
            <div className="px-3 py-2 border-b border-slate-100">
              <p className="text-sm font-medium text-slate-900">{user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => { setUserOpen(false); router.push(`/${orgSlug}/settings`) }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <User className="h-4 w-4" />
              Meu perfil
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
