export type UserRole = 'admin' | 'customer'

export interface AppUser {
  uid: string
  email: string | null
  displayName: string | null
  role: UserRole
  /** Tiendas que puede administrar; si falta, admin global solo sobre la tienda default */
  adminStores?: string[]
  dni?: string
  ruc?: string
}

/** Metadatos públicos de una tienda (selector / registro) */
export interface StoreMeta {
  id: string
  slug: string
  name: string
  tagline?: string
  active: boolean
  instagram?: string
  logoUrl?: string
}

export interface Category {
  id: string
  storeId?: string
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
  storeId?: string
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

export type StripeMode = 'test' | 'live'

/** Quién asume la comisión estimada de tarjeta (Stripe). */
export type CardFeePolicy = 'absorb' | 'pass_to_customer'

export interface OrderPayment {
  method: 'manual' | 'culqi' | 'stripe'
  manualMethod?: ManualPaymentMethod
  paymentReference?: string
  /** Download URL del comprobante (Storage o URL legacy Drive). */
  paymentProofUrl?: string
  paymentProofPath?: string
  paymentProofContentType?: string
  paymentProofFilename?: string
  submittedAt?: number
  culqiChargeId?: string
  /** PaymentIntent / Charge id de Stripe (fase de integración). */
  stripePaymentIntentId?: string
  /** Comisión estimada cobrada al cliente (céntimos), si pass_to_customer. */
  stripeFeeCents?: number
  paidAt?: number
}

export interface Order {
  id: string
  storeId?: string
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
  /** Activar método Tarjeta (Stripe) en checkout. Default false. */
  stripeEnabled?: boolean
  /** Cuenta Connect del comercio (acct_…). No guardar secret keys aquí. */
  stripeAccountId?: string
  /** Modo Stripe. Default 'test'. Live solo cuando se active explícitamente. */
  stripeMode?: StripeMode
  /** Quién asume la comisión estimada de tarjeta. */
  cardFeePolicy?: CardFeePolicy
  /**
   * % estimado de comisión Stripe (ej. 3.99). Solo informativo en UI;
   * el cargo final lo confirma Stripe.
   */
  stripeFeePercent?: number
  /** Cargo fijo estimado en céntimos (ej. 100 = S/ 1.00). */
  stripeFeeFixedCents?: number
  /** Comisión de plataforma opcional (%). Default 0. */
  platformFeePercent?: number
}

export interface StoreConfig {
  name: string
  /** Slug de la tienda (igual al doc id en stores/{storeId}) */
  slug?: string
  /** Si la tienda aparece en el selector */
  active?: boolean
  logoUrl?: string
  /** Banner principal de la página de inicio (URL de imagen; preferible Firebase Storage) */
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
  /** Nota interna admin: subir a Firebase Storage; URL en Firestore (no Drive) */
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
  stripeEnabled: false,
  stripeMode: 'test',
  cardFeePolicy: 'absorb',
  /** Estimado típico Perú/LatAm — editable en Admin; no es el cargo real de Stripe. */
  stripeFeePercent: 3.99,
  stripeFeeFixedCents: 100,
  platformFeePercent: 0,
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
