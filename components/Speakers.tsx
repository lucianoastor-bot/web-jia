'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useInvitados } from '@/lib/useInvitados'

export default function Speakers() {
  const { invitados, loading } = useInvitados()
  const [current, setCurrent]  = useState(0)
  const [visible, setVisible]  = useState(4)

  useEffect(() => {
    const update = () => {
      if (window.innerWidth < 600)      setVisible(1)
      else if (window.innerWidth < 900) setVisible(2)
      else                              setVisible(4)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Orden aleatorio solo en cliente
  const [shuffled, setShuffled] = useState(invitados)
  useEffect(() => {
    if (invitados.length > 0) {
      setShuffled([...invitados].sort(() => Math.random() - 0.5))
    }
  }, [invitados])

  const total = shuffled.length
  const prev  = () => setCurrent(c => Math.max(0, c - 1))
  const next  = () => setCurrent(c => Math.min(total - visible, c + 1))

  const touchStartX = { current: 0 }
  const touchEndX   = { current: 0 }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX
    const diff = touchStartX.current - touchEndX.current
    if (Math.abs(diff) > 50) diff > 0 ? next() : prev()
  }

  if (loading) return (
    <section className="speakers">
      <div className="speakers__inner">
        <h2 className="section__title">Invitados</h2>
        <p style={{ color: 'rgba(35,22,81,0.3)', fontSize: '0.82rem' }}>Cargando...</p>
      </div>
    </section>
  )

  if (total === 0) return null

  return (
    <section className="speakers" id="invitados">
      <div className="speakers__inner">
        <div className="section__eyebrow">Conferencias invitadas</div>
        <h2 className="section__title">Invitados</h2>

        <div
          className="speakers__carousel-wrap"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="speakers__nav">
            <button className="speakers__nav-btn" onClick={prev} disabled={current === 0} aria-label="Anterior">←</button>
            <button className="speakers__nav-btn" onClick={next} disabled={current >= total - visible} aria-label="Siguiente">→</button>
          </div>

          <div
            className="speakers__carousel"
            style={{ transform: `translateX(calc(-${current} * (100% / ${visible}) - ${current} * var(--carousel-gap)))` }}
          >
            {shuffled.map((inv) => (
              <Link
                key={inv.id}
                href="/invitados"
                className="speaker-card"
                style={{ flex: `0 0 calc((100% - ${visible - 1} * var(--carousel-gap)) / ${visible})` }}
              >
                <div className="speaker-card__photo-wrap">
                  <Image
                    className="speaker-card__photo"
                    src={inv.foto || '/speakers/placeholder.jpg'}
                    alt={inv.nombre}
                    width={400}
                    height={400}
                  />
                </div>
                <div className="speaker-card__info">
                  <h3 className="speaker-card__name">{inv.nombre}</h3>
                  <p className="speaker-card__role">{inv.rol}</p>
                  <p className="speaker-card__institution">{inv.institucion}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="speakers__dots">
          {Array.from({ length: Math.max(0, total - visible + 1) }).map((_, i) => (
            <button
              key={i}
              className={`speakers__dot ${i === current ? 'is-active' : ''}`}
              onClick={() => setCurrent(i)}
              aria-label={`Ir al invitado ${i + 1}`}
            />
          ))}
        </div>

      </div>
    </section>
  )
}
