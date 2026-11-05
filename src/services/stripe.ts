/**
 * Cliente Stripe (solo publishable key + llamadas a Cloud Functions).
 * Secret keys NUNCA van en el frontend ni en Firestore.
 *
 * Fase actual: UI + validación. Las pruebas reales con Stripe vienen después.
 */
import { FUNCTIONS_URL } from './firebase'
import { demoError, isDemoMode } from '../config/demo'

export const STRIPE_PUBLISHABLE_KEY =
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''

export function hasStripePublishableKey(): boolean {
  const key = STRIPE_PUBLISHABLE_KEY.trim()
  return Boolean(key) && key.startsWith('pk_')
}

export function isStripeTestPublishableKey(): boolean {
  return STRIPE_PUBLISHABLE_KEY.trim().startsWith('pk_test_')
}

export interface CreateStripePaymentRequest {
  storeId: string
  orderId: string
  amountCents: number
  currency?: string
  email: string
  stripeAccountId?: string
  /** Comisión de plataforma en céntimos (Connect application_fee). */
  applicationFeeCents?: number
}

export interface CreateStripePaymentResponse {
  success: boolean
  clientSecret?: string
  paymentIntentId?: string
  error?: string
  /** true cuando la function responde en modo stub / sin secrets. */
  preparationMode?: boolean
}

/**
 * Llama a la Cloud Function `createStripePayment`.
 * Si faltan secrets o keys, la function debe fallar con mensaje claro.
 */
export async function createStripePayment(
  request: CreateStripePaymentRequest
): Promise<CreateStripePaymentResponse> {
  if (isDemoMode()) throw demoError('Procesar pagos con Stripe')

  if (!hasStripePublishableKey()) {
    return {
      success: false,
      preparationMode: true,
      error:
        'Modo preparación: faltan claves de prueba (VITE_STRIPE_PUBLISHABLE_KEY). Las pruebas con Stripe vienen después.',
    }
  }

  const res = await fetch(`${FUNCTIONS_URL}/createStripePayment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...request,
      currency: request.currency || 'pen',
    }),
  })

  let data: CreateStripePaymentResponse
  try {
    data = (await res.json()) as CreateStripePaymentResponse
  } catch {
    throw new Error('Respuesta inválida de createStripePayment')
  }

  if (!res.ok) {
    return {
      success: false,
      preparationMode: data.preparationMode,
      error:
        data.error ||
        'No se pudo iniciar el pago con Stripe. Revisa secrets / functions.',
    }
  }

  return data
}
