'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Plus, Pencil, Trash2, Tag } from 'lucide-react'
import { listCategories, createCategory, updateCategory, deleteCategory } from '@/services/categories'

interface Category { id: string; name: string; color?: string | null; icon?: string | null }

export default function CategoriesPage() {
  const params = useParams()
  const org = params.org as string

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', color: '#3b82f6' })

  const load = useCallback(async () => {
    const data = await listCategories(org)
    setCategories(data)
    setLoading(false)
  }, [org])

  useEffect(() => { load() }, [load])

  const handleAdd = async () => {
    if (!form.name.trim()) return
    await createCategory(org, form)
    setForm({ name: '', color: '#3b82f6' })
    setAdding(false)
    load()
  }

  const handleEdit = async (id: string) => {
    await updateCategory(org, id, form)
    setEditId(null)
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deletar categoria?')) return
    await deleteCategory(org, id)
    load()
  }

  const startEdit = (cat: Category) => {
    setForm({ name: cat.name, color: cat.color || '#3b82f6' })
    setEditId(cat.id)
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Categorias</h1>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Nova categoria
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Add form */}
        {adding && (
          <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border-b border-blue-100">
            <input
              type="color"
              value={form.color}
              onChange={(e) => setForm({ ...form, color: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer border-0"
            />
            <input
              autoFocus
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="Nome da categoria"
              className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button onClick={handleAdd} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm">Adicionar</button>
            <button onClick={() => setAdding(false)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm">Cancelar</button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-400">
            <Tag className="h-8 w-8 mb-2" />
            <p className="text-sm">Nenhuma categoria</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-3 px-4 py-3">
                {editId === cat.id ? (
                  <>
                    <input
                      type="color"
                      value={form.color}
                      onChange={(e) => setForm({ ...form, color: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer border-0"
                    />
                    <input
                      autoFocus
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && handleEdit(cat.id)}
                      className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button onClick={() => handleEdit(cat.id)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm">Salvar</button>
                    <button onClick={() => setEditId(null)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm">Cancelar</button>
                  </>
                ) : (
                  <>
                    <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: cat.color || '#6b7280' }} />
                    <span className="flex-1 text-sm font-medium text-slate-900">{cat.name}</span>
                    <button onClick={() => startEdit(cat)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDelete(cat.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
