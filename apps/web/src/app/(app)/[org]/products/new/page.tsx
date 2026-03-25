'use client'

import { useParams, useRouter } from 'next/navigation'
import ProductForm from '@/components/products/product-form'

export default function NewProductPage() {
  const params = useParams()
  const org = params.org as string
  const router = useRouter()

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-slate-700 mb-2">
          ← Voltar
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Novo Produto</h1>
      </div>
      <ProductForm org={org} onSuccess={() => router.push(`/${org}/products`)} />
    </div>
  )
}
