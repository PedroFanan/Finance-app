'use client'

import { useEffect, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { Upload, X } from 'lucide-react'
import Image from 'next/image'
import { createProduct, updateProduct, uploadProductPhoto } from '@/services/products'
import { listCategories } from '@/services/categories'

interface Category { id: string; name: string; color?: string }

interface ProductFormData {
  name: string
  sku?: string
  description?: string
  price: number
  costPrice?: number
  weight?: number
  stockQty: number
  categoryId?: string
}

interface Props {
  org: string
  product?: { id: string; name: string; sku?: string; description?: string; price: string; costPrice?: string; weight?: string; stockQty: number; categoryId?: string; photoUrl?: string }
  onSuccess: () => void
}

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://localhost:3001'

export default function ProductForm({ org, product, onSuccess }: Props) {
  const [categories, setCategories] = useState<Category[]>([])
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(product?.photoUrl ? `${API_URL}${product.photoUrl}` : null)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<ProductFormData>({
    defaultValues: product ? {
      name: product.name,
      sku: product.sku || '',
      description: product.description || '',
      price: parseFloat(product.price),
      costPrice: product.costPrice ? parseFloat(product.costPrice) : undefined,
      weight: product.weight ? parseFloat(product.weight) : undefined,
      stockQty: product.stockQty,
      categoryId: product.categoryId || '',
    } : { stockQty: 0 },
  })

  useEffect(() => {
    listCategories(org).then(setCategories)
  }, [org])

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const onSubmit = async (data: ProductFormData) => {
    setError('')
    try {
      const payload = {
        ...data,
        price: Number(data.price),
        costPrice: data.costPrice ? Number(data.costPrice) : undefined,
        weight: data.weight ? Number(data.weight) : undefined,
        stockQty: Number(data.stockQty),
        categoryId: data.categoryId || undefined,
      }

      let saved: { id: string }
      if (product) {
        saved = await updateProduct(org, product.id, payload)
      } else {
        saved = await createProduct(org, payload)
      }

      if (photoFile) {
        await uploadProductPhoto(org, saved.id, photoFile)
      }

      onSuccess()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e?.response?.data?.message || 'Erro ao salvar produto')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>
      )}

      {/* Photo */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Foto do produto</label>
        <div className="flex items-center gap-4">
          {photoPreview ? (
            <div className="relative w-24 h-24">
              <Image src={photoPreview} alt="preview" fill className="object-cover rounded-xl" />
              <button
                type="button"
                onClick={() => { setPhotoFile(null); setPhotoPreview(null) }}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileRef.current?.click()}
              className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <Upload className="h-6 w-6 text-slate-400" />
              <span className="text-xs text-slate-400 mt-1">Upload</span>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          <p className="text-xs text-slate-400">JPG, PNG ou WebP. Máx 5MB.</p>
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Nome *</label>
        <input
          {...register('name', { required: true })}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Nome do produto"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* SKU */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">SKU / Código</label>
          <input
            {...register('sku')}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="EX-001"
          />
        </div>

        {/* Category */}
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
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Preço de venda *</label>
          <input
            {...register('price', { required: true })}
            type="number"
            step="0.01"
            min="0"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0,00"
          />
        </div>

        {/* Cost Price */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Custo</label>
          <input
            {...register('costPrice')}
            type="number"
            step="0.01"
            min="0"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0,00"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Weight */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Peso (kg)</label>
          <input
            {...register('weight')}
            type="number"
            step="0.001"
            min="0"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0,000"
          />
        </div>

        {/* Stock */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Estoque inicial</label>
          <input
            {...register('stockQty')}
            type="number"
            min="0"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
        <textarea
          {...register('description')}
          rows={3}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="Descrição opcional..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onSuccess}
          className="px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
        >
          {isSubmitting ? 'Salvando...' : product ? 'Atualizar' : 'Criar produto'}
        </button>
      </div>
    </form>
  )
}
