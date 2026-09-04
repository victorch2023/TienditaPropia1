import { useCallback, useEffect, useState } from 'react'
import { getDemoStoreConfig } from '../config/stores'
import { getStoreConfig, subscribeStoreConfig } from '../services/store'
import type { StoreConfig } from '../types'
import { useStore } from './useStore'

export function useStoreConfig() {
  const { storeId } = useStore()
  const [config, setConfig] = useState<StoreConfig>(() =>
    getDemoStoreConfig(storeId)
  )
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const data = await getStoreConfig(storeId)
    setConfig(data)
    return data
  }, [storeId])

  useEffect(() => {
    // Defaults síncronos por storeId (evita flash de "Mi Tiendita" en Citroleaf)
    setConfig(getDemoStoreConfig(storeId))
    setLoading(true)
    const unsub = subscribeStoreConfig(
      storeId,
      (data) => {
        setConfig(data)
        setLoading(false)
      },
      () => {
        setConfig(getDemoStoreConfig(storeId))
        setLoading(false)
      }
    )
    return unsub
  }, [storeId])

  useEffect(() => {
    if (config.name) {
      document.title = config.name
    }
  }, [config.name])

  return { config, loading, refresh, storeId }
}
