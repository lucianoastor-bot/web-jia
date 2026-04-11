'use client'

import { useState, useEffect } from 'react'

const INICIO = new Date(2026, 2, 1)              // 1 marzo 2026
const FIN    = new Date(2026, 3, 20, 23, 59, 59) // 20 abril 2026 23:59:59
const TOTAL  = FIN.getTime() - INICIO.getTime()

function calcular() {
  const ahora       = Date.now()
  const progreso    = Math.min(100, Math.max(0, (ahora - INICIO.getTime()) / TOTAL * 100))
  const msRestantes = FIN.getTime() - ahora
  const dias        = msRestantes > 0 ? Math.ceil(msRestantes / 86400000) : 0
  return { progreso, dias, vencido: msRestantes <= 0 }
}

export default function PlazoTimeline() {
  const [estado, setEstado]   = useState({ progreso: 0, dias: 0, vencido: false })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setEstado(calcular())
    const id = setInterval(() => setEstado(calcular()), 3600000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="plazo-timeline">
      <div className="plazo-timeline__barra">
        <div
          className="plazo-timeline__progreso"
          style={{ width: mounted ? `${estado.progreso}%` : '0%' }}
        />
        <div className="plazo-timeline__hito" />
        {mounted && (
          <span className="plazo-timeline__cuenta">
            {estado.vencido
              ? 'Plazo vencido'
              : estado.dias === 1
                ? 'Queda: 1 día'
                : `Quedan: ${estado.dias} días`}
          </span>
        )}
      </div>
    </div>
  )
}
