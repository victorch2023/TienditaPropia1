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
import type { Order, OrderPayment, OrderStatus } from '../types'

const COL = 'orders'
const DEMO_ORDER_ID = 'demo-order-preview'

export async function createOrder(order: Omit<Order, 'id'>): Promise<string> {
  if (isDemoMode()) {
    console.info('[demo] Pedido simulado — no se guardó en Firestore')
    return DEMO_ORDER_ID
  }
  const orderRef = doc(collection(db, COL))
  await setDoc(orderRef, { ...order, id: orderRef.id })
  return orderRef.id
}

export async function updateOrderPayment(
  orderId: string,
  payment: Partial<OrderPayment>
): Promise<void> {
  if (isDemoMode()) return
  const order = await getOrder(orderId)
  if (!order) return
  await updateDoc(doc(db, COL, orderId), {
    payment: { ...order.payment, ...payment },
    updatedAt: Date.now(),
  })
}

export async function getOrder(id: string): Promise<Order | null> {
  if (isDemoMode() && id === DEMO_ORDER_ID) {
    return {
      id: DEMO_ORDER_ID,
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
  return { id: snap.id, ...snap.data() } as Order
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
  await updateDoc(doc(db, COL, id), {
    fiscal: { ...order.fiscal, status: fiscalStatus },
    updatedAt: Date.now(),
  })
}

export async function getOrdersByUser(userId: string): Promise<Order[]> {
  if (isDemoMode()) return []
  const q = query(
    collection(db, COL),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order))
}

export async function getAllOrders(): Promise<Order[]> {
  if (isDemoMode()) return []
  const q = query(collection(db, COL), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order))
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
