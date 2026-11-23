import { FUNCTIONS_URL, CULQI_PUBLIC_KEY } from './firebase'
import { demoError, isDemoMode } from '../config/demo'

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

/** True si hay una llave pública de prueba/producción real (no placeholder). */
export function isCulqiPublicKeyConfigured(key: string = CULQI_PUBLIC_KEY): boolean {
  const k = (key || '').trim()
  if (!k) return false
  if (k === 'pk_test_placeholder') return false
  if (/x{4,}/i.test(k) || /tu[_-]?llave/i.test(k) || /xxxxxxxx/i.test(k)) return false
  return /^pk_(test|live)_[A-Za-z0-9]+$/.test(k)
}

/** True si el script Checkout.js cargó `window.Culqi`. */
export function isCulqiCheckoutLoaded(): boolean {
  return typeof window !== 'undefined' && typeof window.Culqi?.open === 'function'
}

export function getCulqiSetupError(publicKey: string = CULQI_PUBLIC_KEY): string | null {
  if (!isCulqiPublicKeyConfigured(publicKey)) {
    return 'Falta VITE_CULQI_PUBLIC_KEY (pk_test_…). Pégala en .env / .env.local y reinicia Vite. Ver docs/CULQI_SANDBOX.md.'
  }
  if (!isCulqiCheckoutLoaded()) {
    return 'No se cargó Culqi Checkout.js. Recarga la página o revisa que index.html incluya https://js.culqi.com/checkout-js'
  }
  if (!FUNCTIONS_URL || FUNCTIONS_URL.includes('tu-proyecto') || FUNCTIONS_URL.includes('demo-project')) {
    return 'Falta VITE_FUNCTIONS_URL (URL de Cloud Functions). Ver docs/CULQI_SANDBOX.md.'
  }
  return null
}

export async function chargeWithCulqi(
  request: CulqiChargeRequest
): Promise<CulqiChargeResponse> {
  if (isDemoMode()) throw demoError('Procesar pagos con Culqi')

  const setupError = getCulqiSetupError()
  if (setupError) {
    throw new Error(setupError)
  }

  // Culqi API exige amount entero en céntimos
  const amount = Math.round(request.amount)
  if (!Number.isFinite(amount) || amount < 100) {
    throw new Error('Monto inválido para Culqi (mínimo S/ 1.00 = 100 céntimos)')
  }

  const res = await fetch(`${FUNCTIONS_URL}/culqiCharge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...request, amount }),
  })

  let data: CulqiChargeResponse
  try {
    data = (await res.json()) as CulqiChargeResponse
  } catch {
    throw new Error(
      res.status === 404
        ? 'La function culqiCharge no está desplegada. Ejecuta: firebase deploy --only functions:culqiCharge'
        : `Error HTTP ${res.status} al llamar a culqiCharge`
    )
  }

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
  onError: (message: string) => void,
  title = 'Mi Tiendita'
): void {
  const setupError = getCulqiSetupError(publicKey)
  if (setupError) {
    onError(setupError)
    return
  }

  const amount = Math.round(amountCentavos)
  if (!Number.isFinite(amount) || amount < 100) {
    onError('Monto inválido para Culqi (mínimo S/ 1.00)')
    return
  }

  window.Culqi.publicKey = publicKey
  window.Culqi.settings({
    title: title.slice(0, 50),
    currency: 'PEN',
    amount,
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
