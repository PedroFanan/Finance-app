'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { createOrg } from '@/services/organizations'

interface FormData {
  name: string
  type: 'PERSONAL' | 'COMPANY'
  cnpj?: string
}

export default function NewOrgPage() {
  const router = useRouter()
  const { register, handleSubmit, watch, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: { type: 'PERSONAL' },
  })
  const type = watch('type')

  const onSubmit = async (data: FormData) => {
    const org = await createOrg({ name: data.name, type: data.type, cnpj: data.cnpj || undefined })
    router.push(`/${org.slug}/dashboard`)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="mb-6">
          <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-slate-700 mb-3">← Voltar</button>
          <h1 className="text-xl font-bold text-slate-900">Nova Organização</h1>
          <p className="text-slate-500 text-sm mt-1">Crie um workspace para empresa ou uso pessoal</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome *</label>
            <input
              {...register('name', { required: true })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Minha Empresa"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
            <div className="flex gap-3">
              {(['PERSONAL', 'COMPANY'] as const).map((t) => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input {...register('type')} type="radio" value={t} className="text-blue-600" />
                  <span className="text-sm">{t === 'PERSONAL' ? 'Pessoal' : 'Empresa'}</span>
                </label>
              ))}
            </div>
          </div>

          {type === 'COMPANY' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">CNPJ</label>
              <input
                {...register('cnpj')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="00.000.000/0000-00"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
          >
            {isSubmitting ? 'Criando...' : 'Criar organização'}
          </button>
        </form>
      </div>
    </div>
  )
}
