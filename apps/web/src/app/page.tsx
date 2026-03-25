'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { listOrgs } from '@/services/organizations'

export default function RootPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace('/login')
      return
    }

    listOrgs().then((orgs) => {
      if (orgs.length > 0) {
        router.replace(`/${orgs[0].slug}/dashboard`)
      } else {
        router.replace('/login')
      }
    }).catch(() => router.replace('/login'))
  }, [user, loading, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  )
}
