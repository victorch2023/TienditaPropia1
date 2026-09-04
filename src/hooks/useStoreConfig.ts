import { useCallback, useEffect, useState } from 'react'
import { getStoreConfig, subscribeStoreConfig } from '../services/store'
import type { StoreConfig } from '../types'
import { DEFAULT_STORE_CONFIG } from '../types'
import { useStore } from './useStore'

export function useStoreConfig() {
  const { storeId } = useStore()
  const [config, setConfig] = useState<StoreConfig>(DEFAULT_STORE_CONFIG)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const data = await getStoreConfig(storeId)
    setConfig(data)
    return data
  }, [storeId])

  useEffect(() => {
    setLoading(true)
    const unsub = subscribeStoreConfig(
      storeId,
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
  }, [storeId])

  return { config, loading, refresh, storeId }
}
