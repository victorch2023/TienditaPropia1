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
import {
  DEMO_PRODUCTS,
  demoError,
  isDemoMode,
} from '../config/demo'
import type { Product } from '../types'

const COL = 'products'

export async function getProducts(activeOnly = false): Promise<Product[]> {
  if (isDemoMode()) {
    return activeOnly ? DEMO_PRODUCTS.filter((p) => p.active) : [...DEMO_PRODUCTS]
  }
  let q = query(collection(db, COL), orderBy('createdAt', 'desc'))
  if (activeOnly) {
    q = query(collection(db, COL), where('active', '==', true), orderBy('createdAt', 'desc'))
  }
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product))
}

export async function getProductsByCategory(categoryId: string): Promise<Product[]> {
  if (isDemoMode()) {
    return DEMO_PRODUCTS.filter((p) => p.categoryId === categoryId && p.active)
  }
  const q = query(
    collection(db, COL),
    where('categoryId', '==', categoryId),
    where('active', '==', true)
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product))
}

export async function getProduct(id: string): Promise<Product | null> {
  if (isDemoMode()) {
    return DEMO_PRODUCTS.find((p) => p.id === id) ?? null
  }
  const snap = await getDoc(doc(db, COL, id))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as Product
}

export async function createProduct(data: Omit<Product, 'id'>): Promise<string> {
  if (isDemoMode()) throw demoError('Crear productos')
  const refDoc = doc(collection(db, COL))
  await setDoc(refDoc, { ...data, createdAt: Date.now() })
  return refDoc.id
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<void> {
  if (isDemoMode()) throw demoError('Editar productos')
  await updateDoc(doc(db, COL, id), { ...data, updatedAt: Date.now() })
}

export async function deleteProduct(id: string): Promise<void> {
  if (isDemoMode()) throw demoError('Eliminar productos')
  await deleteDoc(doc(db, COL, id))
}
