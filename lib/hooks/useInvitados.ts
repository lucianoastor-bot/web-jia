// lib/hooks/useInvitados.ts
'use client'

import { useEffect, useState, useCallback } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { Invitado } from '@/types'

export function useInvitados() {
  const [invitados, setInvitados] = useState<Invitado[]>([])
  const [loading, setLoading]     = useState(true)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const snap = await getDocs(collection(db, 'invitados'))
      setInvitados(snap.docs.map(d => ({ id: d.id, ...d.data() } as Invitado)))
    } catch {
      // mantiene el estado anterior en caso de error
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  return { invitados, loading, cargar }
}
