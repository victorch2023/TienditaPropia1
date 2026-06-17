export type UserRole = 'admin' | 'customer'

export interface AppUser {
  uid: string
  email: string | null
  displayName: string | null
  role: UserRole
  dni?: string
  ruc?: string
}

export interface Category {
  id: string
  name: string
  slug: string
  order: number
  imageUrl?: string
  /** Banner de cabecera en el catálogo al filtrar por esta categoría */
  bannerUrl?: string
}

export interface ProductVariant {
  id: string
  name: string
  stock: number
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  stock: number
  sku?: string
  categoryId: string
  images: string[]
  variants: ProductVariant[]
  active: boolean
  createdAt?: number
}

export type OrderStatus =
  | 'pendiente_pago'
  | 'pagado'
  | 'en_preparacion'
  | 'enviado'
  | 'entregado'
  | 'cancelado'

export type FiscalType = 'boleta' | 'factura'

export type FiscalStatus = 'pendiente' | 'emitido'

export interface OrderItem {
  productId: string
  name: string
  price: number
  quantity: number
  imageUrl?: string
  variantName?: string
}

export interface ShippingAddress {
  distrito: string
  direccion: string
  referencia: string
  telefono: string
  nombre: string
  email: string
}

export interface FiscalData {
  tipo: FiscalType
  documento: string
  nombreCompleto?: string
  razonSocial?: string
  direccionFiscal?: string
  status: FiscalStatus
}

export type ManualPaymentMethod = 'yape' | 'plin' | 'transferencia'

export interface OrderPayment {
  method: 'manual' | 'culqi'
  manualMethod?: ManualPaymentMethod
  paymentReference?: string
  paymentProofUrl?: string
  submittedAt?: number
  culqiChargeId?: string
  paidAt?: number
}

export interface Order {
  id: string
  userId?: string
  items: OrderItem[]
  subtotal: number
  igv: number
  total: number
  shipping: number
  status: OrderStatus
  payment?: OrderPayment
  fiscal: FiscalData
  shippingAddress: ShippingAddress
  createdAt: number
  updatedAt: number
}

export interface StorePaymentsConfig {
  culqiEnabled: boolean
  yapeNumber?: string
  plinNumber?: string
  bankName?: string
  bankAccount?: string
  bankCCI?: string
  paymentInstructions?: string
}

export interface StoreConfig {
  name: string
  logoUrl?: string
  /** Banner principal de la página de inicio (URL de imagen en Drive) */
  heroBannerUrl?: string
  /** Imagen de fondo sutil para toda la tienda */
  backgroundImageUrl?: string
  /** Color principal de la marca (botones, enlaces) — hex */
  primaryColor?: string
  /** Color oscuro para hover — hex */
  primaryDark?: string
  /** Color de acento — hex */
  accentColor?: string
  ruc?: string
  razonSocial?: string
  igvRate: number
  shippingDefault: number
  shippingByDistrito: Record<string, number>
  payments: StorePaymentsConfig
  description?: string
  /** Nota interna para el admin sobre hospedaje de imágenes (p. ej. carpeta Drive) */
  imageHostingNote?: string
}

export const DEFAULT_PAYMENTS_CONFIG: StorePaymentsConfig = {
  culqiEnabled: false,
  yapeNumber: '',
  plinNumber: '',
  bankName: '',
  bankAccount: '',
  bankCCI: '',
  paymentInstructions:
    'Realiza el pago y envía tu comprobante. Verificaremos tu pedido en breve.',
}

export const DEFAULT_STORE_CONFIG: StoreConfig = {
  name: 'Mi Tiendita',
  igvRate: 0.18,
  shippingDefault: 1000,
  shippingByDistrito: {},
  payments: DEFAULT_PAYMENTS_CONFIG,
  description: 'Tu tienda virtual en Lima Metropolitana',
}

export interface CartItem {
  productId: string
  name: string
  price: number
  quantity: number
  imageUrl?: string
  variantName?: string
  maxStock: number
}
