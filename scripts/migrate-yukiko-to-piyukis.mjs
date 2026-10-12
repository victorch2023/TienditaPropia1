/**
 * Migración Firestore: storeId yukiko → piyukis.
 *
 * Requisitos: GOOGLE_APPLICATION_CREDENTIALS + VITE_FIREBASE_PROJECT_ID
 *
 * Uso:
 *   npm run migrate:yukiko-to-piyukis
 *
 * Acciones:
 * 1. Copia stores/yukiko → stores/piyukis (name "Piyukis", slug piyukis, active true)
 * 2. Actualiza products/categories/orders con storeId "yukiko" → "piyukis"
 * 3. En users.adminStores, reemplaza "yukiko" por "piyukis"
 * 4. Marca stores/yukiko como active: false (no borra el doc)
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import admin from 'firebase-admin'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const OLD_ID = 'yukiko'
const NEW_ID = 'piyukis'

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
const now = Date.now()

async function migrateStoreDoc() {
  const oldRef = db.doc(`stores/${OLD_ID}`)
  const newRef = db.doc(`stores/${NEW_ID}`)
  const oldSnap = await oldRef.get()
  const newSnap = await newRef.get()

  if (oldSnap.exists) {
    const data = oldSnap.data() || {}
    const { slug: _slug, ...rest } = data
    await newRef.set(
      {
        ...rest,
        name: 'Piyukis',
        slug: NEW_ID,
        active: true,
        updatedAt: now,
        migratedFrom: OLD_ID,
      },
      { merge: true }
    )
    console.log(`✓ stores/${NEW_ID} (copiado desde stores/${OLD_ID}, name=Piyukis)`)
    await oldRef.set({ active: false, updatedAt: now, migratedTo: NEW_ID }, { merge: true })
    console.log(`✓ stores/${OLD_ID} marcado active=false (migratedTo=${NEW_ID})`)
  } else if (!newSnap.exists) {
    const seed = JSON.parse(
      readFileSync(join(__dirname, 'seed-piyukis-data.json'), 'utf8')
    )
    await newRef.set({
      ...seed.storeConfig,
      slug: NEW_ID,
      active: true,
      updatedAt: now,
    })
    console.log(`✓ stores/${NEW_ID} (creado desde seed; no existía stores/${OLD_ID})`)
  } else {
    await newRef.set(
      { name: 'Piyukis', slug: NEW_ID, active: true, updatedAt: now },
      { merge: true }
    )
    console.log(`✓ stores/${NEW_ID} ya existía; name/slug/active actualizados`)
  }
}

async function migrateCollection(name) {
  const snap = await db.collection(name).where('storeId', '==', OLD_ID).get()
  let n = 0
  for (const doc of snap.docs) {
    await doc.ref.set({ storeId: NEW_ID }, { merge: true })
    n++
  }
  console.log(`✓ ${name}: ${n} doc(s) storeId ${OLD_ID} → ${NEW_ID}`)
  return n
}

async function migrateAdminStores() {
  const snap = await db.collection('users').get()
  let n = 0
  for (const doc of snap.docs) {
    const data = doc.data()
    if (!Array.isArray(data.adminStores)) continue
    if (!data.adminStores.includes(OLD_ID)) continue
    const next = Array.from(
      new Set(data.adminStores.map((id) => (id === OLD_ID ? NEW_ID : id)))
    )
    await doc.ref.set({ adminStores: next }, { merge: true })
    console.log(`✓ users/${doc.id} adminStores=${JSON.stringify(next)}`)
    n++
  }
  if (n === 0) console.log('ℹ Ningún user.adminStores contenía yukiko')
  return n
}

async function main() {
  console.log(`Migrando ${OLD_ID} → ${NEW_ID} en proyecto: ${projectId}`)
  await migrateStoreDoc()
  await migrateCollection('products')
  await migrateCollection('categories')
  await migrateCollection('orders')
  await migrateAdminStores()
  console.log(`\nListo. URLs: /s/${NEW_ID} y /s/${NEW_ID}/admin`)
  console.log(
    `Nota: stores/${OLD_ID} quedó inactive (no borrado). Puedes borrarlo en Console si quieres.`
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
