import { useEffect, useState } from 'react'
import { getStoreConfig } from '../services/store'
import type { StoreConfig } from '../types'
import { DEFAULT_STORE_CONFIG } from '../types'

export function useStoreConfig() {
  const [config, setConfig] = useState<StoreConfig>(DEFAULT_STORE_CONFIG)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getStoreConfig()
      .then(setConfig)
      .catch(() => setConfig(DEFAULT_STORE_CONFIG))
      .finally(() => setLoading(false))
  }, [])

  return { config, loading, refresh: () => getStoreConfig().then(setConfig) }
}
