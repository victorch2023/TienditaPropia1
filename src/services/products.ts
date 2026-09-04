import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  deleteDoc,
  updateDoc,
  where,
  orderBy,
} from 'firebase/firestore'
import { db } from './firebase'
import { demoError, isDemoMode } from '../config/demo'
import { belongsToStore, getDemoProducts } from '../config/stores'
import type { Product } from '../types'
import { stripUndefined } from '../utils/firestore'

const COL = 'products'

export async function getProducts(
  storeId: string,
  activeOnly = false
): Promise<Product[]> {
  if (isDemoMode()) return getDemoProducts(storeId, activeOnly)

  try {
    let q = query(
      collection(db, COL),
      where('storeId', '==', storeId),
      orderBy('createdAt', 'desc')
    )
    if (activeOnly) {
      q = query(
        collection(db, COL),
        where('storeId', '==', storeId),
        where('active', '==', true),
        orderBy('createdAt', 'desc')
      )
    }
    const snap = await getDocs(q)
    const withStore = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product))

    // Migración: docs sin storeId = tienda default
    if (storeId === 'tiendita') {
      const all = await getDocs(query(collection(db, COL), orderBy('createdAt', 'desc')))
      const legacy = all.docs
        .map((d) => ({ id: d.id, ...d.data() } as Product))
        .filter((p) => !p.storeId)
        .filter((p) => !activeOnly || p.active)
      const ids = new Set(withStore.map((p) => p.id))
      return [...withStore, ...legacy.filter((p) => !ids.has(p.id))]
    }
    return withStore
  } catch {
    const snap = await getDocs(query(collection(db, COL), orderBy('createdAt', 'desc')))
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Product))
      .filter((p) => belongsToStore(p, storeId))
      .filter((p) => !activeOnly || p.active)
  }
}

export async function getProductsByCategory(
  storeId: string,
  categoryId: string
): Promise<Product[]> {
  if (isDemoMode()) {
    return getDemoProducts(storeId, true).filter((p) => p.categoryId === categoryId)
  }
  const all = await getProducts(storeId, true)
  return all.filter((p) => p.categoryId === categoryId)
}

export async function getProduct(
  storeId: string,
  id: string
): Promise<Product | null> {
  if (isDemoMode()) {
    return getDemoProducts(storeId).find((p) => p.id === id) ?? null
  }
  const snap = await getDoc(doc(db, COL, id))
  if (!snap.exists()) return null
  const product = { id: snap.id, ...snap.data() } as Product
  if (!belongsToStore(product, storeId)) return null
  return product
}

export async function createProduct(
  storeId: string,
  data: Omit<Product, 'id' | 'storeId'>
): Promise<string> {
  if (isDemoMode()) throw demoError('Crear productos')
  const refDoc = doc(collection(db, COL))
  await setDoc(
    refDoc,
    stripUndefined({ ...data, storeId, createdAt: Date.now() })
  )
  return refDoc.id
}

export async function updateProduct(
  id: string,
  data: Partial<Product>
): Promise<void> {
  if (isDemoMode()) throw demoError('Editar productos')
  await updateDoc(doc(db, COL, id), stripUndefined({ ...data, updatedAt: Date.now() }))
}

export async function deleteProduct(id: string): Promise<void> {
  if (isDemoMode()) throw demoError('Eliminar productos')
  await deleteDoc(doc(db, COL, id))
}
