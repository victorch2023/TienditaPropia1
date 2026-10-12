import type { Category, Product, StoreConfig, StoreMeta } from '../../types'
import { DEFAULT_STORE_CONFIG } from '../../types'
import { DEFAULT_STORE_ID } from './constants'
import {
  CITROLEAF_CATEGORIES,
  CITROLEAF_META,
  CITROLEAF_PRODUCTS,
  CITROLEAF_STORE_CONFIG,
  CITROLEAF_STORE_ID,
} from './citroleaf'
import {
  TIENDITA_CATEGORIES,
  TIENDITA_META,
  TIENDITA_PRODUCTS,
  TIENDITA_STORE_CONFIG,
} from './tiendita'
import {
  PIYUKIS_CATEGORIES,
  PIYUKIS_META,
  PIYUKIS_PRODUCTS,
  PIYUKIS_STORE_CONFIG,
  PIYUKIS_STORE_ID,
} from './piyukis'

export { DEFAULT_STORE_ID, LEGACY_CONFIG_DOC_ID, KNOWN_STORE_IDS } from './constants'
export {
  CITROLEAF_STORE_ID,
  CITROLEAF_META,
  CITROLEAF_STORE_CONFIG,
  CITROLEAF_SINGLE_PRODUCT_MODE,
  CITROLEAF_SKIP_FISCAL_RECEIPT,
  CITROLEAF_HIDE_IGV_LINE,
  CITROLEAF_DISABLE_BANK_TRANSFER,
  pickCitroleafSingleProduct,
} from './citroleaf'
export { TIENDITA_META, TIENDITA_STORE_CONFIG } from './tiendita'
export {
  PIYUKIS_STORE_ID,
  PIYUKIS_META,
  PIYUKIS_STORE_CONFIG,
} from './piyukis'

export const STORE_REGISTRY: StoreMeta[] = [
  {
    id: TIENDITA_META.id,
    slug: TIENDITA_META.slug,
    name: TIENDITA_META.name,
    tagline: TIENDITA_META.tagline,
    active: TIENDITA_META.active,
  },
  {
    id: CITROLEAF_META.id,
    slug: CITROLEAF_META.slug,
    name: CITROLEAF_META.name,
    tagline: CITROLEAF_META.tagline,
    active: CITROLEAF_META.active,
    instagram: CITROLEAF_META.instagram,
  },
  {
    id: PIYUKIS_META.id,
    slug: PIYUKIS_META.slug,
    name: PIYUKIS_META.name,
    tagline: PIYUKIS_META.tagline,
    active: PIYUKIS_META.active,
  },
]

const DEMO_CONFIG: Record<string, StoreConfig> = {
  [DEFAULT_STORE_ID]: TIENDITA_STORE_CONFIG,
  [CITROLEAF_STORE_ID]: CITROLEAF_STORE_CONFIG,
  [PIYUKIS_STORE_ID]: PIYUKIS_STORE_CONFIG,
}

const DEMO_CATEGORIES: Record<string, Category[]> = {
  [DEFAULT_STORE_ID]: TIENDITA_CATEGORIES,
  [CITROLEAF_STORE_ID]: CITROLEAF_CATEGORIES,
  [PIYUKIS_STORE_ID]: PIYUKIS_CATEGORIES,
}

const DEMO_PRODUCTS: Record<string, Product[]> = {
  [DEFAULT_STORE_ID]: TIENDITA_PRODUCTS,
  [CITROLEAF_STORE_ID]: CITROLEAF_PRODUCTS,
  [PIYUKIS_STORE_ID]: PIYUKIS_PRODUCTS,
}

export function isKnownStoreId(storeId: string): boolean {
  return STORE_REGISTRY.some((s) => s.id === storeId && s.active)
}

export function getStoreMeta(storeId: string): StoreMeta | undefined {
  return STORE_REGISTRY.find((s) => s.id === storeId)
}

export function getDemoStoreConfig(storeId: string): StoreConfig {
  return DEMO_CONFIG[storeId] ?? { ...DEFAULT_STORE_CONFIG, name: storeId }
}

export function getDemoCategories(storeId: string): Category[] {
  return DEMO_CATEGORIES[storeId] ? [...DEMO_CATEGORIES[storeId]] : []
}

export function getDemoProducts(storeId: string, activeOnly = false): Product[] {
  const list = DEMO_PRODUCTS[storeId] ? [...DEMO_PRODUCTS[storeId]] : []
  return activeOnly ? list.filter((p) => p.active) : list
}

/** Productos/categorías sin storeId se tratan como la tienda default (migración). */
export function belongsToStore(
  data: { storeId?: string },
  storeId: string
): boolean {
  const sid = data.storeId ?? DEFAULT_STORE_ID
  return sid === storeId
}
