import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { isKnownStoreId } from '../config/stores'
import { DEFAULT_STORE_ID } from '../config/stores/constants'

interface StoreContextValue {
  storeId: string
  /** Prefijo de rutas: `/s/{storeId}` o `` en dominio custom (rutas en raíz). */
  basePath: string
  /** true cuando las rutas viven en `/` sin `/s/:storeId` */
  rootPaths: boolean
  /** Construye ruta de la tienda, p.ej. path('catalogo') */
  path: (subpath?: string) => string
}

const StoreContext = createContext<StoreContextValue | null>(null)

export function storeBasePath(storeId: string, rootPaths = false) {
  if (rootPaths) return ''
  return `/s/${storeId}`
}

export function buildStorePath(
  storeId: string,
  subpath = '',
  rootPaths = false
) {
  const base = storeBasePath(storeId, rootPaths)
  if (!subpath || subpath === '/') return base || '/'
  const clean = subpath.startsWith('/') ? subpath.slice(1) : subpath
  return base ? `${base}/${clean}` : `/${clean}`
}

export function StoreProvider({
  children,
  storeId: storeIdProp,
  rootPaths = false,
}: {
  children: ReactNode
  /** Fuerza storeId (dominio custom); si no, usa param de `/s/:storeId`. */
  storeId?: string
  /** Rutas en raíz (`/catalogo`) en lugar de `/s/:storeId/catalogo`. */
  rootPaths?: boolean
}) {
  const { storeId: param } = useParams<{ storeId: string }>()
  const storeId = storeIdProp || param || DEFAULT_STORE_ID

  const path = useCallback(
    (subpath = '') => buildStorePath(storeId, subpath, rootPaths),
    [storeId, rootPaths]
  )

  const value = useMemo(
    () => ({
      storeId,
      basePath: storeBasePath(storeId, rootPaths),
      rootPaths,
      path,
    }),
    [storeId, rootPaths, path]
  )

  if (!isKnownStoreId(storeId)) {
    return <Navigate to="/" replace />
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore debe usarse dentro de StoreProvider')
  return ctx
}
