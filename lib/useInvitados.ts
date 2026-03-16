// lib/useInvitados.ts
'use client'

import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from './firebase'

export type Invitado = {
  id: string
  nombre: string
  rol: string
  institucion: string
  bio: string
  foto: string
  titulo: string
  fecha: string
  hora: string
  lugar: string
}

export function useInvitados() {
  const [invitados, setInvitados] = useState<Invitado[]>([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'invitados'), snap => {
      setInvitados(snap.docs.map(d => ({ id: d.id, ...d.data() } as Invitado)))
      setLoading(false)
    })
    return () => unsub()
  }, [])

  return { invitados, loading }
}
