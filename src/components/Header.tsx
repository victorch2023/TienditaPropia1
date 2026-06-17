import { Link } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { useStoreConfig } from '../hooks/useStoreConfig'
import { toDirectImageUrl } from '../utils/driveImageUrl'

export function Header() {
  const { itemCount } = useCart()
  const { config } = useStoreConfig()

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          {config.logoUrl ? (
            <img
              src={toDirectImageUrl(config.logoUrl)}
              alt={config.name}
              className="h-8 w-8 rounded"
            />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded bg-brand-600 text-sm font-bold text-white">
              MT
            </span>
          )}
          <span className="text-lg font-bold text-gray-900">{config.name}</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link to="/" className="text-sm text-gray-600 hover:text-brand-600">
            Inicio
          </Link>
          <Link to="/catalogo" className="text-sm text-gray-600 hover:text-brand-600">
            Catálogo
          </Link>
          <Link to="/cuenta" className="text-sm text-gray-600 hover:text-brand-600">
            Mi cuenta
          </Link>
        </nav>

        <Link
          to="/carrito"
          className="relative rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Carrito
          {itemCount > 0 && (
            <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {itemCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  )
}
