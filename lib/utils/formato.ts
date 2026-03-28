// lib/utils/formato.ts
// Funciones de formateo de fechas y horas.
// El formato de salida se configura en app.config.ts (FORMATO).

import { FORMATO } from '@/app.config'

/**
 * Convierte una fecha ISO (YYYY-MM-DD) a texto legible.
 * Ejemplo: '2026-06-15' → '15 de junio de 2026'
 */
export function formatearFecha(iso: string): string {
  if (!iso) return ''
  const [anio, mes, dia] = iso.split('-').map(Number)
  const fecha = new Date(anio, mes - 1, dia)
  return fecha.toLocaleDateString(FORMATO.locale, FORMATO.fecha)
}

/**
 * Valida que una ruta de foto sea un archivo de imagen.
 * Devuelve el fallback si el path está vacío o no termina en extensión de imagen.
 * Evita que next/image reciba paths inválidos como '/invitados/' en producción.
 */
export function validarFoto(foto: string | undefined, fallback = '/invitados/placeholder.jpg'): string {
  if (!foto || !/\.(jpg|jpeg|png|gif|webp|avif|svg)$/i.test(foto)) return fallback
  return foto
}

/**
 * Convierte una hora HH:MM (input time) a texto legible.
 * Ejemplo: '14:30' → '14:30 hs'
 */
export function formatearHora(hhmm: string): string {
  if (!hhmm) return ''
  const [h, m] = hhmm.split(':').map(Number)
  const d = new Date(2000, 0, 1, h, m)
  return d.toLocaleTimeString(FORMATO.locale, FORMATO.hora) + ' hs'
}
