'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { OrgProvider } from '@/contexts/org-context'
import AppSidebar from '@/components/layout/app-sidebar'
import AppHeader from '@/components/layout/app-header'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const orgSlug = params.org as string

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!user) return null

  return (
    <OrgProvider slug={orgSlug}>
      <div className="flex h-screen bg-slate-50 overflow-hidden">
        <AppSidebar orgSlug={orgSlug} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <AppHeader orgSlug={orgSlug} />
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </OrgProvider>
  )
}
