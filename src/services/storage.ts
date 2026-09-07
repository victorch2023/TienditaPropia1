import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage'
import { auth, storage } from './firebase'
import { demoError, isDemoMode } from '../config/demo'

const MAX_BYTES = 10 * 1024 * 1024

export const RECEIPT_ACCEPT =
  'application/pdf,image/*,.pdf,.jpg,.jpeg,.png,.webp,.heic,.heif'

function safeFileName(name: string): string {
  const base = name.trim() || 'image.jpg'
  return base.replace(/[^\w.\-()+ ]/g, '_').slice(0, 120)
}

function newId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function extFromFile(file: File): string {
  const match = file.name.match(/\.([a-zA-Z0-9]+)$/)
  if (match) return match[1].toLowerCase()
  if (file.type === 'application/pdf') return 'pdf'
  if (file.type.startsWith('image/')) {
    const subtype = file.type.split('/')[1]?.split('+')[0]
    if (subtype && subtype !== 'jpeg') return subtype
    return 'jpg'
  }
  return 'bin'
}

function isAllowedReceipt(file: File): boolean {
  if (file.type === 'application/pdf' || file.type.startsWith('image/')) {
    return true
  }
  // Algunos móviles no envían MIME; validar por extensión.
  return /\.(pdf|jpe?g|png|webp|heic|heif)$/i.test(file.name)
}

export function mapStorageError(err: unknown): Error {
  const code =
    err && typeof err === 'object' && 'code' in err
      ? String((err as { code: string }).code)
      : ''
  const message =
    err && typeof err === 'object' && 'message' in err
      ? String((err as { message: string }).message)
      : ''

  if (code === 'storage/unauthorized' || code === 'storage/unauthenticated') {
    return new Error(
      'No tienes permiso para subir imágenes. Verifica que estés autenticado como admin de esta tienda y que las reglas de Storage estén desplegadas.'
    )
  }
  if (code === 'storage/canceled') {
    return new Error('Subida cancelada.')
  }
  if (code === 'storage/retry-limit-exceeded') {
    return new Error('La subida falló por problemas de red. Intenta de nuevo.')
  }
  if (
    code === 'storage/unknown' ||
    /storage has not been set up|bucket|not found|404/i.test(message)
  ) {
    return new Error(
      'Firebase Storage no está habilitado o el bucket no existe. En Firebase Console → Storage → Comenzar (plan Blaze), luego despliega las reglas: firebase deploy --only storage'
    )
  }
  if (/exceeds|too large|size/i.test(message)) {
    return new Error('La imagen supera el límite permitido (10 MB).')
  }
  return new Error(
    message || 'No se pudo subir la imagen. Revisa Storage, reglas y conexión.'
  )
}

/**
 * Sube una imagen de producto a Firebase Storage y devuelve la URL de descarga.
 * Path: stores/{storeId}/products/{productId}/… o stores/{storeId}/uploads/{uid}/… si aún no hay productId.
 */
export async function uploadProductImage(
  storeId: string,
  file: File,
  productId?: string,
  onProgress?: (percent: number) => void
): Promise<string> {
  if (isDemoMode()) {
    throw demoError('Subir imágenes')
  }

  if (!file.type.startsWith('image/')) {
    throw new Error('Solo se permiten archivos de imagen (JPG, PNG, WebP, etc.).')
  }
  if (file.size > MAX_BYTES) {
    throw new Error('La imagen supera el límite de 10 MB.')
  }

  const user = auth.currentUser
  if (!user) {
    throw new Error('Debes iniciar sesión para subir imágenes.')
  }
  const uid = user.uid

  // Asegura token fresco para que Storage evalúe request.auth correctamente.
  try {
    await user.getIdToken(/* forceRefresh */ true)
  } catch {
    /* si falla el refresh, el upload usará el token en caché */
  }

  const fileName = `${newId()}-${safeFileName(file.name)}`
  const knownProduct =
    productId && productId !== 'new' ? productId : null
  const path = knownProduct
    ? `stores/${storeId}/products/${knownProduct}/${fileName}`
    : `stores/${storeId}/uploads/${uid}/${fileName}`

  const storageRef = ref(storage, path)
  const task = uploadBytesResumable(storageRef, file, {
    contentType: file.type || 'image/jpeg',
  })

  return new Promise((resolve, reject) => {
    task.on(
      'state_changed',
      (snap) => {
        if (onProgress && snap.totalBytes > 0) {
          onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100))
        }
      },
      (err) => reject(mapStorageError(err)),
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref)
          resolve(url)
        } catch (e) {
          reject(mapStorageError(e))
        }
      }
    )
  })
}

export interface PaymentReceiptUpload {
  url: string
  path: string
  contentType: string
  filename: string
}

/**
 * Sube comprobante de pago (imagen o PDF) para checkout manual.
 * Path: stores/{storeId}/orders/{orderId|temp}/{uid|guest}/receipt-{uuid}.{ext}
 * No requiere sesión (uploader = guest) si el checkout es anónimo.
 */
export async function uploadPaymentReceipt(
  storeId: string,
  file: File,
  options?: {
    orderId?: string
    onProgress?: (percent: number) => void
  }
): Promise<PaymentReceiptUpload> {
  if (isDemoMode()) {
    throw demoError('Subir comprobante')
  }

  if (!isAllowedReceipt(file)) {
    throw new Error(
      'Solo se permiten imágenes (JPG, PNG, WebP, HEIC) o PDF.'
    )
  }
  if (file.size > MAX_BYTES) {
    throw new Error('El comprobante supera el límite de 10 MB.')
  }

  const user = auth.currentUser
  if (user) {
    try {
      await user.getIdToken(/* forceRefresh */ true)
    } catch {
      /* token en caché */
    }
  }

  const uploaderId = user?.uid || 'guest'
  const orderSegment = options?.orderId?.trim() || 'temp'
  const contentType =
    file.type ||
    (/\.pdf$/i.test(file.name) ? 'application/pdf' : 'image/jpeg')
  const filename = `receipt-${newId()}.${extFromFile(file)}`
  const path = `stores/${storeId}/orders/${orderSegment}/${uploaderId}/${filename}`

  const storageRef = ref(storage, path)
  const task = uploadBytesResumable(storageRef, file, { contentType })
  const onProgress = options?.onProgress

  return new Promise((resolve, reject) => {
    task.on(
      'state_changed',
      (snap) => {
        if (onProgress && snap.totalBytes > 0) {
          onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100))
        }
      },
      (err) => {
        const mapped = mapStorageError(err)
        if (
          mapped.message.includes('No tienes permiso para subir imágenes')
        ) {
          reject(
            new Error(
              'No se pudo subir el comprobante. Verifica las reglas de Storage o intenta de nuevo.'
            )
          )
          return
        }
        reject(mapped)
      },
      async () => {
        try {
          const url = await getDownloadURL(task.snapshot.ref)
          resolve({
            url,
            path,
            contentType,
            filename: file.name || filename,
          })
        } catch (e) {
          reject(mapStorageError(e))
        }
      }
    )
  })
}
