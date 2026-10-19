// lib/hooks/useNoticias.ts
// ARCHIVO 2026: lee de data/noticias.json (congelado), no de Firestore.
'use client'

import { NOTICIAS_DEFECTO } from '@/congreso.config'
import type { Noticia } from '@/types'
import datos from '@/data/noticias.json'

const NOTICIAS = (datos as unknown as Noticia[])
  .slice()
  .sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0))

export function useNoticias() {
  return {
    noticias: NOTICIAS.length > 0 ? NOTICIAS : NOTICIAS_DEFECTO,
    loading: false,
    cargar: async () => {},
  }
}
