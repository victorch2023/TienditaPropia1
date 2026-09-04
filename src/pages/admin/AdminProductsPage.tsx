import { useEffect, useRef, useState } from 'react'
import { useStore } from '../../hooks/useStore'
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../../services/products'
import { getCategories } from '../../services/categories'
import { uploadProductImage } from '../../services/storage'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { formatSoles, solesToCentavos } from '../../utils/money'
import { DriveImage } from '../../components/DriveImage'
import { toDirectImageUrl, isGoogleDriveFolderUrl } from '../../utils/driveImageUrl'
import type { Category, Product } from '../../types'

const emptyProduct = {
  name: '',
  description: '',
  priceSoles: '',
  stock: 0,
  sku: '',
  categoryId: '',
  active: true,
}

export function AdminProductsPage() {
  const { storeId } = useStore()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState(emptyProduct)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [manualUrl, setManualUrl] = useState('')
  const [showManualUrl, setShowManualUrl] = useState(false)
  const [imagePreviewFailed, setImagePreviewFailed] = useState<Record<number, boolean>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const load = () => {
    setLoading(true)
    Promise.all([getProducts(storeId, false), getCategories(storeId)])
      .then(([p, c]) => {
        setProducts(p)
        setCategories(c)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [storeId])

  const startEdit = (product?: Product) => {
    if (product) {
      setEditing(product.id)
      setForm({
        name: product.name,
        description: product.description,
        priceSoles: (product.price / 100).toFixed(2),
        stock: product.stock,
        sku: product.sku || '',
        categoryId: product.categoryId,
        active: product.active,
      })
      setImageUrls(product.images.length > 0 ? [...product.images] : [])
    } else {
      setEditing('new')
      setForm(emptyProduct)
      setImageUrls([])
    }
    setUploadProgress(null)
    setUploadError(null)
    setManualUrl('')
    setShowManualUrl(false)
    setImagePreviewFailed({})
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const normalizeImages = () =>
    imageUrls
      .map((u) => u.trim())
      .filter(Boolean)
      .map(toDirectImageUrl)

  const handleSave = async () => {
    setSaving(true)
    try {
      const images = normalizeImages()
      const data = {
        name: form.name,
        description: form.description,
        price: solesToCentavos(parseFloat(form.priceSoles) || 0),
        stock: form.stock,
        sku: form.sku,
        categoryId: form.categoryId,
        images,
        variants: [],
        active: form.active,
      }

      if (editing === 'new') {
        await createProduct(storeId, data)
      } else if (editing) {
        await updateProduct(editing, data)
      }

      setEditing(null)
      load()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este producto?')) return
    await deleteProduct(id)
    load()
  }

  const removeImageUrl = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index))
    setImagePreviewFailed((prev) => {
      const next: Record<number, boolean> = {}
      Object.entries(prev).forEach(([k, v]) => {
        const i = Number(k)
        if (i < index) next[i] = v
        else if (i > index) next[i - 1] = v
      })
      return next
    })
  }

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files?.length) return
    setUploadError(null)
    const list = Array.from(files)
    setUploadProgress(0)

    try {
      for (let i = 0; i < list.length; i++) {
        const file = list[i]
        const url = await uploadProductImage(
          storeId,
          file,
          editing === 'new' ? undefined : editing ?? undefined,
          (pct) => {
            const overall = Math.round(((i + pct / 100) / list.length) * 100)
            setUploadProgress(overall)
          }
        )
        setImageUrls((prev) => [...prev, url])
      }
      setUploadProgress(100)
      setTimeout(() => setUploadProgress(null), 600)
    } catch (err) {
      setUploadProgress(null)
      setUploadError(err instanceof Error ? err.message : 'Error al subir la imagen.')
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const addManualUrl = () => {
    const trimmed = manualUrl.trim()
    if (!trimmed) return
    if (isGoogleDriveFolderUrl(trimmed)) {
      setUploadError(
        'Ese enlace es de una carpeta de Drive, no de un archivo. Usa un enlace de imagen o súbela con el botón de arriba.'
      )
      return
    }
    setImageUrls((prev) => [...prev, toDirectImageUrl(trimmed)])
    setManualUrl('')
    setUploadError(null)
  }

  if (loading) return <LoadingSpinner />

  const uploading = uploadProgress !== null

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
        <button
          onClick={() => startEdit()}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700"
        >
          Nuevo producto
        </button>
      </div>

      {editing && (
        <div className="mb-6 rounded-xl border bg-white p-6">
          <h2 className="mb-4 font-semibold">
            {editing === 'new' ? 'Nuevo producto' : 'Editar producto'}
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              placeholder="Nombre"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="rounded-lg border px-3 py-2 text-sm"
            />
            <input
              placeholder="Precio (S/)"
              type="number"
              step="0.01"
              value={form.priceSoles}
              onChange={(e) => setForm({ ...form, priceSoles: e.target.value })}
              className="rounded-lg border px-3 py-2 text-sm"
            />
            <input
              placeholder="Stock"
              type="number"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })}
              className="rounded-lg border px-3 py-2 text-sm"
            />
            <input
              placeholder="SKU"
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
              className="rounded-lg border px-3 py-2 text-sm"
            />
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="rounded-lg border px-3 py-2 text-sm"
            >
              <option value="">Categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
              />
              Activo
            </label>
            <textarea
              placeholder="Descripción"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="col-span-2 rounded-lg border px-3 py-2 text-sm"
              rows={3}
            />
            <div className="col-span-2 space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700">Imágenes del producto</p>
                <p className="mt-1 text-xs text-gray-500">
                  Se suben a Firebase Storage. Las URLs se guardan en el producto al pulsar Guardar.
                  Máx. 10 MB por imagen.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <label
                  className={`inline-flex cursor-pointer items-center rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700 ${
                    uploading ? 'pointer-events-none opacity-60' : ''
                  }`}
                >
                  {uploading ? `Subiendo… ${uploadProgress}%` : 'Elegir imágenes'}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => void handleFilesSelected(e.target.files)}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setShowManualUrl((v) => !v)}
                  className="text-sm text-gray-600 hover:underline"
                >
                  {showManualUrl ? 'Ocultar URL externa' : 'Pegar URL externa (opcional)'}
                </button>
              </div>

              {uploading && (
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-brand-600 transition-all duration-200"
                    style={{ width: `${uploadProgress ?? 0}%` }}
                  />
                </div>
              )}

              {uploadError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {uploadError}
                </p>
              )}

              {showManualUrl && (
                <div className="flex gap-2">
                  <input
                    placeholder="https://… (Drive, imgbb, etc.)"
                    value={manualUrl}
                    onChange={(e) => setManualUrl(e.target.value)}
                    className="flex-1 rounded-lg border px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={addManualUrl}
                    className="shrink-0 rounded-lg border px-3 py-2 text-sm text-brand-700 hover:bg-brand-50"
                  >
                    Agregar URL
                  </button>
                </div>
              )}

              {imageUrls.length === 0 ? (
                <p className="text-sm text-gray-500">Aún no hay imágenes.</p>
              ) : (
                <ul className="space-y-3">
                  {imageUrls.map((url, i) => (
                    <li
                      key={`${url}-${i}`}
                      className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3"
                    >
                      <DriveImage
                        src={url}
                        alt={`Imagen ${i + 1}`}
                        className="h-20 w-20 shrink-0 rounded object-cover"
                        onAllCandidatesFailed={() =>
                          setImagePreviewFailed((prev) => ({ ...prev, [i]: true }))
                        }
                      />
                      <div className="min-w-0 flex-1 text-sm">
                        <p className="font-medium text-gray-700">Imagen {i + 1}</p>
                        <p className="mt-0.5 truncate text-xs text-gray-500" title={url}>
                          {url}
                        </p>
                        {imagePreviewFailed[i] && (
                          <p className="mt-1 text-amber-800">
                            No se pudo cargar la vista previa. La URL se guardará igual; verifica
                            permisos o el enlace.
                          </p>
                        )}
                        {isGoogleDriveFolderUrl(url) && (
                          <p className="mt-1 text-red-600">
                            Enlace de carpeta de Drive (no sirve como imagen). Quítalo y sube el
                            archivo o pega un enlace de archivo.
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImageUrl(i)}
                        className="shrink-0 rounded-lg border px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                      >
                        Quitar
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving || uploading}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white disabled:opacity-60"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button onClick={() => setEditing(null)} className="rounded-lg border px-4 py-2 text-sm">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">Producto</th>
              <th className="px-4 py-3 text-left">Precio</th>
              <th className="px-4 py-3 text-left">Stock</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {p.images[0] && (
                      <DriveImage
                        src={p.images[0]}
                        alt=""
                        className="h-10 w-10 rounded object-cover"
                      />
                    )}
                    {p.name}
                  </div>
                </td>
                <td className="px-4 py-3">{formatSoles(p.price)}</td>
                <td className="px-4 py-3">{p.stock}</td>
                <td className="px-4 py-3">{p.active ? 'Activo' : 'Inactivo'}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => startEdit(p)}
                    className="mr-2 text-brand-600 hover:underline"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-red-500 hover:underline"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
