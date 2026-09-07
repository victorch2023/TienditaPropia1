const PEN_FORMATTER = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
})

export function formatSoles(centavos: number): string {
  return PEN_FORMATTER.format(centavos / 100)
}

export function solesToCentavos(soles: number): number {
  return Math.round(soles * 100)
}

export function centavosToSoles(centavos: number): number {
  return centavos / 100
}

/**
 * Desglose informativo: el precio anunciado ya incluye IGV.
 * base = totalConIgv / (1 + rate); igv = totalConIgv - base.
 */
export function extractIgvFromInclusive(
  totalConIgvCentavos: number,
  igvRate = 0.18
): { base: number; igv: number } {
  const divisor = 1 + igvRate
  const base = Math.round(totalConIgvCentavos / divisor)
  const igv = totalConIgvCentavos - base
  return { base, igv }
}

/** IGV contenido en un monto con IVA incluido (no es un cargo extra). */
export function calculateIgv(inclusiveCentavos: number, igvRate = 0.18): number {
  return extractIgvFromInclusive(inclusiveCentavos, igvRate).igv
}

/**
 * Totales de checkout/carrito.
 * `subtotalCentavos` = suma de precios anunciados (IGV ya incluido).
 * El total a pagar = subtotal + envío (sin sumar IGV otra vez).
 * `igv` es solo desglose informativo extraído del subtotal.
 */
export function calculateTotal(
  subtotalCentavos: number,
  shippingCentavos: number,
  igvRate = 0.18
): { subtotal: number; igv: number; total: number; shipping: number; base: number } {
  const { base, igv } = extractIgvFromInclusive(subtotalCentavos, igvRate)
  const total = subtotalCentavos + shippingCentavos
  return {
    subtotal: subtotalCentavos,
    igv,
    total,
    shipping: shippingCentavos,
    base,
  }
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
