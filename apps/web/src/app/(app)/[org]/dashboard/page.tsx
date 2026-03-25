'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, Clock } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import * as dashboardService from '@/services/dashboard'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Summary {
  totalReceivable: number
  totalPayable: number
  balance: number
  pendingReceivable: number
  pendingPayable: number
}

interface MonthlyData {
  month: string
  receivable: number
  payable: number
  balance: number
}

interface Transaction {
  id: string
  description: string
  amount: string
  dueDate: string
  type: 'PAYABLE' | 'RECEIVABLE'
  category?: { name: string; color?: string }
}

export default function DashboardPage() {
  const params = useParams()
  const org = params.org as string

  const [summary, setSummary] = useState<Summary | null>(null)
  const [monthly, setMonthly] = useState<MonthlyData[]>([])
  const [upcoming, setUpcoming] = useState<Transaction[]>([])
  const [overdue, setOverdue] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      dashboardService.getSummary(org),
      dashboardService.getMonthly(org),
      dashboardService.getUpcoming(org),
      dashboardService.getOverdue(org),
    ]).then(([s, m, u, o]) => {
      setSummary(s)
      setMonthly(m)
      setUpcoming(u)
      setOverdue(o)
    }).finally(() => setLoading(false))
  }, [org])

  const monthLabels = monthly.map((m) => {
    const [y, mo] = m.month.split('-')
    return { ...m, label: `${mo}/${y.slice(2)}` }
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>

      {/* Overdue alert */}
      {overdue.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-800">
              {overdue.length} lançamento{overdue.length > 1 ? 's' : ''} vencido{overdue.length > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-red-600 mt-0.5">Verifique seus pagamentos em atraso.</p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Receitas do Mês"
          value={summary?.totalReceivable || 0}
          sub={`${formatCurrency(summary?.pendingReceivable || 0)} pendente`}
          icon={TrendingUp}
          color="green"
        />
        <SummaryCard
          title="Despesas do Mês"
          value={summary?.totalPayable || 0}
          sub={`${formatCurrency(summary?.pendingPayable || 0)} pendente`}
          icon={TrendingDown}
          color="red"
        />
        <SummaryCard
          title="Saldo do Mês"
          value={summary?.balance || 0}
          sub="receitas - despesas"
          icon={DollarSign}
          color={(summary?.balance || 0) >= 0 ? 'blue' : 'orange'}
        />
        <SummaryCard
          title="Próximos 7 dias"
          value={upcoming.reduce((acc, t) => acc + parseFloat(t.amount), 0)}
          sub={`${upcoming.length} lançamento${upcoming.length !== 1 ? 's' : ''}`}
          icon={Clock}
          color="purple"
        />
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Histórico Mensal (12 meses)</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={monthLabels} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => formatCurrency(Number(v))} />
            <Legend />
            <Bar dataKey="receivable" name="Receitas" fill="#22c55e" radius={[4, 4, 0, 0]} />
            <Bar dataKey="payable" name="Despesas" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Próximos Vencimentos (7 dias)</h2>
          <div className="space-y-3">
            {upcoming.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${tx.type === 'RECEIVABLE' ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{tx.description}</p>
                    <p className="text-xs text-slate-500">{tx.category?.name} · {formatDate(tx.dueDate)}</p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${tx.type === 'RECEIVABLE' ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.type === 'RECEIVABLE' ? '+' : '-'}{formatCurrency(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SummaryCard({ title, value, sub, icon: Icon, color }: {
  title: string; value: number; sub: string
  icon: React.ElementType; color: 'green' | 'red' | 'blue' | 'orange' | 'purple'
}) {
  const colors = {
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    blue: 'bg-blue-50 text-blue-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-slate-500">{title}</p>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900">{formatCurrency(value)}</p>
      <p className="text-xs text-slate-400 mt-1">{sub}</p>
    </div>
  )
}
