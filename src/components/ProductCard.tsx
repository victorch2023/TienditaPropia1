import { Link } from 'react-router-dom'
import type { Product } from '../types'
import { formatSoles } from '../utils/money'
import { DriveImage } from './DriveImage'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const image = product.images[0]

  return (
    <Link
      to={`/producto/${product.id}`}
      className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="aspect-square overflow-hidden bg-gray-100">
        {image ? (
          <DriveImage
            src={image}
            alt={product.name}
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">Sin imagen</div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-medium text-gray-900 line-clamp-2">{product.name}</h3>
        <p className="mt-1 text-lg font-bold text-brand-600">{formatSoles(product.price)}</p>
        {product.stock <= 0 && (
          <span className="mt-1 inline-block text-xs text-red-500">Agotado</span>
        )}
      </div>
    </Link>
  )
}
