'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import ProductForm from '@/components/products/product-form'
import { getProduct } from '@/services/products'

export default function EditProductPage() {
  const params = useParams()
  const org = params.org as string
  const id = params.id as string
  const router = useRouter()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProduct(org, id).then(setProduct).finally(() => setLoading(false))
  }, [org, id])

  if (loading) return <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" /></div>

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <button onClick={() => router.back()} className="text-sm text-slate-500 hover:text-slate-700 mb-2">
          ← Voltar
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Editar Produto</h1>
      </div>
      <ProductForm org={org} product={product || undefined} onSuccess={() => router.push(`/${org}/products`)} />
    </div>
  )
}
