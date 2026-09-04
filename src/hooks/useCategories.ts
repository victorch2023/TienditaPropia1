import { useEffect, useState } from 'react'
import { getCategories } from '../services/categories'
import type { Category } from '../types'
import { useStore } from './useStore'

export function useCategories() {
  const { storeId } = useStore()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getCategories(storeId)
      .then(setCategories)
      .catch(() => setCategories([]))
      .finally(() => setLoading(false))
  }, [storeId])

  return {
    categories,
    loading,
    refresh: () => getCategories(storeId).then(setCategories),
  }
}
