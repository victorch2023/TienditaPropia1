import type { Category, Product, StoreConfig } from '../types'
import {
  getDemoCategories,
  getDemoProducts,
  getDemoStoreConfig,
} from './stores'

const PLACEHOLDER_API_KEYS = new Set([
  '',
  'tu_api_key',
  'demo-api-key',
  'your_api_key',
])

/** Activo con VITE_DEMO_MODE=true o sin Firebase configurado en .env */
export function isDemoMode(): boolean {
  const forced = import.meta.env.VITE_DEMO_MODE
  if (forced === 'true') return true
  if (forced === 'false') return false

  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY?.trim()
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim()
  if (!apiKey || PLACEHOLDER_API_KEYS.has(apiKey)) return true
  if (!projectId || projectId === 'tu-proyecto' || projectId === 'demo-project') return true
  return false
}

/** @deprecated Prefer getDemoStoreConfig(storeId) */
export const DEMO_STORE_CONFIG: StoreConfig = getDemoStoreConfig('tiendita')

/** @deprecated Prefer getDemoCategories(storeId) */
export const DEMO_CATEGORIES: Category[] = getDemoCategories('tiendita')

/** @deprecated Prefer getDemoProducts(storeId) */
export const DEMO_PRODUCTS: Product[] = getDemoProducts('tiendita')

export function demoError(action = 'Esta acción'): Error {
  return new Error(`${action} no está disponible en modo demo. Configura Firebase en .env`)
}
