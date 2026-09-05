import type { Category, Product, StoreConfig } from '../../types'
import { DEFAULT_STORE_CONFIG } from '../../types'

export const CITROLEAF_STORE_ID = 'citroleaf'

/**
 * Modo un solo producto: oculta el listado `/catalogo`, redirige al detalle,
 * y duerme la sección "Lo esencial" de la home (redundante con Comprar → producto).
 * Poner `false` para reactivar catálogo + sección "Lo esencial".
 */
export const CITROLEAF_SINGLE_PRODUCT_MODE = true

/** Elige el producto al que apunta Comprar / catálogo en modo single-product. */
export function pickCitroleafSingleProduct(
  products: Product[]
): Product | undefined {
  if (products.length === 0) return undefined
  if (products.length === 1) return products[0]

  const at30 = products.find((p) => p.price === 3000)
  if (at30) return at30

  const named = products.find((p) => /^citroleaf$/i.test(p.name.trim()))
  if (named) return named

  const sprayStar = products.find((p) => p.id === 'citro-prod-spray-hl')
  if (sprayStar) return sprayStar

  return products[0]
}

export const CITROLEAF_META = {
  id: CITROLEAF_STORE_ID,
  slug: CITROLEAF_STORE_ID,
  name: 'Citroleaf',
  tagline: 'Protección natural para tu piel y para tu planeta',
  active: true,
  instagram: 'https://www.instagram.com/citroleaf__/',
} as const

/** Colores de marca + estética cream/brown de la home (referencia Coral) */
export const CITROLEAF_STORE_CONFIG: StoreConfig = {
  ...DEFAULT_STORE_CONFIG,
  name: 'Citroleaf',
  description:
    'Protección natural para tu piel y para tu planeta. Repelentes orgánicos contra zancudos, hechos en Lima.',
  primaryColor: '#261F1A',
  primaryDark: '#1a1612',
  accentColor: '#8B7355',
  heroBannerUrl:
    'https://images.unsplash.com/photo-1466692476862-a44231189ab9?w=1200&h=800&fit=crop',
  backgroundImageUrl: undefined,
  shippingDefault: 1200,
  shippingByDistrito: {
    Miraflores: 1000,
    'San Isidro': 1000,
    Surco: 1200,
    Barranco: 1000,
    'Jesús María': 1100,
  },
  payments: {
    culqiEnabled: false,
    yapeNumber: '900 111 222',
    plinNumber: '900 111 222',
    bankName: 'BCP',
    bankAccount: '191-98765432-0-11',
    bankCCI: '00219100987654321100',
    paymentInstructions:
      'Paga por Yape, Plin o transferencia el monto exacto e indica tu número de pedido. Verificamos en breve.',
  },
  imageHostingNote:
    'Usa URLs públicas (Unsplash, Drive archivo compartido). No pegues el enlace de una carpeta Drive.',
}

export const CITROLEAF_CATEGORIES: Category[] = [
  {
    id: 'citro-cat-spray',
    storeId: CITROLEAF_STORE_ID,
    name: 'Repelentes spray',
    slug: 'repelentes-spray',
    order: 1,
    bannerUrl:
      'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=200&fit=crop',
  },
  {
    id: 'citro-cat-solidos',
    storeId: CITROLEAF_STORE_ID,
    name: 'Repelentes sólidos',
    slug: 'repelentes-solidos',
    order: 2,
  },
  {
    id: 'citro-cat-kits',
    storeId: CITROLEAF_STORE_ID,
    name: 'Kits',
    slug: 'kits',
    order: 3,
  },
  {
    id: 'citro-cat-viaje',
    storeId: CITROLEAF_STORE_ID,
    name: 'Viaje / outdoor',
    slug: 'viaje-outdoor',
    order: 4,
  },
  {
    id: 'citro-cat-hogar',
    storeId: CITROLEAF_STORE_ID,
    name: 'Hogar',
    slug: 'hogar',
    order: 5,
  },
]

