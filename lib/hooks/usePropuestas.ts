// lib/hooks/usePropuestas.ts

import { useState, useEffect, useCallback } from 'react'
import { obtenerPropuestas } from '@/lib/services/propuestas'
import type { Propuesta } from '@/types'

export function usePropuestas() {
  const [propuestas, setPropuestas] = useState<Propuesta[]>([])
  const [loading, setLoading] = useState(true)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      setPropuestas(await obtenerPropuestas())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  return { propuestas, loading, cargar }
}
