import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  deleteDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from './firebase'
import { demoError, isDemoMode } from '../config/demo'
import { belongsToStore, getDemoCategories } from '../config/stores'
import type { Category } from '../types'
import { stripUndefined } from '../utils/firestore'

const COL = 'categories'

export async function getCategories(storeId: string): Promise<Category[]> {
  if (isDemoMode()) return getDemoCategories(storeId)
  const snap = await getDocs(query(collection(db, COL), orderBy('order', 'asc')))
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as Category))
    .filter((c) => belongsToStore(c, storeId))
}

export async function getCategory(
  storeId: string,
  id: string
): Promise<Category | null> {
  if (isDemoMode()) {
    return getDemoCategories(storeId).find((c) => c.id === id) ?? null
  }
  const snap = await getDoc(doc(db, COL, id))
  if (!snap.exists()) return null
  const cat = { id: snap.id, ...snap.data() } as Category
  if (!belongsToStore(cat, storeId)) return null
  return cat
}

export async function createCategory(
  storeId: string,
  data: Omit<Category, 'id' | 'storeId'>
): Promise<string> {
  if (isDemoMode()) throw demoError('Crear categorías')
  const ref = doc(collection(db, COL))
  await setDoc(ref, stripUndefined({ ...data, storeId, createdAt: Date.now() }))
  return ref.id
}

export async function updateCategory(id: string, data: Partial<Category>): Promise<void> {
  if (isDemoMode()) throw demoError('Editar categorías')
  await updateDoc(doc(db, COL, id), stripUndefined({ ...data, updatedAt: Date.now() }))
}

export async function deleteCategory(id: string): Promise<void> {
  if (isDemoMode()) throw demoError('Eliminar categorías')
  await deleteDoc(doc(db, COL, id))
}
