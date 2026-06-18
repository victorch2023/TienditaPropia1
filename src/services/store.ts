import { doc, getDoc, onSnapshot, setDoc, type Unsubscribe } from 'firebase/firestore'
import { db } from './firebase'
import { DEMO_STORE_CONFIG, demoError, isDemoMode } from '../config/demo'
import { DEFAULT_PAYMENTS_CONFIG, DEFAULT_STORE_CONFIG, type StoreConfig } from '../types'
import { stripUndefined } from '../utils/firestore'

const CONFIG_PATH = 'stores/config'

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

export async function getStoreConfig(): Promise<StoreConfig> {
  if (isDemoMode()) return DEMO_STORE_CONFIG
  const snap = await getDoc(doc(db, CONFIG_PATH))
  if (!snap.exists()) return DEFAULT_STORE_CONFIG
  return parseStoreConfigData(snap.data())
}

export function subscribeStoreConfig(
  onData: (config: StoreConfig) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  if (isDemoMode()) {
    onData(DEMO_STORE_CONFIG)
    return () => {}
  }
  return onSnapshot(
    doc(db, CONFIG_PATH),
    (snap) => {
      onData(snap.exists() ? parseStoreConfigData(snap.data()) : DEFAULT_STORE_CONFIG)
    },
    (err) => onError?.(err)
  )
}

export async function updateStoreConfig(config: Partial<StoreConfig>): Promise<void> {
  if (isDemoMode()) throw demoError('Guardar configuración')
  await setDoc(
    doc(db, CONFIG_PATH),
    stripUndefined({ ...config, updatedAt: Date.now() }),
    { merge: true }
  )
}

export function getShippingCost(
  config: StoreConfig,
  distrito: string
): number {
  return config.shippingByDistrito[distrito] ?? config.shippingDefault
}
