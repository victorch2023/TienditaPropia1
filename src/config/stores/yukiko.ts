import type { Category, Product, StoreConfig } from '../../types'
import { DEFAULT_STORE_CONFIG } from '../../types'

export const YUKIKO_STORE_ID = 'yukiko'

export const YUKIKO_META = {
  id: YUKIKO_STORE_ID,
  slug: YUKIKO_STORE_ID,
  name: 'Tiendita de Yukiko',
  tagline: 'Tu tienda virtual en Lima Metropolitana',
  active: true,
} as const

/** Defaults de demo / fallback si falta el doc Firestore. El name es editable en Admin → Config. */
export const YUKIKO_STORE_CONFIG: StoreConfig = {
  ...DEFAULT_STORE_CONFIG,
  name: 'Tiendita de Yukiko',
  description: 'Compra en línea con envío en Lima Metropolitana',
  primaryColor: '#db2777',
  primaryDark: '#be185d',
  accentColor: '#f9a8d4',
  heroBannerUrl: 'https://picsum.photos/seed/yukiko-hero/1200/400',
  shippingDefault: 1200,
  shippingByDistrito: {
    Miraflores: 1000,
    'San Isidro': 1000,
    Surco: 1500,
  },
  payments: {
    culqiEnabled: false,
    yapeNumber: '',
    plinNumber: '',
    bankName: '',
    bankAccount: '',
    bankCCI: '',
    paymentInstructions:
      'Realiza el pago por Yape o Plin el monto exacto e indica tu número de pedido en el mensaje.',
  },
  imageHostingNote:
    'Usa URLs públicas o sube imágenes desde Admin → Productos (Firebase Storage).',
}

export const YUKIKO_CATEGORIES: Category[] = []

export const YUKIKO_PRODUCTS: Product[] = []
