// lib/hooks/useInvitados.ts
// ARCHIVO 2026: lee de data/invitados.json (congelado), no de Firestore.
'use client'

import type { Invitado } from '@/types'
import datos from '@/data/invitados.json'

const INVITADOS = datos as unknown as Invitado[]

export function useInvitados() {
  return {
    invitados: INVITADOS,
    loading: false,
    cargar: async () => {},
  }
}
