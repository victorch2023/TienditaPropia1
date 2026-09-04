/**
 * Semilla Citroleaf + migración multi-tienda.
 *
 * Requisitos: GOOGLE_APPLICATION_CREDENTIALS + VITE_FIREBASE_PROJECT_ID
 *
 * Uso:
 *   npm run seed:citroleaf
 *
 * Acciones:
 * 1. Copia stores/config → stores/tiendita (merge) y marca storeId en productos/categorías/pedidos legacy
 * 2. Escribe stores/citroleaf + categorías/productos Citroleaf
 * 3. Añade adminStores: ['tiendita','citroleaf'] a todos los users con role=admin
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import admin from 'firebase-admin'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

function loadEnv() {
  try {
    const text = readFileSync(join(root, '.env'), 'utf8')
    for (const line of text.split('\n')) {
      const m = line.match(/^([^#=]+)=(.*)$/)
      if (m) process.env[m[1].trim()] = m[2].trim()
    }
  } catch {
    // sin .env
  }
}

loadEnv()

const projectId =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.VITE_FIREBASE_PROJECT_ID ||
  process.env.GCLOUD_PROJECT

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error(
    'Error: define GOOGLE_APPLICATION_CREDENTIALS con la ruta a tu serviceAccountKey.json'
  )
  process.exit(1)
}

if (!projectId || projectId === 'tu-proyecto') {
  console.error('Error: define VITE_FIREBASE_PROJECT_ID en .env o FIREBASE_PROJECT_ID')
  process.exit(1)
}

admin.initializeApp({ projectId })
const db = admin.firestore()

const seed = JSON.parse(
  readFileSync(join(__dirname, 'seed-citroleaf-data.json'), 'utf8')
)
const now = Date.now()
const DEFAULT_STORE = 'tiendita'

async function migrateLegacyToTiendita() {
  const legacy = await db.doc('stores/config').get()
  if (legacy.exists) {
    const data = legacy.data()
    await db.doc(`stores/${DEFAULT_STORE}`).set(
      {
        ...data,
        slug: DEFAULT_STORE,
        active: true,
        name: data.name || 'La Tiendita Chévere',
        updatedAt: now,
      },
      { merge: true }
    )
    console.log('✓ stores/tiendita (desde stores/config)')
  }

  for (const col of ['products', 'categories', 'orders']) {
    const snap = await db.collection(col).get()
    let n = 0
    const batchSize = 400
    let batch = db.batch()
    let ops = 0
    for (const doc of snap.docs) {
      if (doc.data().storeId) continue
      batch.update(doc.ref, { storeId: DEFAULT_STORE })
      n++
      ops++
      if (ops >= batchSize) {
        await batch.commit()
        batch = db.batch()
        ops = 0
      }
    }
    if (ops > 0) await batch.commit()
    console.log(`✓ ${col}: ${n} docs → storeId=${DEFAULT_STORE}`)
  }
}

async function seedCitroleaf() {
  const { storeConfig, categories, products } = seed

  await db.doc('stores/citroleaf').set(
    {
      ...storeConfig,
      slug: 'citroleaf',
      active: true,
      updatedAt: now,
    },
    { merge: true }
  )
  console.log('✓ stores/citroleaf')

  for (const cat of categories) {
    await db.doc(`categories/${cat.id}`).set({ ...cat, storeId: 'citroleaf', createdAt: now })
    console.log(`✓ categories/${cat.id}`)
  }

  for (const prod of products) {
    await db
      .doc(`products/${prod.id}`)
      .set({ ...prod, storeId: 'citroleaf', createdAt: now })
    console.log(`✓ products/${prod.id}`)
  }
}

async function patchAdmins() {
  const snap = await db.collection('users').where('role', '==', 'admin').get()
  for (const doc of snap.docs) {
    const data = doc.data()
    const current = Array.isArray(data.adminStores) ? data.adminStores : []
    const next = Array.from(new Set([...current, 'tiendita', 'citroleaf']))
    await doc.ref.set({ adminStores: next }, { merge: true })
    console.log(`✓ users/${doc.id} adminStores=${JSON.stringify(next)}`)
  }
  if (snap.empty) {
    console.log(
      'ℹ No hay admins aún. Tras crear uno, pon role=admin y adminStores=["tiendita","citroleaf"].'
    )
  }
}

async function main() {
  console.log(`Sembrando multi-tienda en proyecto: ${projectId}`)
  await migrateLegacyToTiendita()
  await seedCitroleaf()
  await patchAdmins()
  console.log('\nListo. URLs: /s/tiendita y /s/citroleaf')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
