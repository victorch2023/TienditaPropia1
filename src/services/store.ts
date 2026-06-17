import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import { DEMO_STORE_CONFIG, demoError, isDemoMode } from '../config/demo'
import { DEFAULT_PAYMENTS_CONFIG, DEFAULT_STORE_CONFIG, type StoreConfig } from '../types'

const CONFIG_PATH = 'stores/config'

export async function getStoreConfig(): Promise<StoreConfig> {
  if (isDemoMode()) return DEMO_STORE_CONFIG
  const snap = await getDoc(doc(db, CONFIG_PATH))
  if (!snap.exists()) return DEFAULT_STORE_CONFIG
  const data = snap.data()
  return {
    ...DEFAULT_STORE_CONFIG,
    ...data,
    payments: { ...DEFAULT_PAYMENTS_CONFIG, ...data.payments },
  } as StoreConfig
}

export async function updateStoreConfig(config: Partial<StoreConfig>): Promise<void> {
  if (isDemoMode()) throw demoError('Guardar configuración')
  await setDoc(doc(db, CONFIG_PATH), { ...config, updatedAt: Date.now() }, { merge: true })
}

export function getShippingCost(
  config: StoreConfig,
  distrito: string
): number {
  return config.shippingByDistrito[distrito] ?? config.shippingDefault
}
