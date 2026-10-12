/**
 * Semilla Tiendita de Yukiko (stores/yukiko).
 *
 * Requisitos: GOOGLE_APPLICATION_CREDENTIALS + VITE_FIREBASE_PROJECT_ID
 *
 * Uso:
 *   npm run seed:yukiko
 *
 * Acciones:
 * 1. Escribe/merge stores/yukiko (config editable luego en Admin)
 * 2. No toca admins existentes (añade yukiko solo si pasas --patch-admins)
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import admin from 'firebase-admin'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const STORE_ID = 'yukiko'
const patchAdmins = process.argv.includes('--patch-admins')

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
  console.error(
    '\nSin service account, crea en Firestore Console el documento stores/yukiko con el JSON de scripts/seed-yukiko-data.json → storeConfig (+ slug, active).'
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
  readFileSync(join(__dirname, 'seed-yukiko-data.json'), 'utf8')
)
const now = Date.now()

async function seedYukiko() {
  const { storeConfig, categories, products } = seed

  await db.doc(`stores/${STORE_ID}`).set(
    {
      ...storeConfig,
      slug: STORE_ID,
      active: true,
      updatedAt: now,
    },
    { merge: true }
  )
  console.log(`✓ stores/${STORE_ID}`)

  for (const cat of categories) {
    await db
      .doc(`categories/${cat.id}`)
      .set({ ...cat, storeId: STORE_ID, createdAt: now })
    console.log(`✓ categories/${cat.id}`)
  }

  for (const prod of products) {
    await db
      .doc(`products/${prod.id}`)
      .set({ ...prod, storeId: STORE_ID, createdAt: now })
    console.log(`✓ products/${prod.id}`)
  }
}

async function patchAdminsWithYukiko() {
  const snap = await db.collection('users').where('role', '==', 'admin').get()
  for (const doc of snap.docs) {
    const data = doc.data()
    const current = Array.isArray(data.adminStores) ? data.adminStores : []
    const next = Array.from(new Set([...current, STORE_ID]))
    await doc.ref.set({ adminStores: next }, { merge: true })
    console.log(`✓ users/${doc.id} adminStores=${JSON.stringify(next)}`)
  }
  if (snap.empty) {
    console.log(
      `ℹ No hay admins aún. En users/{uid}: role=admin y adminStores=["${STORE_ID}"].`
    )
  }
}

async function main() {
  console.log(`Sembrando ${STORE_ID} en proyecto: ${projectId}`)
  await seedYukiko()
  if (patchAdmins) {
    await patchAdminsWithYukiko()
  } else {
    console.log(
      'ℹ Admíns no modificados. Para añadir yukiko a adminStores: npm run seed:yukiko -- --patch-admins'
    )
  }
  console.log(`\nListo. URL: /s/${STORE_ID}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
