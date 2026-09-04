/** Slug de la tienda original (La Tiendita Chévere / Mi Tiendita) */
export const DEFAULT_STORE_ID = 'tiendita'

/** Documento legacy de config (pre multi-tienda) */
export const LEGACY_CONFIG_DOC_ID = 'config'

export const KNOWN_STORE_IDS = ['tiendita', 'citroleaf'] as const
export type KnownStoreId = (typeof KNOWN_STORE_IDS)[number]
