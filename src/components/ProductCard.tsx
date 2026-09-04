import { Link } from 'react-router-dom'
import type { Product } from '../types'
import { formatSoles } from '../utils/money'
import { DriveImage } from './DriveImage'
import { useStore } from '../hooks/useStore'

interface ProductCardProps {
  product: Product
  variant?: 'default' | 'citroleaf'
}

export function ProductCard({ product, variant = 'default' }: ProductCardProps) {
  const image = product.images[0]
  const { path } = useStore()
  const to = path(`producto/${product.id}`)

  if (variant === 'citroleaf') {
    return (
      <Link to={to} className="group block text-center">
        <div className="aspect-[3/4] overflow-hidden bg-[#e8e4dc]">
          {image ? (
            <DriveImage
              src={image}
              alt={product.name}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[#261F1A]/40">
              Sin imagen
            </div>
          )}
        </div>
        <h3 className="mt-4 text-sm text-[#261F1A]">{product.name}</h3>
        <p className="mt-1 text-sm text-[#261F1A]/70">{formatSoles(product.price)}</p>
        <span className="mt-3 inline-block border border-[#261F1A] px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-[#261F1A] transition group-hover:bg-[#261F1A] group-hover:text-[#F2F0EB]">
          Ver producto
        </span>
      </Link>
    )
  }

  return (
    <Link
      to={to}
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
        <h3 className="line-clamp-2 font-medium text-gray-900">{product.name}</h3>
        <p className="mt-1 text-lg font-bold text-brand-600">{formatSoles(product.price)}</p>
        {product.stock <= 0 && (
          <span className="mt-1 inline-block text-xs text-red-500">Agotado</span>
        )}
      </div>
    </Link>
  )
}
