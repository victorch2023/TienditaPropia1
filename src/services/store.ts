import {
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from './firebase'
import { demoError, isDemoMode } from '../config/demo'
import {
  CITROLEAF_STORE_ID,
  DEFAULT_STORE_ID,
  LEGACY_CONFIG_DOC_ID,
  STORE_REGISTRY,
  getDemoStoreConfig,
} from '../config/stores'
import {
  DEFAULT_PAYMENTS_CONFIG,
  DEFAULT_STORE_CONFIG,
  type StoreConfig,
  type StoreMeta,
} from '../types'
import { stripUndefined } from '../utils/firestore'

/** Mapa de envío del seed antiguo de Citroleaf (San Isidro = S/10, etc.). */
const STALE_CITROLEAF_DISTRICT_SEED: Record<string, number> = {
  Miraflores: 1000,
  'San Isidro': 1000,
  Surco: 1200,
  Barranco: 1000,
  'Jesús María': 1100,
}

function positiveDistrictMap(
  map: Record<string, number> | undefined
): Record<string, number> {
  if (!map || typeof map !== 'object') return {}
  return Object.fromEntries(
    Object.entries(map).filter(([, v]) => typeof v === 'number' && v > 0)
  )
}

/**
 * Seed viejo de Citroleaf (San Isidro=10, etc.). Detecta mapa completo O
 * parcial: p.ej. Barranco=0 en Firestore se filtra y el match exacto fallaba,
 * dejando San Isidro=1000 activo sobre shippingDefault=800.
 */
function isStaleCitroleafDistrictSeed(map: Record<string, number>): boolean {
  const entries = Object.entries(map).filter(
    ([, v]) => typeof v === 'number' && v > 0
  )
  if (entries.length === 0) return false
  return entries.every(([k, v]) => STALE_CITROLEAF_DISTRICT_SEED[k] === v)
}

export function parseStoreConfigData(
  data: Record<string, unknown> | undefined,
  storeId?: string
): StoreConfig {
  const base = storeId ? getDemoStoreConfig(storeId) : DEFAULT_STORE_CONFIG
  if (!data) return base

  // No heredar shippingByDistrito del demo cuando hay doc en Firestore:
  // antes San Isidro=10 del seed/demo tapaba Envío por defecto=8 del admin.
  const fromDb = positiveDistrictMap(
    data.shippingByDistrito as Record<string, number> | undefined
  )
  let shippingByDistrito =
    data.shippingByDistrito != null ? fromDb : {}

  if (
    storeId === CITROLEAF_STORE_ID &&
    isStaleCitroleafDistrictSeed(shippingByDistrito)
  ) {
    shippingByDistrito = {}
  }

  return {
    ...base,
    ...data,
    shippingDefault:
      typeof data.shippingDefault === 'number'
        ? data.shippingDefault
        : base.shippingDefault,
    shippingByDistrito,
    payments: {
      ...DEFAULT_PAYMENTS_CONFIG,
      ...base.payments,
      ...(data.payments as StoreConfig['payments'] | undefined),
    },
  } as StoreConfig
}

async function readStoreDoc(storeId: string) {
  const snap = await getDoc(doc(db, 'stores', storeId))
  if (snap.exists()) return snap
  if (storeId === DEFAULT_STORE_ID) {
    return getDoc(doc(db, 'stores', LEGACY_CONFIG_DOC_ID))
  }
  return snap
}

export async function getStoreConfig(storeId: string): Promise<StoreConfig> {
  if (isDemoMode()) return getDemoStoreConfig(storeId)
  const snap = await readStoreDoc(storeId)
  if (!snap.exists()) return getDemoStoreConfig(storeId)
  return parseStoreConfigData(snap.data(), storeId)
}

export function subscribeStoreConfig(
  storeId: string,
  onData: (config: StoreConfig) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (isDemoMode()) {
    onData(getDemoStoreConfig(storeId))
    return () => {}
  }

  const primary = onSnapshot(
    doc(db, 'stores', storeId),
    (snap) => {
      if (snap.exists()) {
        onData(parseStoreConfigData(snap.data(), storeId))
        return
      }
      if (storeId === DEFAULT_STORE_ID) {
        getDoc(doc(db, 'stores', LEGACY_CONFIG_DOC_ID)).then((legacy) => {
          onData(
            legacy.exists()
              ? parseStoreConfigData(legacy.data(), storeId)
              : getDemoStoreConfig(storeId)
          )
        })
        return
      }
      onData(getDemoStoreConfig(storeId))
    },
    (err) => onError?.(err)
  )
  return primary
}

export async function updateStoreConfig(
  storeId: string,
  config: Partial<StoreConfig>
): Promise<void> {
  if (isDemoMode()) throw demoError('Guardar configuración')

  // merge:true fusiona mapas anidados. Para shippingByDistrito hay que
  // borrar el campo y reescribirlo; si no, queda San Isidro=10 huérfano.
  const hasDistricts = config.shippingByDistrito != null
  const districts = hasDistricts
    ? positiveDistrictMap(config.shippingByDistrito)
    : undefined

  const basePayload = stripUndefined({
    ...config,
    shippingByDistrito: undefined,
    slug: storeId,
    active: config.active ?? true,
    updatedAt: Date.now(),
  }) as Record<string, unknown>

  const ref = doc(db, 'stores', storeId)

  if (hasDistricts) {
    await setDoc(
      ref,
      { ...basePayload, shippingByDistrito: deleteField() },
      { merge: true }
    )
    if (Object.keys(districts!).length > 0) {
      await setDoc(ref, { shippingByDistrito: districts }, { merge: true })
    }
  } else {
    await setDoc(ref, basePayload, { merge: true })
  }

  if (storeId === DEFAULT_STORE_ID) {
    const legacyRef = doc(db, 'stores', LEGACY_CONFIG_DOC_ID)
    const legacyBase = { ...basePayload }
    delete legacyBase.slug
    delete legacyBase.active
    if (hasDistricts) {
      await setDoc(
        legacyRef,
        { ...legacyBase, shippingByDistrito: deleteField() },
        { merge: true }
      )
      if (Object.keys(districts!).length > 0) {
        await setDoc(
          legacyRef,
          { shippingByDistrito: districts },
          { merge: true }
        )
      }
    } else {
      await setDoc(legacyRef, legacyBase, { merge: true })
    }
  }
}

export async function listStores(): Promise<StoreMeta[]> {
  if (isDemoMode()) return STORE_REGISTRY.filter((s) => s.active)

  try {
    const snap = await getDocs(collection(db, 'stores'))
    const fromDb: StoreMeta[] = []
    snap.forEach((d) => {
      if (d.id === LEGACY_CONFIG_DOC_ID) return
      const data = d.data()
      if (data.active === false) return
      fromDb.push({
        id: d.id,
        slug: (data.slug as string) || d.id,
        name: (data.name as string) || d.id,
        tagline: data.description as string | undefined,
        active: true,
        logoUrl: data.logoUrl as string | undefined,
      })
    })

    if (fromDb.length === 0) {
      const legacy = await getDoc(doc(db, 'stores', LEGACY_CONFIG_DOC_ID))
      if (legacy.exists()) {
        const data = legacy.data()
        return [
          {
            id: DEFAULT_STORE_ID,
            slug: DEFAULT_STORE_ID,
            name: (data.name as string) || 'La Tiendita Chévere',
            tagline: data.description as string | undefined,
            active: true,
            logoUrl: data.logoUrl as string | undefined,
          },
          ...STORE_REGISTRY.filter((s) => s.id !== DEFAULT_STORE_ID && s.active),
        ]
      }
      return STORE_REGISTRY.filter((s) => s.active)
    }

    const ids = new Set(fromDb.map((s) => s.id))
    for (const reg of STORE_REGISTRY) {
      if (reg.active && !ids.has(reg.id)) fromDb.push(reg)
    }
    return fromDb
  } catch {
    return STORE_REGISTRY.filter((s) => s.active)
  }
}

export function getShippingCost(config: StoreConfig, distrito: string): number {
  const override = config.shippingByDistrito[distrito]
  if (override == null || override <= 0) return config.shippingDefault
  return override
}
