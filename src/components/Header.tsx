import { Link } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import { useStore } from '../hooks/useStore'
import { useStoreConfig } from '../hooks/useStoreConfig'
import { CITROLEAF_STORE_ID } from '../config/stores'
import { toDirectImageUrl } from '../utils/driveImageUrl'

export function Header() {
  const { itemCount } = useCart()
  const { config } = useStoreConfig()
  const { path, storeId } = useStore()
  const isCitroleaf = storeId === CITROLEAF_STORE_ID

  if (isCitroleaf) {
    return <CitroleafHeader itemCount={itemCount} storeName={config.name} path={path} />
  }

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to={path()} className="flex items-center gap-2">
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
          <Link to={path()} className="text-sm text-gray-600 hover:text-brand-600">
            Inicio
          </Link>
          <Link to={path('catalogo')} className="text-sm text-gray-600 hover:text-brand-600">
            Catálogo
          </Link>
          <Link to={path('cuenta')} className="text-sm text-gray-600 hover:text-brand-600">
            Mi cuenta
          </Link>
          <Link to="/" className="text-sm text-gray-400 hover:text-brand-600">
            Tiendas
          </Link>
        </nav>

        <Link
          to={path('carrito')}
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

function CitroleafHeader({
  itemCount,
  storeName,
  path,
}: {
  itemCount: number
  storeName: string
  path: (s?: string) => string
}) {
  return (
    <header className="sticky top-0 z-50 bg-[#F2F0EB]">
      <div className="bg-[#261F1A] px-4 py-2 text-center text-[11px] font-medium uppercase tracking-[0.2em] text-white">
        Envíos en Lima Metropolitana · Protección natural
      </div>
      <div className="border-b border-[#261F1A]/10 px-4 pb-4 pt-5">
        <div className="mx-auto flex max-w-6xl items-start justify-between">
          <Link
            to="/"
            className="pt-1 text-[10px] uppercase tracking-[0.18em] text-[#261F1A]/60 transition hover:text-[#261F1A]"
          >
            Tiendas
          </Link>
          <div className="flex flex-1 flex-col items-center">
            <Link
              to={path()}
              className="font-citro-serif text-4xl font-medium tracking-tight text-[#261F1A] md:text-5xl"
            >
              {storeName}
            </Link>
            <nav className="mt-3 flex flex-wrap items-center justify-center gap-5 text-[11px] uppercase tracking-[0.22em] text-[#261F1A]/80">
              <Link to={path()} className="transition hover:text-[#261F1A]">
                Inicio
              </Link>
              <Link to={path('catalogo')} className="transition hover:text-[#261F1A]">
                Catálogo
              </Link>
              <Link
                to={path('catalogo?categoria=repelentes')}
                className="transition hover:text-[#261F1A]"
              >
                Repelentes
              </Link>
              <Link to={path('cuenta')} className="transition hover:text-[#261F1A]">
                Cuenta
              </Link>
            </nav>
          </div>
          <Link
            to={path('carrito')}
            className="relative pt-1 text-[10px] uppercase tracking-[0.18em] text-[#261F1A] transition hover:opacity-70"
          >
            Bolsa
            {itemCount > 0 && (
              <span className="absolute -right-3 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#261F1A] text-[9px] text-[#F2F0EB]">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  )
}
