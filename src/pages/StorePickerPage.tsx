import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listStores } from '../services/store'
import { STORE_REGISTRY } from '../config/stores'
import type { StoreMeta } from '../types'
import { DemoBanner } from '../components/DemoBanner'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { buildStorePath } from '../hooks/useStore'

export function StorePickerPage() {
  const [stores, setStores] = useState<StoreMeta[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listStores()
      .then((list) => setStores(list.length ? list : STORE_REGISTRY.filter((s) => s.active)))
      .catch(() => setStores(STORE_REGISTRY.filter((s) => s.active)))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <DemoBanner />
      <div className="mx-auto max-w-4xl px-4 py-16">
        <h1 className="text-center text-3xl font-bold text-gray-900 md:text-4xl">
          Elige tu tienda
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-center text-gray-600">
          Varias marcas, la misma plataforma. Entra a la tienda que quieras visitar.
        </p>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {stores.map((store) => (
              <Link
                key={store.id}
                to={buildStorePath(store.id)}
                className="group rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-500 hover:shadow-md"
              >
                <h2 className="text-2xl font-bold text-gray-900 group-hover:text-brand-700">
                  {store.name}
                </h2>
                {store.tagline && (
                  <p className="mt-2 text-sm text-gray-600">{store.tagline}</p>
                )}
                <span className="mt-6 inline-block text-sm font-medium text-brand-600">
                  Entrar →
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
