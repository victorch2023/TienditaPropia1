import { Link } from 'react-router-dom'
import { isDemoMode } from '../config/demo'
import { DEFAULT_STORE_ID } from '../config/stores'
import { isCustomDomainHostname } from '../config/domains'
import { buildStorePath } from '../hooks/useStore'

export function DemoBanner() {
  if (!isDemoMode()) return null

  const catalogTo = isCustomDomainHostname()
    ? '/catalogo'
    : buildStorePath(DEFAULT_STORE_ID, 'catalogo')

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-900">
      <strong>Modo demo</strong> — datos de ejemplo. Para producción, copia{' '}
      <code className="rounded bg-amber-100 px-1">.env.example</code> a{' '}
      <code className="rounded bg-amber-100 px-1">.env</code> y completa Firebase.{' '}
      <Link to={catalogTo} className="font-medium underline hover:text-amber-700">
        Ver catálogo
      </Link>
    </div>
  )
}
