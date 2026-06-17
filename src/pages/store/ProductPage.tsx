import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getProduct } from '../../services/products'
import { getCategory } from '../../services/categories'
import { useCart } from '../../hooks/useCart'
import { LoadingSpinner } from '../../components/LoadingSpinner'
import { formatSoles } from '../../utils/money'
import { DriveImage } from '../../components/DriveImage'
import { toDirectImageUrl } from '../../utils/driveImageUrl'
import type { Product } from '../../types'

export function ProductPage() {
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [categoryName, setCategoryName] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [selectedVariant, setSelectedVariant] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)
  const [added, setAdded] = useState(false)
  const { addItem } = useCart()

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getProduct(id)
      .then(async (p) => {
        setProduct(p)
        if (p?.categoryId) {
          const cat = await getCategory(p.categoryId)
          setCategoryName(cat?.name || '')
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <LoadingSpinner />
  if (!product) {
    return (
      <div className="text-center">
        <p className="text-gray-500">Producto no encontrado.</p>
        <Link to="/catalogo" className="mt-4 text-brand-600 hover:underline">
          Volver al catálogo
        </Link>
      </div>
    )
  }

  const maxStock = selectedVariant
    ? product.variants.find((v) => v.name === selectedVariant)?.stock ?? product.stock
    : product.stock

  const handleAdd = () => {
    addItem(
      {
        productId: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.images[0] ? toDirectImageUrl(product.images[0]) : undefined,
        variantName: selectedVariant,
        maxStock,
      },
      quantity
    )
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="overflow-hidden rounded-xl bg-white">
        {product.images[0] ? (
          <DriveImage
            src={product.images[0]}
            alt={product.name}
            className="w-full object-cover"
          />
        ) : (
          <div className="flex aspect-square items-center justify-center bg-gray-100 text-gray-400">
            Sin imagen
          </div>
        )}
        {product.images.length > 1 && (
          <div className="mt-2 flex gap-2 overflow-x-auto p-2">
            {product.images.map((img, i) => (
              <DriveImage
                key={i}
                src={img}
                alt=""
                className="h-16 w-16 rounded object-cover"
              />
            ))}
          </div>
        )}
      </div>

      <div>
        {categoryName && (
          <span className="text-sm text-brand-600">{categoryName}</span>
        )}
        <h1 className="mt-1 text-2xl font-bold text-gray-900">{product.name}</h1>
        <p className="mt-2 text-2xl font-bold text-brand-600">
          {formatSoles(product.price)}
          <span className="ml-2 text-sm font-normal text-gray-500">(incl. IGV)</span>
        </p>
        <p className="mt-4 text-gray-600">{product.description}</p>

        {product.variants.length > 0 && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">Variante</label>
            <select
              value={selectedVariant || ''}
              onChange={(e) => setSelectedVariant(e.target.value || undefined)}
              className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Seleccionar</option>
              {product.variants.map((v) => (
                <option key={v.id} value={v.name}>
                  {v.name} ({v.stock} disp.)
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mt-4 flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Cantidad</label>
          <input
            type="number"
            min={1}
            max={maxStock}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <span className="text-sm text-gray-500">{maxStock} disponibles</span>
        </div>

        <button
          onClick={handleAdd}
          disabled={maxStock <= 0}
          className="mt-6 w-full rounded-lg bg-brand-600 px-6 py-3 font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {maxStock <= 0 ? 'Agotado' : added ? '¡Agregado!' : 'Agregar al carrito'}
        </button>

        <Link to="/carrito" className="mt-3 block text-center text-sm text-brand-600 hover:underline">
          Ver carrito
        </Link>
      </div>
    </div>
  )
}
