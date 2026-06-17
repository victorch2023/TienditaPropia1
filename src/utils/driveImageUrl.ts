/**
 * Convierte enlaces compartidos de Google Drive a URL directa para <img>.
 * Otras URLs (imgbb, Cloudinary, picsum, etc.) se devuelven sin cambios.
 */

/** Enlace de carpeta de Drive (no sirve como imagen). */
export function isGoogleDriveFolderUrl(url: string): boolean {
  return /drive\.google\.com\/(?:drive\/)?folders\//i.test(url?.trim() ?? '')
}

/** Extrae el ID de archivo de distintos formatos de enlace de Drive. */
export function extractGoogleDriveFileId(url: string): string | null {
  if (!url?.trim()) return null

  const trimmed = url.trim()
  if (isGoogleDriveFolderUrl(trimmed)) return null

  if (trimmed.includes('drive.google.com/uc?')) {
    const m = trimmed.match(/[?&]id=([^&]+)/)
    return m?.[1] ?? null
  }

  const fileMatch = trimmed.match(/drive\.google\.com\/file\/d\/([^/]+)/)
  if (fileMatch) return fileMatch[1]

  const openMatch = trimmed.match(/drive\.google\.com\/open\?id=([^&]+)/)
  if (openMatch) return openMatch[1]

  const idMatch = trimmed.match(/[?&]id=([^&]+)/)
  if (trimmed.includes('drive.google.com') && idMatch) return idMatch[1]

  return null
}

/** URLs a probar en orden (view → thumbnail → download). */
export function getDriveImageUrlCandidates(url: string): string[] {
  const trimmed = url?.trim()
  if (!trimmed) return []

  if (isGoogleDriveFolderUrl(trimmed)) return []

  const fileId = extractGoogleDriveFileId(trimmed)
  if (!fileId) {
    if (!trimmed.includes('drive.google.com')) return [trimmed]
    return [trimmed]
  }

  return [
    `https://drive.google.com/uc?export=view&id=${fileId}`,
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`,
    `https://drive.google.com/uc?export=download&id=${fileId}`,
  ]
}

export function toDirectImageUrl(url: string): string {
  const candidates = getDriveImageUrlCandidates(url)
  return candidates[0] ?? url?.trim() ?? url
}
