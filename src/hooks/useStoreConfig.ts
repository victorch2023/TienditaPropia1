import { useCallback, useEffect, useState } from 'react'
import { getStoreConfig, subscribeStoreConfig } from '../services/store'
import type { StoreConfig } from '../types'
import { DEFAULT_STORE_CONFIG } from '../types'

export function useStoreConfig() {
  const [config, setConfig] = useState<StoreConfig>(DEFAULT_STORE_CONFIG)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const data = await getStoreConfig()
    setConfig(data)
    return data
  }, [])

  useEffect(() => {
    const unsub = subscribeStoreConfig(
      (data) => {
        setConfig(data)
        setLoading(false)
      },
      () => {
        setConfig(DEFAULT_STORE_CONFIG)
        setLoading(false)
      }
    )
    return unsub
  }, [])

  return { config, loading, refresh }
}
