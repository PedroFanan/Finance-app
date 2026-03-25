'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, ArrowDownCircle, ArrowUpCircle, Tag, Settings, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props { orgSlug: string }

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: 'dashboard' },
  { label: 'Produtos', icon: Package, path: 'products' },
  { label: 'A Receber', icon: ArrowDownCircle, path: 'receivable' },
  { label: 'A Pagar', icon: ArrowUpCircle, path: 'payable' },
  { label: 'Categorias', icon: Tag, path: 'categories' },
  { label: 'Configurações', icon: Settings, path: 'settings' },
]

export default function AppSidebar({ orgSlug }: Props) {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-slate-900 flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 h-16 border-b border-slate-700">
        <TrendingUp className="h-6 w-6 text-blue-400" />
        <span className="font-bold text-white text-lg">Finance App</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const href = `/${orgSlug}/${item.path}`
          const active = pathname.startsWith(href)
          return (
            <Link
              key={item.path}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
