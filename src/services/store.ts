import {
  collection,
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
  DEFAULT_STORE_ID,
  LEGACY_CONFIG_DOC_ID,
  STORE_REGISTRY,
  getDemoStoreConfig,
  getStoreMeta,
} from '../config/stores'
import {
  DEFAULT_PAYMENTS_CONFIG,
  DEFAULT_STORE_CONFIG,
  type StoreConfig,
  type StoreMeta,
} from '../types'
import { stripUndefined } from '../utils/firestore'

export function parseStoreConfigData(
  data: Record<string, unknown> | undefined
): StoreConfig {
  if (!data) return DEFAULT_STORE_CONFIG
  return {
    ...DEFAULT_STORE_CONFIG,
    ...data,
    payments: {
      ...DEFAULT_PAYMENTS_CONFIG,
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
  if (!snap.exists()) {
    const meta = getStoreMeta(storeId)
    return meta
      ? { ...DEFAULT_STORE_CONFIG, name: meta.name, description: meta.tagline, slug: storeId, active: true }
      : DEFAULT_STORE_CONFIG
  }
  return parseStoreConfigData(snap.data())
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
        onData(parseStoreConfigData(snap.data()))
        return
      }
      if (storeId === DEFAULT_STORE_ID) {
        getDoc(doc(db, 'stores', LEGACY_CONFIG_DOC_ID)).then((legacy) => {
          onData(
            legacy.exists()
              ? parseStoreConfigData(legacy.data())
              : DEFAULT_STORE_CONFIG
          )
        })
        return
      }
      const meta = getStoreMeta(storeId)
      onData(
        meta
          ? {
              ...DEFAULT_STORE_CONFIG,
              name: meta.name,
              description: meta.tagline,
              slug: storeId,
              active: true,
            }
          : DEFAULT_STORE_CONFIG
      )
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
  await setDoc(
    doc(db, 'stores', storeId),
    stripUndefined({
      ...config,
      slug: storeId,
      active: config.active ?? true,
      updatedAt: Date.now(),
    }),
    { merge: true }
  )
  if (storeId === DEFAULT_STORE_ID) {
    await setDoc(
      doc(db, 'stores', LEGACY_CONFIG_DOC_ID),
      stripUndefined({ ...config, updatedAt: Date.now() }),
      { merge: true }
    )
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
  return config.shippingByDistrito[distrito] ?? config.shippingDefault
}
