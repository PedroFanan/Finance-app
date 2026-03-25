'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { createTransaction } from '@/services/transactions'
import { listCategories } from '@/services/categories'

interface Category { id: string; name: string }

interface FormData {
  description: string
  amount: number
  dueDate: string
  categoryId?: string
  notes?: string
  isInstallment: boolean
  totalInstallments?: number
}

interface Props {
  org: string
  type: 'PAYABLE' | 'RECEIVABLE'
  onSuccess: () => void
}

export default function TransactionForm({ org, type, onSuccess }: Props) {
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState('')

  const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: { isInstallment: false, totalInstallments: 2 },
  })

  const isInstallment = watch('isInstallment')

  useEffect(() => { listCategories(org).then(setCategories) }, [org])

  const onSubmit = async (data: FormData) => {
    setError('')
    try {
      await createTransaction(org, {
        ...data,
        type,
        amount: Number(data.amount),
        totalInstallments: data.isInstallment ? Number(data.totalInstallments) : undefined,
      })
      onSuccess()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e?.response?.data?.message || 'Erro ao criar lançamento')
    }
  }

  const title = type === 'PAYABLE' ? 'a Pagar' : 'a Receber'

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
      {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Descrição *</label>
        <input
          {...register('description', { required: true })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={`Ex: Conta ${title}...`}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$) *</label>
          <input
            {...register('amount', { required: true })}
            type="number"
            step="0.01"
            min="0.01"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0,00"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Vencimento *</label>
          <input
            {...register('dueDate', { required: true })}
            type="date"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
        <select
          {...register('categoryId')}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">Sem categoria</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Installment toggle */}
      <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
        <input
          {...register('isInstallment')}
          id="installment"
          type="checkbox"
          className="w-4 h-4 text-blue-600 rounded"
        />
        <label htmlFor="installment" className="text-sm font-medium text-slate-700">Parcelado</label>
        {isInstallment && (
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-slate-500">Parcelas:</span>
            <input
              {...register('totalInstallments')}
              type="number"
              min="2"
              max="360"
              className="w-20 px-2 py-1 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Observações</label>
        <textarea
          {...register('notes')}
          rows={2}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Opcional..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onSuccess} className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50">
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
        >
          {isSubmitting ? 'Salvando...' : 'Criar lançamento'}
        </button>
      </div>
    </form>
  )
}
