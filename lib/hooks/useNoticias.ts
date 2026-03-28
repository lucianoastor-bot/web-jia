// lib/hooks/useNoticias.ts
'use client'

import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { NOTICIAS_DEFECTO } from '@/congreso.config'
import type { Noticia } from '@/types'

export function useNoticias() {
  const [noticias, setNoticias] = useState<Noticia[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'noticias'), orderBy('fecha', 'desc'))
    const unsub = onSnapshot(
      q,
      snap => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Noticia))
        setNoticias(data.length > 0 ? data : NOTICIAS_DEFECTO)
        setLoading(false)
      },
      () => {
        setNoticias(NOTICIAS_DEFECTO)
        setLoading(false)
      }
    )
    return () => unsub()
  }, [])

  return { noticias, loading }
}
