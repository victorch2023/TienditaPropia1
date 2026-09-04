import type { Category, Product, StoreConfig } from '../../types'
import { DEFAULT_STORE_CONFIG } from '../../types'

export const CITROLEAF_STORE_ID = 'citroleaf'

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
    'Protección natural para tu piel y para tu planeta. Repelentes orgánicos con aroma a hierba luisa, pensados en Lima.',
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
    id: 'citro-cat-repelentes',
    storeId: CITROLEAF_STORE_ID,
    name: 'Repelentes',
    slug: 'repelentes',
    order: 1,
    bannerUrl:
      'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=200&fit=crop',
  },
  {
    id: 'citro-cat-aceites',
    storeId: CITROLEAF_STORE_ID,
    name: 'Aceites',
    slug: 'aceites',
    order: 2,
  },
  {
    id: 'citro-cat-velas',
    storeId: CITROLEAF_STORE_ID,
    name: 'Velas',
    slug: 'velas',
    order: 3,
  },
  {
    id: 'citro-cat-kits',
    storeId: CITROLEAF_STORE_ID,
    name: 'Kits',
    slug: 'kits',
    order: 4,
  },
  {
    id: 'citro-cat-accesorios',
    storeId: CITROLEAF_STORE_ID,
    name: 'Accesorios',
    slug: 'accesorios',
    order: 5,
  },
]

export const CITROLEAF_PRODUCTS: Product[] = [
  {
    id: 'citro-prod-repelente-hl',
    storeId: CITROLEAF_STORE_ID,
    name: 'Repelente Orgánico Hierba Luisa 50 ml',
    description:
      'Spray repelente de origen natural con aroma fresco a hierba luisa. Protección para tu piel sin sensaciones químicas agresivas. Ideal para casa, jardín y salidas en Lima.',
    price: 3990,
    stock: 40,
    sku: 'CL-REP-HL-50',
    categoryId: 'citro-cat-repelentes',
    images: [
      'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&h=600&fit=crop',
    ],
    variants: [],
    active: true,
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'citro-prod-repelente-citro',
    storeId: CITROLEAF_STORE_ID,
    name: 'Repelente Orgánico Citronela 50 ml',
    description:
      'Fórmula vegetal a base de citronela. Aroma cítrico-herbal que ayuda a mantener a raya a los zancudos de forma más amigable con el ambiente.',
    price: 3990,
    stock: 35,
    sku: 'CL-REP-CT-50',
    categoryId: 'citro-cat-repelentes',
    images: [
      'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=600&h=600&fit=crop',
    ],
    variants: [],
    active: true,
    createdAt: Date.now() - 86400000 * 4,
  },
  {
    id: 'citro-prod-aceite-hl',
    storeId: CITROLEAF_STORE_ID,
    name: 'Aceite esencial Hierba Luisa 10 ml',
    description:
      'Aceite aromático para difusor o dilución. Complementa tu rutina de bienestar y refuerza el ambiente con notas verdes y limón.',
    price: 2890,
    stock: 28,
    sku: 'CL-AE-HL-10',
    categoryId: 'citro-cat-aceites',
    images: [
      'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=600&h=600&fit=crop',
    ],
    variants: [],
    active: true,
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'citro-prod-vela-jardin',
    storeId: CITROLEAF_STORE_ID,
    name: 'Vela aromática Jardín Verde',
    description:
      'Vela de cera vegetal con notas de hierbas frescas. Ideal para terrazas y noches de verano en Lima.',
    price: 4590,
    stock: 20,
    sku: 'CL-VEL-JG',
    categoryId: 'citro-cat-velas',
    images: [
      'https://images.unsplash.com/photo-1603006905004-2c652e247db9?w=600&h=600&fit=crop',
    ],
    variants: [],
    active: true,
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'citro-prod-kit-viaje',
    storeId: CITROLEAF_STORE_ID,
    name: 'Kit Viajero Anti-zancudo',
    description:
      'Incluye repelente Hierba Luisa 50 ml + roll-on de bolsillo. Pensado para mochila, playa o fin de semana.',
    price: 6990,
    stock: 15,
    sku: 'CL-KIT-VIAJE',
    categoryId: 'citro-cat-kits',
    images: [
      'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&h=600&fit=crop',
    ],
    variants: [],
    active: true,
    createdAt: Date.now() - 86400000,
  },
  {
    id: 'citro-prod-kit-hogar',
    storeId: CITROLEAF_STORE_ID,
    name: 'Kit Hogar Protegido',
    description:
      'Pack familiar: 2 sprays repelentes (Hierba Luisa + Citronela) y 1 vela aromática. Ahorro frente a comprar por separado.',
    price: 10990,
    stock: 12,
    sku: 'CL-KIT-HOGAR',
    categoryId: 'citro-cat-kits',
    images: [
      'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=600&h=600&fit=crop',
    ],
    variants: [],
    active: true,
    createdAt: Date.now() - 43200000,
  },
  {
    id: 'citro-prod-rollon',
    storeId: CITROLEAF_STORE_ID,
    name: 'Roll-on bolsillo Hierba Luisa',
    description:
      'Aplicación puntual en muñecas y tobillos. Formato mini para llevar en la cartera o la mochila.',
    price: 2490,
    stock: 50,
    sku: 'CL-ACC-ROLL',
    categoryId: 'citro-cat-accesorios',
    images: [
      'https://images.unsplash.com/photo-1570194065650-d99fb4b38b17?w=600&h=600&fit=crop',
    ],
    variants: [],
    active: true,
    createdAt: Date.now(),
  },
  {
    id: 'citro-prod-difusor',
    storeId: CITROLEAF_STORE_ID,
    name: 'Difusor de ambiente Leaf',
    description:
      'Difusor de varillas con esencia herbal. Refresca ambientes cerrados y acompaña tu ritual anti-zancudo en casa.',
    price: 5490,
    stock: 18,
    sku: 'CL-ACC-DIF',
    categoryId: 'citro-cat-accesorios',
    images: [
      'https://images.unsplash.com/photo-1602928298859-91bfd707ec89?w=600&h=600&fit=crop',
    ],
    variants: [],
    active: true,
    createdAt: Date.now(),
  },
]
