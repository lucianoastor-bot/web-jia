// lib/hooks/useActividades.ts

import { useState, useEffect, useCallback } from 'react'
import { obtenerActividades } from '@/lib/services/actividades'
import type { Actividad } from '@/types'

export function useActividades() {
  const [actividades, setActividades] = useState<Actividad[]>([])
  const [loading, setLoading] = useState(true)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      setActividades(await obtenerActividades())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  return { actividades, loading, cargar }
}
