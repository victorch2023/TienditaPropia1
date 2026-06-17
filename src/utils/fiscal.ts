export function validateDNI(dni: string): boolean {
  return /^\d{8}$/.test(dni)
}

export function validateRUC(ruc: string): boolean {
  if (!/^\d{11}$/.test(ruc)) return false

  const prefix = ruc.substring(0, 2)
  if (!['10', '15', '16', '17', '20'].includes(prefix)) return false

  const factors = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
  const digits = ruc.split('').map(Number)
  let sum = 0
  for (let i = 0; i < 10; i++) {
    sum += digits[i] * factors[i]
  }
  const remainder = sum % 11
  const check = remainder < 2 ? remainder : 11 - remainder
  return check === digits[10]
}
