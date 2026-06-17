/**
 * Convierte enlaces compartidos de Google Drive a URL directa para <img>.
 * Otras URLs (imgbb, Cloudinary, picsum, etc.) se devuelven sin cambios.
 */
export function toDirectImageUrl(url: string): string {
  if (!url?.trim()) return url

  const trimmed = url.trim()

  if (trimmed.includes('drive.google.com/uc?')) return trimmed

  const fileMatch = trimmed.match(/drive\.google\.com\/file\/d\/([^/]+)/)
  if (fileMatch) {
    return `https://drive.google.com/uc?export=view&id=${fileMatch[1]}`
  }

  const openMatch = trimmed.match(/drive\.google\.com\/open\?id=([^&]+)/)
  if (openMatch) {
    return `https://drive.google.com/uc?export=view&id=${openMatch[1]}`
  }

  const idMatch = trimmed.match(/[?&]id=([^&]+)/)
  if (trimmed.includes('drive.google.com') && idMatch) {
    return `https://drive.google.com/uc?export=view&id=${idMatch[1]}`
  }

  return trimmed
}
