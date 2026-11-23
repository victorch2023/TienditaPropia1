import { useEffect, useRef, useState } from 'react'
import { useStore } from '../../hooks/useStore'
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../../services/categories'
import { uploadCategoryImage } from '../../services/storage'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { DriveImage } from '../../components/DriveImage'
import { slugify } from '../../utils/money'
import { toDirectImageUrl } from '../../utils/driveImageUrl'
import type { Category } from '../../types'

export function AdminCategoriesPage() {
  const { storeId } = useStore()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [order, setOrder] = useState(0)
  const [imageUrl, setImageUrl] = useState('')
  const [bannerUrl, setBannerUrl] = useState('')
  const [uploadProgress, setUploadProgress] = useState<{
    kind: 'image' | 'banner'
    percent: number
  } | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  const load = () => {
    setLoading(true)
    getCategories(storeId)
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
      setBannerUrl(cat.bannerUrl || '')
    } else {
      setEditing('new')
      setName('')
      setOrder(categories.length)
      setImageUrl('')
      setBannerUrl('')
    }
    setUploadProgress(null)
    setUploadError(null)
    if (imageInputRef.current) imageInputRef.current.value = ''
    if (bannerInputRef.current) bannerInputRef.current.value = ''
  }

  const handleSave = async () => {
    const data = {
      name,
      slug: slugify(name),
      order,
      imageUrl: imageUrl.trim() ? toDirectImageUrl(imageUrl) : undefined,
      bannerUrl: bannerUrl.trim() ? toDirectImageUrl(bannerUrl) : undefined,
    }
    if (editing === 'new') {
      await createCategory(storeId, data)
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

  const handleUpload = async (kind: 'image' | 'banner', files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    setUploadError(null)
    setUploadProgress({ kind, percent: 0 })
    try {
      const url = await uploadCategoryImage(storeId, file, {
        categoryId: editing === 'new' ? undefined : editing ?? undefined,
        kind,
        onProgress: (percent) => setUploadProgress({ kind, percent }),
      })
      if (kind === 'image') setImageUrl(url)
      else setBannerUrl(url)
      setUploadProgress(null)
    } catch (err) {
      setUploadProgress(null)
      setUploadError(err instanceof Error ? err.message : 'Error al subir la imagen.')
    } finally {
      if (kind === 'image' && imageInputRef.current) imageInputRef.current.value = ''
      if (kind === 'banner' && bannerInputRef.current) bannerInputRef.current.value = ''
    }
  }

  if (loading) return <LoadingSpinner />

  const uploading = uploadProgress !== null

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
            <div className="col-span-2 space-y-2">
              <label className="block text-xs font-medium text-gray-600">
                Imagen miniatura (opcional)
              </label>
              <p className="text-xs text-gray-500">
                Sube desde tu dispositivo a Firebase Storage. Máx. 10 MB.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <label
                  className={`inline-flex cursor-pointer items-center rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700 ${
                    uploading ? 'pointer-events-none opacity-60' : ''
                  }`}
                >
                  {uploadProgress?.kind === 'image'
                    ? `Subiendo… ${uploadProgress.percent}%`
                    : 'Subir imagen'}
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => void handleUpload('image', e.target.files)}
                  />
                </label>
                {imageUrl.trim() && (
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Quitar
                  </button>
                )}
              </div>
              {imageUrl.trim() && (
                <div className="mt-1 flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border bg-gray-50">
                  <DriveImage
                    src={imageUrl}
                    alt="Vista previa miniatura"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              )}
            </div>
            <div className="col-span-2 space-y-2">
              <label className="block text-xs font-medium text-gray-600">
                Banner de categoría (cabecera en catálogo)
              </label>
              <p className="text-xs text-gray-500">
                Recomendado: 800×200 px, JPG/PNG/WebP. Se muestra al filtrar por esta categoría.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <label
                  className={`inline-flex cursor-pointer items-center rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700 ${
                    uploading ? 'pointer-events-none opacity-60' : ''
                  }`}
                >
                  {uploadProgress?.kind === 'banner'
                    ? `Subiendo… ${uploadProgress.percent}%`
                    : 'Subir banner'}
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => void handleUpload('banner', e.target.files)}
                  />
                </label>
                {bannerUrl.trim() && (
                  <button
                    type="button"
                    onClick={() => setBannerUrl('')}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Quitar
                  </button>
                )}
              </div>
              {bannerUrl.trim() && (
                <div className="relative mt-1 overflow-hidden rounded-lg border">
                  <DriveImage
                    src={bannerUrl}
                    alt="Vista previa del banner"
                    className="h-20 w-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
          {uploadError && (
            <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {uploadError}
            </p>
          )}
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleSave}
              disabled={uploading}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white disabled:opacity-60"
            >
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
              {c.bannerUrl && (
                <span className="ml-2 text-xs text-brand-600">con banner</span>
              )}
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
