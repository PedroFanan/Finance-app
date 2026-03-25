'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, CheckCircle, XCircle, Clock, ChevronDown, ChevronRight } from 'lucide-react'
import * as txService from '@/services/transactions'
import { formatCurrency, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Installment {
  id: string
  number: number
  amount: string
  dueDate: string
  status: 'PENDING' | 'PAID' | 'CANCELLED'
  paidAt?: string
}

interface Transaction {
  id: string
  description: string
  amount: string
  dueDate: string
  status: 'PENDING' | 'PAID' | 'CANCELLED'
  type: 'PAYABLE' | 'RECEIVABLE'
  isInstallment: boolean
  totalInstallments?: number
  category?: { name: string }
  installments?: Installment[]
}

interface Props {
  org: string
  type: 'PAYABLE' | 'RECEIVABLE'
}

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  PAID: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-slate-100 text-slate-500',
}
const statusLabels = { PENDING: 'Pendente', PAID: 'Pago', CANCELLED: 'Cancelado' }

export default function TransactionsPage({ org, type }: Props) {
  const router = useRouter()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<'all' | 'PENDING' | 'PAID' | 'CANCELLED'>('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await txService.listTransactions(org, {
        type,
        page,
        status: status === 'all' ? undefined : status,
      })
      setTransactions(result.data)
      setTotal(result.meta.total)
    } finally {
      setLoading(false)
    }
  }, [org, type, page, status])

  useEffect(() => { load() }, [load])

  const handlePay = async (id: string) => {
    if (!confirm('Confirmar pagamento?')) return
    await txService.payTransaction(org, id)
    load()
  }

  const handlePayInstallment = async (txId: string, installmentId: string) => {
    if (!confirm('Confirmar pagamento desta parcela?')) return
    await txService.payInstallment(org, txId, installmentId)
    load()
  }

  const handleCancel = async (id: string) => {
    if (!confirm('Cancelar este lançamento?')) return
    await txService.deleteTransaction(org, id)
    load()
  }

  const title = type === 'PAYABLE' ? 'Contas a Pagar' : 'Contas a Receber'
  const newPath = `/${org}/${type === 'PAYABLE' ? 'payable' : 'receivable'}/new`
  const accentColor = type === 'RECEIVABLE' ? 'text-green-600' : 'text-red-600'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <button
          onClick={() => router.push(newPath)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          Novo lançamento
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'PENDING', 'PAID', 'CANCELLED'] as const).map((s) => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(1) }}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              status === s ? 'bg-blue-600 text-white' : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'
            )}
          >
            {s === 'all' ? 'Todos' : statusLabels[s]}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400">
            <Clock className="h-10 w-10 mb-2" />
            <p className="text-sm">Nenhum lançamento encontrado</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {transactions.map((tx) => (
              <div key={tx.id}>
                <div className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition-colors">
                  {/* Expand toggle */}
                  {tx.isInstallment ? (
                    <button
                      onClick={() => setExpanded(expanded === tx.id ? null : tx.id)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      {expanded === tx.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                  ) : (
                    <div className="w-4" />
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{tx.description}</p>
                    <p className="text-xs text-slate-400">
                      {tx.category?.name && `${tx.category.name} · `}
                      Vence: {formatDate(tx.dueDate)}
                      {tx.isInstallment && ` · ${tx.totalInstallments}x`}
                    </p>
                  </div>

                  <span className={`text-sm font-bold ${accentColor}`}>
                    {formatCurrency(tx.amount)}
                  </span>

                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[tx.status]}`}>
                    {statusLabels[tx.status]}
                  </span>

                  {tx.status === 'PENDING' && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handlePay(tx.id)}
                        title="Marcar como pago"
                        className="p-1.5 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleCancel(tx.id)}
                        title="Cancelar"
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Installments */}
                {tx.isInstallment && expanded === tx.id && (
                  <div className="bg-slate-50 border-t border-slate-100">
                    {(tx.installments || []).map((inst) => (
                      <div key={inst.id} className="flex items-center gap-4 px-8 py-2">
                        <p className="text-xs text-slate-500 w-16">Parcela {inst.number}/{tx.totalInstallments}</p>
                        <p className="text-xs text-slate-600 flex-1">Vence: {formatDate(inst.dueDate)}</p>
                        <span className="text-xs font-medium text-slate-700">{formatCurrency(inst.amount)}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[inst.status]}`}>
                          {statusLabels[inst.status]}
                        </span>
                        {inst.status === 'PENDING' && (
                          <button
                            onClick={() => handlePayInstallment(tx.id, inst.id)}
                            className="p-1 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {total > 20 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
            <p className="text-sm text-slate-500">{total} lançamentos</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-50">Anterior</button>
              <button disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)} className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg disabled:opacity-40 hover:bg-slate-50">Próximo</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
