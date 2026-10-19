// Post-build (ARCHIVO 2026, subcarpeta /archivo/2026):
// next build con basePath prefija rutas y _next, pero NO las referencias a
// assets de public/ (fotos de invitados, logos) porque van como <img src="/...">.
// Este script las prefija en el output para que el archivo sea auto-contenido.
// Uso: node scripts/prefijar-assets.mjs <dir-out>
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const dir = process.argv[2] || './out'
const BASE = '/archivo/2026'
const EXTS = ['.html', '.js', '.css', '.txt', '.xml', '.json']

// Prefija /invitados... y /logo-*.png cuando están anclados por comilla, (, = o espacio.
const RE = /([="'(\s`])\/(invitados|logo-azul\.png|logo-hya\.png|logo-upar\.png)/g

function walk(d) {
  for (const name of readdirSync(d)) {
    const p = join(d, name)
    const st = statSync(p)
    if (st.isDirectory()) { walk(p); continue }
    if (!EXTS.some(e => p.endsWith(e))) continue
    const orig = readFileSync(p, 'utf8')
    const next = orig.replace(RE, `$1${BASE}/$2`)
    if (next !== orig) writeFileSync(p, next)
  }
}

walk(dir)
console.log(`Assets de public/ prefijados con ${BASE} en ${dir}`)
