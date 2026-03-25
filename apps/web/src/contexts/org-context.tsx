'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { listOrgs, getOrg } from '@/services/organizations'

interface Org {
  id: string
  name: string
  slug: string
  type: 'PERSONAL' | 'COMPANY'
  logoUrl: string | null
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
}

interface OrgContextValue {
  org: Org | null
  orgs: Org[]
  loading: boolean
  setCurrentOrg: (slug: string) => Promise<void>
  reloadOrgs: () => Promise<void>
}

const OrgContext = createContext<OrgContextValue | null>(null)

export function OrgProvider({ children, slug }: { children: React.ReactNode; slug: string }) {
  const [org, setOrg] = useState<Org | null>(null)
  const [orgs, setOrgs] = useState<Org[]>([])
  const [loading, setLoading] = useState(true)

  const reloadOrgs = useCallback(async () => {
    try {
      const data = await listOrgs()
      setOrgs(data)
    } catch {}
  }, [])

  const setCurrentOrg = useCallback(async (orgSlug: string) => {
    try {
      const data = await getOrg(orgSlug)
      setOrg(data)
    } catch {}
  }, [])

  useEffect(() => {
    Promise.all([reloadOrgs(), setCurrentOrg(slug)]).finally(() => setLoading(false))
  }, [slug, reloadOrgs, setCurrentOrg])

  return (
    <OrgContext.Provider value={{ org, orgs, loading, setCurrentOrg, reloadOrgs }}>
      {children}
    </OrgContext.Provider>
  )
}

export function useOrg() {
  const ctx = useContext(OrgContext)
  if (!ctx) throw new Error('useOrg must be used within OrgProvider')
  return ctx
}
