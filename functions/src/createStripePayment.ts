/**
 * Stub / preparación: crea un PaymentIntent de Stripe Connect.
 *
 * - Secret: STRIPE_SECRET_KEY (usar sk_test_… hasta nuevo aviso)
 * - No guardar secrets en Firestore
 * - Si falta el secret, responde preparationMode con error claro
 *
 * TODO (pruebas reales): confirmar currency PEN, captura, metadata de pedido,
 * y flujo Elements / Checkout Session en el cliente.
 */
import { onRequest } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'
import * as admin from 'firebase-admin'
import Stripe from 'stripe'

const stripeSecretKey = defineSecret('STRIPE_SECRET_KEY')

interface CreateStripePaymentBody {
  storeId: string
  orderId: string
  amountCents: number
  currency?: string
  email: string
  stripeAccountId?: string
  applicationFeeCents?: number
}

function readSecretOrEmpty(): string {
  try {
    return stripeSecretKey.value()?.trim() || ''
  } catch {
    return ''
  }
}

export const createStripePayment = onRequest(
  { secrets: [stripeSecretKey], cors: true },
  async (req, res) => {
    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }

    if (req.method !== 'POST') {
      res.status(405).json({ success: false, error: 'Método no permitido' })
      return
    }

    const secret = readSecretOrEmpty()
    if (!secret) {
      res.status(503).json({
        success: false,
        preparationMode: true,
        error:
          'Modo preparación: falta STRIPE_SECRET_KEY en Functions. Usa sk_test_… y despliega secrets antes de probar.',
      })
      return
    }

    if (!secret.startsWith('sk_')) {
      res.status(500).json({
        success: false,
        error: 'STRIPE_SECRET_KEY inválida (debe empezar con sk_test_ o sk_live_).',
      })
      return
    }

    const body = req.body as CreateStripePaymentBody
    const {
      storeId,
      orderId,
      amountCents,
      email,
      stripeAccountId,
      applicationFeeCents,
    } = body
    const currency = (body.currency || 'pen').toLowerCase()

    if (!storeId || !orderId || !amountCents || !email) {
      res.status(400).json({ success: false, error: 'Datos incompletos' })
      return
    }

    if (amountCents < 100) {
      res.status(400).json({
        success: false,
        error: 'Monto mínimo no alcanzado',
      })
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
    if (order.storeId && order.storeId !== storeId) {
      res.status(400).json({ success: false, error: 'Tienda no coincide' })
      return
    }

    if (order.status !== 'pendiente_pago') {
      res.status(400).json({ success: false, error: 'Pedido ya procesado' })
      return
    }

    // El total del pedido puede incluir comisión pass_to_customer.
    if (typeof order.total === 'number' && order.total !== amountCents) {
      res.status(400).json({ success: false, error: 'Monto no coincide con el pedido' })
      return
    }

    const storeSnap = await db.collection('stores').doc(storeId).get()
    const storePayments = (storeSnap.data()?.payments || {}) as {
      stripeEnabled?: boolean
      stripeAccountId?: string
      stripeMode?: string
    }

    if (!storePayments.stripeEnabled) {
      res.status(400).json({
        success: false,
        error: 'Stripe no está activado para esta tienda',
      })
      return
    }

    const connectAccount =
      stripeAccountId?.trim() || storePayments.stripeAccountId?.trim() || ''

    if (!connectAccount) {
      res.status(400).json({
        success: false,
        preparationMode: true,
        error:
          'Falta stripeAccountId (Connect). En Admin puedes guardar un Account ID de prueba para desarrollo UI.',
      })
      return
    }

    if (storePayments.stripeMode === 'live' && secret.startsWith('sk_test_')) {
      res.status(400).json({
        success: false,
        error:
          'La tienda está en modo live pero STRIPE_SECRET_KEY es de test. Activa live solo cuando estemos listos.',
      })
      return
    }

    try {
      // apiVersion la fija el SDK instalado; no forzar una fecha frágil en el stub.
      const stripe = new Stripe(secret)

      const intentParams: Stripe.PaymentIntentCreateParams = {
        amount: amountCents,
        currency,
        receipt_email: email,
        metadata: {
          orderId,
          storeId,
        },
        automatic_payment_methods: { enabled: true },
      }

      if (applicationFeeCents && applicationFeeCents > 0) {
        intentParams.application_fee_amount = applicationFeeCents
      }

      const paymentIntent = await stripe.paymentIntents.create(intentParams, {
        stripeAccount: connectAccount,
      })

      await orderRef.update({
        payment: {
          ...(order.payment || {}),
          method: 'stripe',
          stripePaymentIntentId: paymentIntent.id,
          submittedAt: Date.now(),
        },
        updatedAt: Date.now(),
      })

      res.json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      })
    } catch (err) {
      console.error('createStripePayment error:', err)
      const message =
        err instanceof Error ? err.message : 'Error interno al crear PaymentIntent'
      res.status(500).json({ success: false, error: message })
    }
  }
)
