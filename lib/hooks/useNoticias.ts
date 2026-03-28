// lib/hooks/useNoticias.ts
'use client'

import { useEffect, useState, useCallback } from 'react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore/lite'
import { db } from '@/lib/firebase'
import { NOTICIAS_DEFECTO } from '@/congreso.config'
import type { Noticia } from '@/types'

export function useNoticias() {
  const [noticias, setNoticias] = useState<Noticia[]>([])
  const [loading, setLoading]   = useState(true)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const q    = query(collection(db, 'noticias'), orderBy('fecha', 'desc'))
      const snap = await getDocs(q)
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Noticia))
      setNoticias(data.length > 0 ? data : NOTICIAS_DEFECTO)
    } catch {
      setNoticias(NOTICIAS_DEFECTO)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  return { noticias, loading, cargar }
}
