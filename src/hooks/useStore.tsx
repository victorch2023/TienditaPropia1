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
  /** Prefijo de rutas de esta tienda: `/s/{storeId}` */
  basePath: string
  /** Construye ruta relativa a la tienda, p.ej. path('catalogo') → `/s/citroleaf/catalogo` */
  path: (subpath?: string) => string
}

const StoreContext = createContext<StoreContextValue | null>(null)

export function storeBasePath(storeId: string) {
  return `/s/${storeId}`
}

export function buildStorePath(storeId: string, subpath = '') {
  const base = storeBasePath(storeId)
  if (!subpath || subpath === '/') return base
  const clean = subpath.startsWith('/') ? subpath.slice(1) : subpath
  return `${base}/${clean}`
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { storeId: param } = useParams<{ storeId: string }>()
  const storeId = param || DEFAULT_STORE_ID

  const path = useCallback(
    (subpath = '') => buildStorePath(storeId, subpath),
    [storeId]
  )

  const value = useMemo(
    () => ({
      storeId,
      basePath: storeBasePath(storeId),
      path,
    }),
    [storeId, path]
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