export const CITROLEAF_PRODUCTS: Product[] = [
  {
    id: 'citro-prod-spray-hl',
    storeId: CITROLEAF_STORE_ID,
    name: 'CITROLEAF Organic Repellent — Spray Hierba Luisa 50 ml',
    description:
      'Nuestro producto estrella: spray repelente orgánico con aroma a hierba luisa. Protección natural contra zancudos, sin sensaciones químicas agresivas. Ideal para el día a día en Lima.',
    price: 3200,
    stock: 45,
    sku: 'CL-SPRAY-HL-50',
    categoryId: 'citro-cat-spray',
    images: [
      'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&h=600&fit=crop',
    ],
    variants: [],
    active: true,
    createdAt: Date.now() - 86400000 * 6,
  },
  {
    id: 'citro-prod-solido-si',
    storeId: CITROLEAF_STORE_ID,
    name: 'Repelente sólido Sacha Inchi',
    description:
      'Bálsamo sólido con aceite de sacha inchi. Formato limpio y portátil para aplicar en piel; protección natural cuando prefieres no usar spray.',
    price: 2800,
    stock: 40,
    sku: 'CL-SOL-SI',
    categoryId: 'citro-cat-solidos',
    images: [
      'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&h=600&fit=crop',
    ],
    variants: [],
    active: true,
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'citro-prod-mini-travel',
    storeId: CITROLEAF_STORE_ID,
    name: 'Mini Travel Spray Hierba Luisa 20 ml',
    description:
      'Versión compacta del Organic Repellent para mochila, cartera o equipaje de mano. Misma fórmula hierba luisa, tamaño viaje.',
    price: 1890,
    stock: 50,
    sku: 'CL-SPRAY-HL-20',
    categoryId: 'citro-cat-viaje',
    images: [
      'https://images.unsplash.com/photo-1570194065650-d99fb4b38b17?w=600&h=600&fit=crop',
    ],
    variants: [],
    active: true,
    createdAt: Date.now() - 86400000 * 4,
  },
  {
    id: 'citro-prod-pack-duo',
    storeId: CITROLEAF_STORE_ID,
    name: 'Pack Duo Spray + Sólido',
    description:
      'Spray Hierba Luisa 50 ml + repelente sólido Sacha Inchi. La dupla completa: cobertura en casa y aplicación puntual en la calle.',
    price: 5490,
    stock: 25,
    sku: 'CL-KIT-DUO',
    categoryId: 'citro-cat-kits',
    images: [
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&h=600&fit=crop',
    ],
    variants: [],
    active: true,
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'citro-prod-kit-outdoor',
    storeId: CITROLEAF_STORE_ID,
    name: 'Kit Outdoor Anti-zancudo',
    description:
      'Mini Travel 20 ml + sólido Sacha Inchi. Pensado para trekking, playa, camping o fin de semana fuera de Lima.',
    price: 4290,
    stock: 20,
    sku: 'CL-KIT-OUT',
    categoryId: 'citro-cat-viaje',
    images: [
      'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=600&h=600&fit=crop',
    ],
    variants: [],
    active: true,
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'citro-prod-pack-familia',
    storeId: CITROLEAF_STORE_ID,
    name: 'Pack Familia Hogar',
    description:
      'Dos sprays Hierba Luisa 50 ml para la casa. Más cobertura para noches con zancudos en terrazas y jardines limeños.',
    price: 5990,
    stock: 15,
    sku: 'CL-KIT-HOG',
    categoryId: 'citro-cat-hogar',
    images: [
      'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&h=600&fit=crop',
    ],
    variants: [],
    active: true,
    createdAt: Date.now() - 86400000,
  },
  {
    id: 'citro-prod-solido-mini',
    storeId: CITROLEAF_STORE_ID,
    name: 'Sólido mini bolsillo',
    description:
      'Formato mini del bálsamo con sacha inchi. Cabe en cualquier bolsillo; retoque rápido contra zancudos en movimiento.',
    price: 1590,
    stock: 35,
    sku: 'CL-SOL-MINI',
    categoryId: 'citro-cat-solidos',
    images: [
      'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=600&h=600&fit=crop',
    ],
    variants: [],
    active: true,
    createdAt: Date.now() - 43200000,
  },
  {
    id: 'citro-prod-spray-refill',
    storeId: CITROLEAF_STORE_ID,
    name: 'Spray Hierba Luisa refill 100 ml',
    description:
      'Presentación familiar del Organic Repellent. Más producto, mismo aroma hierba luisa y la misma protección orgánica para el hogar.',
    price: 5290,
    stock: 18,
    sku: 'CL-SPRAY-HL-100',
    categoryId: 'citro-cat-hogar',
    images: [
      'https://images.unsplash.com/photo-1602928298859-91bfd707ec89?w=600&h=600&fit=crop',
    ],
    variants: [],
    active: true,
    createdAt: Date.now(),
  },
]
