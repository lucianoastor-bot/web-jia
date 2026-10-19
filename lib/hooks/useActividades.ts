// lib/hooks/useActividades.ts
// ARCHIVO 2026: lee de data/actividades.json (congelado), no de Firestore.
'use client'

import type { Actividad } from '@/types'
import datos from '@/data/actividades.json'

const ACTIVIDADES = datos as unknown as Actividad[]

export function useActividades() {
  return {
    actividades: ACTIVIDADES,
    loading: false,
    error: false,
    cargar: async () => {},
  }
}
