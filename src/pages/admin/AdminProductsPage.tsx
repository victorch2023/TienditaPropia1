import { useEffect, useState } from 'react'
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../../services/products'
import { getCategories } from '../../services/categories'
import { getStoreConfig } from '../../services/store'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { resolveDriveImagesFolderUrl } from '../../constants/drive'
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
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState(emptyProduct)
  const [imageUrls, setImageUrls] = useState<string[]>([''])
  const [saving, setSaving] = useState(false)
  const [driveFolderUrl, setDriveFolderUrl] = useState(resolveDriveImagesFolderUrl())
  const [localFileHint, setLocalFileHint] = useState(false)
  const [imagePreviewFailed, setImagePreviewFailed] = useState<Record<number, boolean>>({})

  const load = () => {
    setLoading(true)
    Promise.all([getProducts(false), getCategories()])
      .then(([p, c]) => {
        setProducts(p)
        setCategories(c)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    getStoreConfig().then((cfg) => setDriveFolderUrl(resolveDriveImagesFolderUrl(cfg.imageHostingNote)))
  }, [])

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
      setImageUrls(product.images.length > 0 ? [...product.images] : [''])
    } else {
      setEditing('new')
      setForm(emptyProduct)
      setImageUrls([''])
    }
    setLocalFileHint(false)
    setImagePreviewFailed({})
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
        await createProduct(data)
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

  const updateImageUrl = (index: number, value: string) => {
    const next = [...imageUrls]
    next[index] = value
    setImageUrls(next)
    setImagePreviewFailed((prev) => {
      const updated = { ...prev }
      delete updated[index]
      return updated
    })
  }

  const convertImageUrl = (index: number) => {
    updateImageUrl(index, toDirectImageUrl(imageUrls[index]))
  }

  const addImageUrl = () => setImageUrls([...imageUrls, ''])

  const removeImageUrl = (index: number) => {
    if (imageUrls.length <= 1) {
      setImageUrls([''])
      return
    }
    setImageUrls(imageUrls.filter((_, i) => i !== index))
  }

  if (loading) return <LoadingSpinner />

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
            <div className="col-span-2 space-y-2">
              <div className="rounded-lg border border-brand-200 bg-brand-50 p-4">
                <p className="text-sm font-medium text-brand-900">Imágenes en Google Drive</p>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-brand-800">
                  <li>Abre la carpeta de imágenes en Drive (botón abajo).</li>
                  <li>Sube la imagen a esa carpeta.</li>
                  <li>En el archivo: Compartir → copia el enlace del archivo (no el de la carpeta).</li>
                  <li>Pega el enlace abajo y usa «Drive → directo» si hace falta.</li>
                </ol>
                <button
                  type="button"
                  onClick={() => window.open(driveFolderUrl, '_blank', 'noopener,noreferrer')}
                  className="mt-3 rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700"
                >
                  Abrir carpeta de imágenes en Drive
                </button>
                <p className="mt-3 text-xs text-brand-700">
                  La subida automática a Drive requiere configuración avanzada futura (OAuth o cuenta
                  de servicio en el servidor). Por ahora sube las imágenes manualmente.
                </p>
              </div>
              <label className="block text-sm font-medium text-gray-700">
                URLs de imagen (Google Drive, imgbb, etc.)
              </label>
              <div>
                <label className="inline-block cursor-pointer text-sm text-brand-600 hover:underline">
                  Elegir archivo local (solo referencia)
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setLocalFileHint(!!e.target.files?.[0])}
                  />
                </label>
                {localFileHint && (
                  <p className="mt-1 text-sm text-amber-800">
                    Sube este archivo manualmente a la carpeta de Drive y pega el enlace.
                  </p>
                )}
              </div>
              {imageUrls.map((url, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      placeholder="https://drive.google.com/file/d/..."
                      value={url}
                      onChange={(e) => updateImageUrl(i, e.target.value)}
                      className="flex-1 rounded-lg border px-3 py-2 text-sm"
                    />
                    {url.trim() && (
                      <button
                        type="button"
                        onClick={() => convertImageUrl(i)}
                        className="shrink-0 rounded-lg border px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                        title="Convertir enlace de Drive a URL directa"
                      >
                        Drive → directo
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImageUrl(i)}
                      className="shrink-0 rounded-lg border px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                    >
                      Quitar
                    </button>
                  </div>
                  {url.trim() && isGoogleDriveFolderUrl(url) && (
                    <p className="text-sm text-red-600">
                      Este enlace es de una carpeta de Drive, no de un archivo. Abre la imagen,
                      compártela con «Cualquier persona con el enlace» y pega el enlace del
                      archivo (formato …/file/d/…).
                    </p>
                  )}
                  {url.trim() && !isGoogleDriveFolderUrl(url) && (
                    <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                      <DriveImage
                        src={url}
                        alt="Vista previa"
                        className="h-20 w-20 shrink-0 rounded object-cover"
                        onAllCandidatesFailed={() =>
                          setImagePreviewFailed((prev) => ({ ...prev, [i]: true }))
                        }
                      />
                      <div className="text-sm">
                        <p className="font-medium text-gray-700">Vista previa</p>
                        {imagePreviewFailed[i] ? (
                          <p className="mt-1 text-amber-800">
                            No se pudo cargar la imagen. Verifica que el archivo esté compartido
                            como «Cualquier persona con el enlace» y que sea un enlace de archivo,
                            no de carpeta.
                          </p>
                        ) : (
                          <p className="mt-1 text-gray-500">
                            Si ves la miniatura, la imagen debería mostrarse en la tienda.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addImageUrl}
                className="text-sm text-brand-600 hover:underline"
              >
                + Agregar otra imagen
              </button>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white"
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
