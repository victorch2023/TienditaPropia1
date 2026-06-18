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
import { DEMO_CATEGORIES, demoError, isDemoMode } from '../config/demo'
import type { Category } from '../types'
import { stripUndefined } from '../utils/firestore'

const COL = 'categories'

export async function getCategories(): Promise<Category[]> {
  if (isDemoMode()) return [...DEMO_CATEGORIES]
  const q = query(collection(db, COL), orderBy('order', 'asc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Category))
}

export async function getCategory(id: string): Promise<Category | null> {
  if (isDemoMode()) return DEMO_CATEGORIES.find((c) => c.id === id) ?? null
  const snap = await getDoc(doc(db, COL, id))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() } as Category
}

export async function createCategory(data: Omit<Category, 'id'>): Promise<string> {
  if (isDemoMode()) throw demoError('Crear categorías')
  const ref = doc(collection(db, COL))
  await setDoc(ref, stripUndefined({ ...data, createdAt: Date.now() }))
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
