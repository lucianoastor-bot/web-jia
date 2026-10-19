// lib/hooks/usePropuestas.ts
// ARCHIVO 2026: lee de data/propuestas.json (congelado), no de Firestore.
'use client'

import type { Propuesta } from '@/types'
import datos from '@/data/propuestas.json'

const PROPUESTAS = datos as unknown as Propuesta[]

export function usePropuestas() {
  return {
    propuestas: PROPUESTAS,
    loading: false,
    cargar: async () => {},
  }
}
