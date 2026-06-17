import { useEffect, useState } from 'react'
import { getProducts } from '../services/products'
import type { Product } from '../types'

export function useProducts(activeOnly = true) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    getProducts(activeOnly)
      .then(setProducts)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [activeOnly])

  return { products, loading, error, refresh: () => getProducts(activeOnly).then(setProducts) }
}
