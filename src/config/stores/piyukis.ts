import type { Category, Product, StoreConfig } from '../../types'
import { DEFAULT_STORE_CONFIG } from '../../types'

export const PIYUKIS_STORE_ID = 'piyukis'

export const PIYUKIS_META = {
  id: PIYUKIS_STORE_ID,
  slug: PIYUKIS_STORE_ID,
  name: 'Piyukis',
  tagline: 'Tu tienda virtual en Lima Metropolitana',
  active: true,
} as const

/** Defaults de demo / fallback si falta el doc Firestore. El name es editable en Admin → Config. */
export const PIYUKIS_STORE_CONFIG: StoreConfig = {
  ...DEFAULT_STORE_CONFIG,
  name: 'Piyukis',
  description: 'Compra en línea con envío en Lima Metropolitana',
  primaryColor: '#db2777',
  primaryDark: '#be185d',
  accentColor: '#f9a8d4',
  heroBannerUrl: 'https://picsum.photos/seed/piyukis-hero/1200/400',
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

export const PIYUKIS_CATEGORIES: Category[] = []

export const PIYUKIS_PRODUCTS: Product[] = []
