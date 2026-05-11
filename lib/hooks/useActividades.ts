// lib/hooks/useActividades.ts

import { useState, useEffect, useCallback } from 'react'
import { obtenerActividades } from '@/lib/services/actividades'
import type { Actividad } from '@/types'

export function useActividades() {
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(false)

  const cargar = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      setActividades(await obtenerActividades())
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  return { actividades, loading, error, cargar }
}
