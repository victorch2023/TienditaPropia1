/**
 * Webhook stub de Stripe.
 *
 * TODO (pruebas reales):
 * - Verificar firma con STRIPE_WEBHOOK_SECRET
 * - Manejar payment_intent.succeeded / payment_intent.payment_failed
 * - Actualizar orders/{orderId} → status pagado + stock
 * - Soportar eventos Connect (stripe-account header)
 */
import { onRequest } from 'firebase-functions/v2/https'
import { defineSecret } from 'firebase-functions/params'

const stripeWebhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET')

export const stripeWebhook = onRequest(
  { secrets: [stripeWebhookSecret], cors: false },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed')
      return
    }

    // Estructura lista; implementación completa en la fase de pruebas Stripe.
    const sig = req.headers['stripe-signature']
    if (!sig) {
      res.status(400).json({
        received: false,
        error: 'Falta header stripe-signature',
        todo: 'Configurar endpoint en Stripe Dashboard + STRIPE_WEBHOOK_SECRET',
      })
      return
    }

    let secret = ''
    try {
      secret = stripeWebhookSecret.value()?.trim() || ''
    } catch {
      secret = ''
    }

    if (!secret) {
      res.status(503).json({
        received: false,
        preparationMode: true,
        error:
          'Modo preparación: falta STRIPE_WEBHOOK_SECRET. Las pruebas con Stripe vienen después.',
      })
      return
    }

    // TODO: const event = stripe.webhooks.constructEvent(rawBody, sig, secret)
    // TODO: switch (event.type) { case 'payment_intent.succeeded': ... }

    console.info('stripeWebhook stub hit', {
      hasSignature: Boolean(sig),
      contentType: req.headers['content-type'],
    })

    res.status(200).json({
      received: true,
      stub: true,
      message:
        'Webhook Stripe en modo stub. Completar verificación de firma y actualización de pedidos en la fase de pruebas.',
    })
  }
)
