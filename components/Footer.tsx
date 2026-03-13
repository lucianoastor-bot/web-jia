'use client'

import { useEffect, useState } from 'react'

function useCountdown(targetDate: string) {
  const [time, setTime] = useState({ days: '--', hours: '--', mins: '--' })

  useEffect(() => {
    function update() {
      const diff = new Date(targetDate).getTime() - new Date().getTime()
      if (diff <= 0) {
        setTime({ days: '00', hours: '00', mins: '00' })
        return
      }
      setTime({
        days:  String(Math.floor(diff / 86400000)).padStart(2, '0'),
        hours: String(Math.floor((diff % 86400000) / 3600000)).padStart(2, '0'),
        mins:  String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0'),
      })
    }
    update()
    const interval = setInterval(update, 60000)
    return () => clearInterval(interval)
  }, [targetDate])

  return time
}

export default function Footer() {
  const { days, hours, mins } = useCountdown('2026-06-10T09:00:00-03:00')

  return (
    <footer className="footer">

      {/* ── Countdown ── */}
      <div className="footer-countdown">
        <div className="cd-label">Faltan</div>
        <div className="cd-units">
          <div className="cd-unit">
            <span className="cd-num">{days}</span>
            <span className="cd-name">días</span>
          </div>
          <span className="cd-sep">/</span>
          <div className="cd-unit">
            <span className="cd-num">{hours}</span>
            <span className="cd-name">horas</span>
          </div>
          <span className="cd-sep">/</span>
          <div className="cd-unit">
            <span className="cd-num">{mins}</span>
            <span className="cd-name">minutos</span>
          </div>
        </div>
        <div className="cd-info">
          <strong>10, 11 y 12 de junio de 2026</strong><br />
          Facultad de Humanidades y Artes · Entre Ríos 758, Rosario
        </div>
      </div>

      {/* ── Faculty bar ── */}
      <div className="footer-faculty">
        <img src="/logo-hya.png" alt="Facultad de Humanidades y Artes — UNR" />
      </div>

      {/* ── Copyright ── */}
      <div className="footer-copyright">
        <p>{'© 2026 Facultad de Humanidades y Artes · UNR'}</p>
      </div>

    </footer>
  )
}
