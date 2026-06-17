import { FUNCTIONS_URL } from './firebase'

export interface CulqiChargeRequest {
  token: string
  orderId: string
  amount: number
  email: string
}

export interface CulqiChargeResponse {
  success: boolean
  chargeId?: string
  error?: string
}

import { demoError, isDemoMode } from '../config/demo'

export async function chargeWithCulqi(
  request: CulqiChargeRequest
): Promise<CulqiChargeResponse> {
  if (isDemoMode()) throw demoError('Procesar pagos con Culqi')
  const res = await fetch(`${FUNCTIONS_URL}/culqiCharge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  const data = (await res.json()) as CulqiChargeResponse
  if (!res.ok) {
    throw new Error(data.error || 'Error al procesar el pago')
  }
  return data
}

declare global {
  interface Window {
    Culqi: {
      publicKey: string
      settings: (opts: {
        title: string
        currency: string
        amount: number
        order: string
      }) => void
      options: (opts: { lang: string; installments: boolean }) => void
      open: () => void
      token?: { id: string }
      error?: { user_message: string }
    }
    culqi: () => void
  }
}

export function initCulqiCheckout(
  publicKey: string,
  amountCentavos: number,
  orderId: string,
  onToken: (tokenId: string) => void,
  onError: (message: string) => void
): void {
  window.Culqi.publicKey = publicKey
  window.Culqi.settings({
    title: 'Mi Tiendita',
    currency: 'PEN',
    amount: amountCentavos,
    order: orderId,
  })
  window.Culqi.options({ lang: 'es', installments: false })

  window.culqi = () => {
    if (window.Culqi.token?.id) {
      onToken(window.Culqi.token.id)
    } else if (window.Culqi.error) {
      onError(window.Culqi.error.user_message || 'Error en el pago')
    }
  }

  window.Culqi.open()
}
