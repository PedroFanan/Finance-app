'use client'

import { useParams, useRouter } from 'next/navigation'
import TransactionForm from '@/components/transactions/transaction-form'

export default function NewReceivablePage() {
  const params = useParams()
  const org = params.org as string
  const router = useRouter()

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-slate-700 mb-2">← Voltar</button>
        <h1 className="text-2xl font-bold text-slate-900">Nova Conta a Receber</h1>
      </div>
      <TransactionForm org={org} type="RECEIVABLE" onSuccess={() => router.push(`/${org}/receivable`)} />
    </div>
  )
}
