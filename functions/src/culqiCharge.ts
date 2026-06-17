/**
 * Pasarela de pago con tarjeta vía Culqi (opcional).
 * Desactivada por defecto — habilitar en Admin → Configuración → "Activar pasarela externa (Culqi)".
 * Requiere CULQI_SECRET_KEY en Firebase Functions y VITE_CULQI_PUBLIC_KEY en el cliente.
 */
import { onRequest } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import * as admin from 'firebase-admin'

const culqiSecretKey = defineSecret('CULQI_SECRET_KEY')

interface ChargeRequest {
  token: string
  orderId: string
  amount: number
  email: string
}

export const culqiCharge = onRequest(
  { secrets: [culqiSecretKey], cors: true },
  async (req, res) => {
    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }

    if (req.method !== 'POST') {
      res.status(405).json({ success: false, error: 'Método no permitido' })
      return
    }

    const { token, orderId, amount, email } = req.body as ChargeRequest

    if (!token || !orderId || !amount || !email) {
      res.status(400).json({ success: false, error: 'Datos incompletos' })
      return
    }

    const db = admin.firestore()
    const orderRef = db.collection('orders').doc(orderId)
    const orderSnap = await orderRef.get()

    if (!orderSnap.exists) {
      res.status(404).json({ success: false, error: 'Pedido no encontrado' })
      return
    }

    const order = orderSnap.data()!
    if (order.status !== 'pendiente_pago') {
      res.status(400).json({ success: false, error: 'Pedido ya procesado' })
      return
    }

    if (order.total !== amount) {
      res.status(400).json({ success: false, error: 'Monto no coincide' })
      return
    }

    try {
      const culqiRes = await fetch('https://api.culqi.com/v2/charges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${culqiSecretKey.value()}`,
        },
        body: JSON.stringify({
          amount,
          currency_code: 'PEN',
          email,
          source_id: token,
          description: `Pedido ${orderId}`,
        }),
      })

      const culqiData = await culqiRes.json()

      if (!culqiRes.ok) {
        res.status(400).json({
          success: false,
          error: culqiData.user_message || culqiData.merchant_message || 'Error en Culqi',
        })
        return
      }

      await orderRef.update({
        status: 'pagado',
        payment: {
          method: 'culqi',
          culqiChargeId: culqiData.id,
          paidAt: Date.now(),
        },
        updatedAt: Date.now(),
      })

      for (const item of order.items ?? []) {
        const productRef = db.collection('products').doc(item.productId)
        const productSnap = await productRef.get()
        if (productSnap.exists) {
          const currentStock = productSnap.data()?.stock ?? 0
          await productRef.update({
            stock: Math.max(0, currentStock - (item.quantity ?? 0)),
          })
        }
      }

      res.json({ success: true, chargeId: culqiData.id })
    } catch (err) {
      console.error('culqiCharge error:', err)
      res.status(500).json({ success: false, error: 'Error interno al procesar pago' })
    }
  }
)
