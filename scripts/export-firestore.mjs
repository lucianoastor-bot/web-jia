// Export de solo lectura de Firestore → JSON (archivo 2026)
// Uso: node <este archivo> <carpeta-salida>
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs } from 'firebase/firestore/lite'

// --- Cargar .env.local a mano ---
const envRaw = readFileSync('.env.local', 'utf8')
const env = {}
for (const line of envRaw.split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
}

const firebaseConfig = {
  apiKey:            env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const outDir = process.argv[2] || './export'
mkdirSync(outDir, { recursive: true })

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Colecciones públicas del archivo (NO exportamos 'usuarios' = cuentas admin)
const COLECCIONES = ['invitados', 'actividades', 'propuestas', 'noticias']

// Convierte Timestamps de Firestore a ISO string para que el JSON sea estable
function limpiar(valor) {
  if (valor && typeof valor === 'object') {
    if (typeof valor.toDate === 'function') return valor.toDate().toISOString()
    if (Array.isArray(valor)) return valor.map(limpiar)
    const out = {}
    for (const [k, v] of Object.entries(valor)) out[k] = limpiar(v)
    return out
  }
  return valor
}

const resumen = {}
for (const nombre of COLECCIONES) {
  const snap = await getDocs(collection(db, nombre))
  const docs = snap.docs.map(d => ({ id: d.id, ...limpiar(d.data()) }))
  writeFileSync(join(outDir, `${nombre}.json`), JSON.stringify(docs, null, 2))
  resumen[nombre] = docs.length
}

console.log('Export completo →', outDir)
console.log(JSON.stringify(resumen, null, 2))
process.exit(0)
