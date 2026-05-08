// lib/hooks/useAcreditaciones.ts
'use client'

import { useEffect, useState, useCallback } from 'react'
import { obtenerAcreditaciones } from '@/lib/services/acreditaciones'
import type { Acreditacion } from '@/types'

export function useAcreditaciones() {
  const [acreditaciones, setAcreditaciones] = useState<Map<string, Acreditacion>>(new Map())
  const [loading, setLoading]               = useState(true)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const lista = await obtenerAcreditaciones()
      const map   = new Map<string, Acreditacion>()
      lista.forEach(a => map.set(a.nombreClave, a))
      setAcreditaciones(map)
    } catch {
      // mantiene estado anterior en caso de error
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  return { acreditaciones, loading, cargar }
}
