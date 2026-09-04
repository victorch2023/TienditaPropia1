import { useEffect, useState } from 'react'
import { getProducts } from '../services/products'
import type { Product } from '../types'
import { useStore } from './useStore'

export function useProducts(activeOnly = true) {
  const { storeId } = useStore()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    getProducts(storeId, activeOnly)
      .then(setProducts)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [activeOnly, storeId])

  return {
    products,
    loading,
    error,
    refresh: () => getProducts(storeId, activeOnly).then(setProducts),
  }
}
