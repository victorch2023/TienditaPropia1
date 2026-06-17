/**
 * Puebla Firestore con scripts/seed-data.json
 *
 * Requisitos:
 *   1. npm install (incluye firebase-admin como devDependency)
 *   2. Descarga la clave de cuenta de servicio en Firebase Console
 *      → Configuración → Cuentas de servicio → Generar nueva clave privada
 *   3. Exporta la ruta:
 *      export GOOGLE_APPLICATION_CREDENTIALS="/ruta/a/serviceAccountKey.json"
 *   4. Opcional: FIREBASE_PROJECT_ID en .env o variable de entorno
 *
 * Uso:
 *   npm run seed
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import admin from 'firebase-admin'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

function loadEnv() {
  try {
    const envPath = join(root, '.env')
    const text = readFileSync(envPath, 'utf8')
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

const seed = JSON.parse(readFileSync(join(__dirname, 'seed-data.json'), 'utf8'))
const now = Date.now()

async function seedFirestore() {
  console.log(`Sembrando Firestore en proyecto: ${projectId}`)

  await db.doc('stores/config').set(
    { ...seed.storeConfig, updatedAt: now },
    { merge: true }
  )
  console.log('✓ stores/config')

  for (const cat of seed.categories) {
    await db.doc(`categories/${cat.id}`).set({ ...cat, createdAt: now })
    console.log(`✓ categories/${cat.id}`)
  }

  for (const prod of seed.products) {
    await db.doc(`products/${prod.id}`).set({ ...prod, createdAt: now })
    console.log(`✓ products/${prod.id}`)
  }

  console.log('\nListo. Crea tu usuario admin en Firebase Auth y cambia role a "admin" en users/{uid}.')
}

seedFirestore().catch((err) => {
  console.error(err)
  process.exit(1)
})
