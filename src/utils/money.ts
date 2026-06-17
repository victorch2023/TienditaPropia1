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

export function calculateIgv(subtotalCentavos: number, igvRate = 0.18): number {
  return Math.round(subtotalCentavos * igvRate)
}

export function calculateTotal(
  subtotalCentavos: number,
  shippingCentavos: number,
  igvRate = 0.18
): { subtotal: number; igv: number; total: number; shipping: number } {
  const igv = calculateIgv(subtotalCentavos, igvRate)
  const total = subtotalCentavos + igv + shippingCentavos
  return { subtotal: subtotalCentavos, igv, total, shipping: shippingCentavos }
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
