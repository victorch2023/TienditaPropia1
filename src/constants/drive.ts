/**
 * Legado: helpers de carpeta Google Drive para imágenes.
 * El flujo actual es Firebase Storage (admin → subir) + URL en Firestore.
 * Se conserva por si quedan notas antiguas con enlaces Drive; la UI de config ya no lo usa.
 */
export const DEFAULT_DRIVE_IMAGES_FOLDER_URL =
  'https://drive.google.com/drive/folders/1D3Vir25MPJVJTKe3Zq6vtBblN22x6tgh?usp=sharing'

const DRIVE_FOLDER_URL_RE = /https:\/\/drive\.google\.com\/drive\/folders\/[^\s)]+/i

/** Extrae URL de carpeta Drive de un texto (p. ej. imageHostingNote legacy); si no hay, usa el default. */
export function resolveDriveImagesFolderUrl(note?: string | null): string {
  const match = note?.match(DRIVE_FOLDER_URL_RE)
  return match?.[0] ?? DEFAULT_DRIVE_IMAGES_FOLDER_URL
}
