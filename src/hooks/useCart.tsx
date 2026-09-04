import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { CartItem } from '../types'
import { useStore } from './useStore'

function cartKey(storeId: string) {
  return `cart-${storeId}`
}

interface CartContextValue {
  items: CartItem[]
  itemCount: number
  subtotal: number
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  removeItem: (productId: string, variantName?: string) => void
  updateQuantity: (productId: string, quantity: number, variantName?: string) => void
  clearCart: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

function loadCart(storeId: string): CartItem[] {
  try {
    const raw = localStorage.getItem(cartKey(storeId))
    if (raw) return JSON.parse(raw) as CartItem[]
    // Migración desde carrito global legacy solo para tiendita
    if (storeId === 'tiendita') {
      const legacy = localStorage.getItem('tiendita_cart')
      if (legacy) return JSON.parse(legacy) as CartItem[]
    }
    return []
  } catch {
    return []
  }
}

function itemKey(productId: string, variantName?: string) {
  return `${productId}::${variantName || ''}`
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { storeId } = useStore()
  const [items, setItems] = useState<CartItem[]>(() => loadCart(storeId))

  useEffect(() => {
    setItems(loadCart(storeId))
  }, [storeId])

  useEffect(() => {
    localStorage.setItem(cartKey(storeId), JSON.stringify(items))
  }, [items, storeId])

  const addItem = useCallback(
    (item: Omit<CartItem, 'quantity'>, quantity = 1) => {
      setItems((prev) => {
        const key = itemKey(item.productId, item.variantName)
        const existing = prev.find(
          (i) => itemKey(i.productId, i.variantName) === key
        )
        if (existing) {
          const newQty = Math.min(existing.quantity + quantity, item.maxStock)
          return prev.map((i) =>
            itemKey(i.productId, i.variantName) === key
              ? { ...i, quantity: newQty }
              : i
          )
        }
        return [...prev, { ...item, quantity: Math.min(quantity, item.maxStock) }]
      })
    },
    []
  )

  const removeItem = useCallback((productId: string, variantName?: string) => {
    const key = itemKey(productId, variantName)
    setItems((prev) => prev.filter((i) => itemKey(i.productId, i.variantName) !== key))
  }, [])

  const updateQuantity = useCallback(
    (productId: string, quantity: number, variantName?: string) => {
      const key = itemKey(productId, variantName)
      if (quantity <= 0) {
        setItems((prev) => prev.filter((i) => itemKey(i.productId, i.variantName) !== key))
        return
      }
      setItems((prev) =>
        prev.map((i) =>
          itemKey(i.productId, i.variantName) === key
            ? { ...i, quantity: Math.min(quantity, i.maxStock) }
            : i
        )
      )
    },
    []
  )

  const clearCart = useCallback(() => setItems([]), [])

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  )

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
  )

  const value = useMemo(
    () => ({
      items,
      itemCount,
      subtotal,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    }),
    [items, itemCount, subtotal, addItem, removeItem, updateQuantity, clearCart]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider')
  return ctx
}
