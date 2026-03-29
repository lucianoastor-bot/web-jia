// lib/hooks/usePaneles.ts

import { useState, useEffect, useCallback } from 'react'
import { obtenerPaneles } from '@/lib/services/actividades'
import type { Actividad } from '@/types'

export function usePaneles() {
  const [paneles, setPaneles] = useState<Actividad[]>([])
  const [loading, setLoading] = useState(true)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      setPaneles(await obtenerPaneles())
    } catch { } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  return { paneles, loading, cargar }
}
