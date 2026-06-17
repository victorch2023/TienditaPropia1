import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db } from './firebase'
import { demoError, isDemoMode } from '../config/demo'
import type { AppUser, UserRole } from '../types'

export async function getUserProfile(uid: string): Promise<AppUser | null> {
  if (isDemoMode()) return null
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  const data = snap.data()
  return {
    uid,
    email: data.email ?? null,
    displayName: data.displayName ?? null,
    role: (data.role as UserRole) || 'customer',
    dni: data.dni,
    ruc: data.ruc,
  }
}

export async function signIn(email: string, password: string): Promise<AppUser> {
  if (isDemoMode()) throw demoError('Iniciar sesión')
  const cred = await signInWithEmailAndPassword(auth, email, password)
  const profile = await getUserProfile(cred.user.uid)
  if (!profile) {
    await ensureUserDocument(cred.user, 'customer')
    return (await getUserProfile(cred.user.uid))!
  }
  return profile
}

export async function signUp(
  email: string,
  password: string,
  displayName: string
): Promise<AppUser> {
  if (isDemoMode()) throw demoError('Registrarse')
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  await ensureUserDocument(cred.user, 'customer', displayName)
  return (await getUserProfile(cred.user.uid))!
}

export async function ensureUserDocument(
  user: User,
  role: UserRole = 'customer',
  displayName?: string
): Promise<void> {
  const ref = doc(db, 'users', user.uid)
  const existing = await getDoc(ref)
  if (!existing.exists()) {
    await setDoc(ref, {
      email: user.email,
      displayName: displayName || user.displayName || '',
      role,
      createdAt: Date.now(),
    })
  }
}

export function subscribeAuth(callback: (user: AppUser | null) => void): () => void {
  if (isDemoMode()) {
    callback(null)
    return () => {}
  }
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      callback(null)
      return
    }
    const profile = await getUserProfile(firebaseUser.uid)
    callback(profile)
  })
}

export async function logOut(): Promise<void> {
  if (isDemoMode()) return
  await signOut(auth)
}

export function isAdmin(user: AppUser | null): boolean {
  return user?.role === 'admin'
}
