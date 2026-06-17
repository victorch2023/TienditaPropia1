import { useEffect, useState } from 'react'
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../../services/categories'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { slugify } from '../../utils/money'
import { toDirectImageUrl } from '../../utils/driveImageUrl'
import type { Category } from '../../types'

export function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [order, setOrder] = useState(0)
  const [imageUrl, setImageUrl] = useState('')

  const load = () => {
    setLoading(true)
    getCategories()
      .then(setCategories)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const startEdit = (cat?: Category) => {
    if (cat) {
      setEditing(cat.id)
      setName(cat.name)
      setOrder(cat.order)
      setImageUrl(cat.imageUrl || '')
    } else {
      setEditing('new')
      setName('')
      setOrder(categories.length)
      setImageUrl('')
    }
  }

  const handleSave = async () => {
    const data = {
      name,
      slug: slugify(name),
      order,
      imageUrl: imageUrl.trim() ? toDirectImageUrl(imageUrl) : undefined,
    }
    if (editing === 'new') {
      await createCategory(data)
    } else if (editing) {
      await updateCategory(editing, data)
    }
    setEditing(null)
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta categoría?')) return
    await deleteCategory(id)
    load()
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>
        <button
          onClick={() => startEdit()}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white"
        >
          Nueva categoría
        </button>
      </div>

      {editing && (
        <div className="mb-6 rounded-xl border bg-white p-6">
          <div className="grid gap-3 md:grid-cols-2">
            <input
              placeholder="Nombre"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm"
            />
            <input
              placeholder="Orden"
              type="number"
              value={order}
              onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
              className="rounded-lg border px-3 py-2 text-sm"
            />
            <div className="col-span-2 flex gap-2">
              <input
                placeholder="URL de imagen (Google Drive, opcional)"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="flex-1 rounded-lg border px-3 py-2 text-sm"
              />
              {imageUrl.trim() && (
                <button
                  type="button"
                  onClick={() => setImageUrl(toDirectImageUrl(imageUrl))}
                  className="shrink-0 rounded-lg border px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                >
                  Drive → directo
                </button>
              )}
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button onClick={handleSave} className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white">
              Guardar
            </button>
            <button onClick={() => setEditing(null)} className="rounded-lg border px-4 py-2 text-sm">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {categories.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between rounded-xl border bg-white px-4 py-3"
          >
            <div>
              <span className="font-medium">{c.name}</span>
              <span className="ml-2 text-sm text-gray-500">/{c.slug}</span>
            </div>
            <div>
              <button onClick={() => startEdit(c)} className="mr-3 text-brand-600 hover:underline text-sm">
                Editar
              </button>
              <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:underline text-sm">
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
