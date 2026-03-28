'use client'

import { useEffect, useState } from 'react'
import { CONGRESO } from '@/congreso.config'

function calcTime() {
  const diff = CONGRESO.fechaInicio.getTime() - Date.now()
  if (diff <= 0) return { dias: 0, horas: 0, mins: 0 }
  return {
    dias:  Math.floor(diff / 86400000),
    horas: Math.floor((diff % 86400000) / 3600000),
    mins:  Math.floor((diff % 3600000) / 60000),
  }
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export default function Countdown() {
  const [time, setTime]       = useState({ dias: 0, horas: 0, mins: 0 })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setTime(calcTime())
    const id = setInterval(() => setTime(calcTime()), 60000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="countdown" aria-label="Cuenta regresiva al evento">
      <div className="countdown__left">
        <span className="countdown__label">Faltan:</span>
        <div className="countdown__units">
          <div className="countdown__unit">
            <span className="countdown__num">{mounted ? pad(time.dias) : '--'}</span>
            <span className="countdown__label-unit">días</span>
          </div>
          <span className="countdown__sep">/</span>
          <div className="countdown__unit">
            <span className="countdown__num">{mounted ? pad(time.horas) : '--'}</span>
            <span className="countdown__label-unit">horas</span>
          </div>
          <span className="countdown__sep">/</span>
          <div className="countdown__unit">
            <span className="countdown__num">{mounted ? pad(time.mins) : '--'}</span>
            <span className="countdown__label-unit">minutos</span>
          </div>
        </div>
      </div>
    </div>
  )
}
