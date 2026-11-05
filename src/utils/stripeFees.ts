import type { CardFeePolicy, StorePaymentsConfig } from '../types'
import { DEFAULT_PAYMENTS_CONFIG } from '../types'

export interface StripeFeeEstimate {
  /** Subtotal + envío (sin comisión de tarjeta). */
  baseTotalCents: number
  /** Comisión estimada Stripe + plataforma (céntimos). */
  estimatedFeeCents: number
  /** Total a cobrar al cliente. */
  chargeTotalCents: number
  policy: CardFeePolicy
  feePercent: number
  feeFixedCents: number
  platformFeePercent: number
}

/**
 * Estima la comisión de tarjeta para mostrar en checkout.
 * Valores configurables en Admin; Stripe confirma el cargo final.
 */
export function estimateStripeCardFee(
  baseTotalCents: number,
  payments: Pick<
    StorePaymentsConfig,
    | 'cardFeePolicy'
    | 'stripeFeePercent'
    | 'stripeFeeFixedCents'
    | 'platformFeePercent'
  >
): StripeFeeEstimate {
  const policy: CardFeePolicy =
    payments.cardFeePolicy ?? DEFAULT_PAYMENTS_CONFIG.cardFeePolicy ?? 'absorb'
  const feePercent =
    payments.stripeFeePercent ?? DEFAULT_PAYMENTS_CONFIG.stripeFeePercent ?? 3.99
  const feeFixedCents =
    payments.stripeFeeFixedCents ??
    DEFAULT_PAYMENTS_CONFIG.stripeFeeFixedCents ??
    100
  const platformFeePercent =
    payments.platformFeePercent ??
    DEFAULT_PAYMENTS_CONFIG.platformFeePercent ??
    0

  const stripePart = Math.round((baseTotalCents * feePercent) / 100) + feeFixedCents
  const platformPart = Math.round((baseTotalCents * platformFeePercent) / 100)
  const estimatedFeeCents = Math.max(0, stripePart + platformPart)

  const chargeTotalCents =
    policy === 'pass_to_customer'
      ? baseTotalCents + estimatedFeeCents
      : baseTotalCents

  return {
    baseTotalCents,
    estimatedFeeCents,
    chargeTotalCents,
    policy,
    feePercent,
    feeFixedCents,
    platformFeePercent,
  }
}

/** True si la tienda debe mostrar Tarjeta (Stripe) en checkout. */
export function isStripeCheckoutAvailable(
  payments: StorePaymentsConfig,
  opts?: { requireAccountId?: boolean; demoAllowWithoutAccount?: boolean }
): boolean {
  if (!payments.stripeEnabled) return false
  const requireAccount = opts?.requireAccountId ?? false
  const demoOk = opts?.demoAllowWithoutAccount ?? true
  if (!requireAccount && demoOk) return true
  return Boolean(payments.stripeAccountId?.trim())
}
