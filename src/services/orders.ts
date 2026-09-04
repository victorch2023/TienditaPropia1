import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  orderBy,
} from 'firebase/firestore'
import { db } from './firebase'
import { demoError, isDemoMode } from '../config/demo'
import { belongsToStore } from '../config/stores'
import { stripUndefined } from '../utils/firestore'
import type { Order, OrderPayment, OrderStatus } from '../types'

const COL = 'orders'
const DEMO_ORDER_ID = 'demo-order-preview'

export async function createOrder(order: Omit<Order, 'id'>): Promise<string> {
  if (isDemoMode()) {
    console.info('[demo] Pedido simulado — no se guardó en Firestore')
    return DEMO_ORDER_ID
  }
  const orderRef = doc(collection(db, COL))
  await setDoc(orderRef, stripUndefined({ ...order, id: orderRef.id }))
  return orderRef.id
}

export async function updateOrderPayment(
  orderId: string,
  payment: Partial<OrderPayment>
): Promise<void> {
  if (isDemoMode()) return
  const order = await getOrder(orderId)
  if (!order) return
  await updateDoc(
    doc(db, COL, orderId),
    stripUndefined({
      payment: { ...order.payment, ...payment },
      updatedAt: Date.now(),
    })
  )
}

export async function getOrder(id: string, storeId?: string): Promise<Order | null> {
  if (isDemoMode() && id === DEMO_ORDER_ID) {
    return {
      id: DEMO_ORDER_ID,
      storeId: storeId || 'tiendita',
      items: [],
      subtotal: 0,
      igv: 0,
      total: 0,
      shipping: 0,
      status: 'pendiente_pago',
      payment: {
        method: 'manual',
        manualMethod: 'yape',
        paymentReference: 'DEMO-123',
        submittedAt: Date.now(),
      },
      fiscal: { tipo: 'boleta', documento: '00000000', status: 'pendiente' },
      shippingAddress: {
        distrito: 'Miraflores',
        direccion: 'Av. Demo 123',
        referencia: '',
        telefono: '999999999',
        nombre: 'Cliente demo',
        email: 'demo@ejemplo.com',
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
  }
  if (isDemoMode()) return null
  const snap = await getDoc(doc(db, COL, id))
  if (!snap.exists()) return null
  const order = { id: snap.id, ...snap.data() } as Order
  if (storeId && !belongsToStore(order, storeId)) return null
  return order
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  if (isDemoMode()) throw demoError('Actualizar pedidos')
  await updateDoc(doc(db, COL, id), { status, updatedAt: Date.now() })
}

export async function updateOrderFiscalStatus(
  id: string,
  fiscalStatus: 'pendiente' | 'emitido'
): Promise<void> {
  if (isDemoMode()) throw demoError('Actualizar facturación')
  const order = await getOrder(id)
  if (!order) return
  await updateDoc(
    doc(db, COL, id),
    stripUndefined({
      fiscal: { ...order.fiscal, status: fiscalStatus },
      updatedAt: Date.now(),
    })
  )
}

export async function getOrdersByUser(
  userId: string,
  storeId?: string
): Promise<Order[]> {
  if (isDemoMode()) return []
  const q = query(
    collection(db, COL),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order))
  if (!storeId) return orders
  return orders.filter((o) => belongsToStore(o, storeId))
}

export async function getAllOrders(storeId: string): Promise<Order[]> {
  if (isDemoMode()) return []
  try {
    const q = query(
      collection(db, COL),
      where('storeId', '==', storeId),
      orderBy('createdAt', 'desc')
    )
    const snap = await getDocs(q)
    const withStore = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order))
    if (storeId === 'tiendita') {
      const all = await getDocs(query(collection(db, COL), orderBy('createdAt', 'desc')))
      const legacy = all.docs
        .map((d) => ({ id: d.id, ...d.data() } as Order))
        .filter((o) => !o.storeId)
      const ids = new Set(withStore.map((o) => o.id))
      return [...withStore, ...legacy.filter((o) => !ids.has(o.id))].sort(
        (a, b) => b.createdAt - a.createdAt
      )
    }
    return withStore
  } catch {
    const snap = await getDocs(query(collection(db, COL), orderBy('createdAt', 'desc')))
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as Order))
      .filter((o) => belongsToStore(o, storeId))
  }
}

export async function confirmManualPayment(orderId: string): Promise<void> {
  if (isDemoMode()) throw demoError('Confirmar pagos')
  const order = await getOrder(orderId)
  if (!order) return
  await updateDoc(doc(db, COL, orderId), {
    status: 'pagado',
    payment: { ...order.payment, method: 'manual', paidAt: Date.now() },
    updatedAt: Date.now(),
  })
}

export async function markOrderPaid(
  orderId: string,
  culqiChargeId: string
): Promise<void> {
  if (isDemoMode()) throw demoError('Confirmar pagos')
  await updateDoc(doc(db, COL, orderId), {
    status: 'pagado',
    payment: { method: 'culqi', culqiChargeId, paidAt: Date.now() },
    updatedAt: Date.now(),
  })
}
