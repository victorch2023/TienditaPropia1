import type { Category, Product, StoreConfig } from '../types'
import { DEFAULT_STORE_CONFIG } from '../types'

const PLACEHOLDER_API_KEYS = new Set([
  '',
  'tu_api_key',
  'demo-api-key',
  'your_api_key',
])

/** Activo con VITE_DEMO_MODE=true o sin Firebase configurado en .env */
export function isDemoMode(): boolean {
  const forced = import.meta.env.VITE_DEMO_MODE
  if (forced === 'true') return true
  if (forced === 'false') return false

  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY?.trim()
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim()
  if (!apiKey || PLACEHOLDER_API_KEYS.has(apiKey)) return true
  if (!projectId || projectId === 'tu-proyecto' || projectId === 'demo-project') return true
  return false
}

export const DEMO_STORE_CONFIG: StoreConfig = {
  ...DEFAULT_STORE_CONFIG,
  name: 'Mi Tiendita (demo)',
  description: 'Vista previa local — configura Firebase en .env para datos reales',
  primaryColor: '#7c3aed',
  primaryDark: '#6d28d9',
  accentColor: '#a78bfa',
  heroBannerUrl: 'https://picsum.photos/seed/tiendita-hero/1200/400',
  shippingDefault: 1200,
  shippingByDistrito: {
    Miraflores: 1000,
    'San Isidro': 1000,
    Surco: 1500,
  },
  payments: {
    culqiEnabled: false,
    yapeNumber: '999 888 777',
    plinNumber: '999 888 777',
    bankName: 'BCP',
    bankAccount: '191-12345678-0-12',
    bankCCI: '00219100123456781234',
    paymentInstructions:
      'Realiza el pago por el monto exacto e indica tu número de pedido en el mensaje.',
  },
  imageHostingNote:
    'Carpeta compartida «Shared Tiendita Images»: https://drive.google.com/drive/folders/1D3Vir25MPJVJTKe3Zq6vtBblN22x6tgh?usp=sharing — No uses el enlace de la carpeta en productos; pega el enlace de cada archivo (botón Drive → directo en admin).',
}

export const DEMO_CATEGORIES: Category[] = [
  {
    id: 'demo-cat-1',
    name: 'Electrónica',
    slug: 'electronica',
    order: 1,
    bannerUrl: 'https://picsum.photos/seed/tiendita-cat-electronica/800/200',
  },
  { id: 'demo-cat-2', name: 'Hogar', slug: 'hogar', order: 2 },
  { id: 'demo-cat-3', name: 'Moda', slug: 'moda', order: 3 },
]

export const DEMO_PRODUCTS: Product[] = [
  {
    id: 'demo-prod-1',
    name: 'Audífonos Bluetooth Pro',
    description: 'Sonido envolvente, cancelación de ruido y 30 h de batería.',
    price: 8990,
    stock: 25,
    sku: 'AUD-001',
    categoryId: 'demo-cat-1',
    images: ['https://picsum.photos/seed/tiendita-audifonos/600/600'],
    variants: [],
    active: true,
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'demo-prod-2',
    name: 'Cargador rápido USB-C',
    description: '65 W, compatible con laptops y celulares.',
    price: 4590,
    stock: 40,
    sku: 'CHG-002',
    categoryId: 'demo-cat-1',
    images: ['https://picsum.photos/seed/tiendita-cargador/600/600'],
    variants: [],
    active: true,
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'demo-prod-3',
    name: 'Set de tazas cerámica',
    description: 'Pack x4, apto para microondas y lavavajillas.',
    price: 3290,
    stock: 18,
    sku: 'HOG-003',
    categoryId: 'demo-cat-2',
    images: ['https://picsum.photos/seed/tiendita-tazas/600/600'],
    variants: [],
    active: true,
    createdAt: Date.now() - 86400000,
  },
  {
    id: 'demo-prod-4',
    name: 'Lámpara de escritorio LED',
    description: 'Luz cálida regulable, base antideslizante.',
    price: 5490,
    stock: 12,
    sku: 'HOG-004',
    categoryId: 'demo-cat-2',
    images: ['https://picsum.photos/seed/tiendita-lampara/600/600'],
    variants: [],
    active: true,
    createdAt: Date.now(),
  },
  {
    id: 'demo-prod-5',
    name: 'Polo algodón premium',
    description: 'Tallas S–XL, colores surtidos.',
    price: 3990,
    stock: 30,
    sku: 'MOD-005',
    categoryId: 'demo-cat-3',
    images: ['https://picsum.photos/seed/tiendita-polo/600/600'],
    variants: [
      { id: 'v-s', name: 'S', stock: 10 },
      { id: 'v-m', name: 'M', stock: 12 },
      { id: 'v-l', name: 'L', stock: 8 },
    ],
    active: true,
    createdAt: Date.now(),
  },
  {
    id: 'demo-prod-6',
    name: 'Mochila urbana impermeable',
    description: 'Compartimento para laptop 15", resistente al agua.',
    price: 12990,
    stock: 8,
    sku: 'MOD-006',
    categoryId: 'demo-cat-3',
    images: ['https://picsum.photos/seed/tiendita-mochila/600/600'],
    variants: [],
    active: true,
    createdAt: Date.now(),
  },
]

export function demoError(action = 'Esta acción'): Error {
  return new Error(`${action} no está disponible en modo demo. Configura Firebase en .env`)
}
