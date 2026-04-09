'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'
import { useInvitados } from '@/lib/hooks/useInvitados'
import { validarFoto } from '@/lib/utils/formato'

export default function InvitadosCarrusel() {
  const { invitados: todos, loading } = useInvitados()
  const invitados = useMemo(() => todos.filter(inv => inv.confirmado), [todos])
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
    <section className="invitados">
      <div className="invitados__inner">
        <h2 className="section__title">Invitados</h2>
        <p style={{ color: 'rgba(35,22,81,0.3)', fontSize: '0.82rem' }}>Cargando...</p>
      </div>
    </section>
  )

  if (total === 0) return null

  return (
    <section className="invitados" id="invitados">
      <div className="invitados__inner">
        <h2 className="section__title">Invitados</h2>

        <div
          className="invitados__carrusel-wrap"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="invitados__nav">
            <button className="invitados__nav-btn" onClick={prev} disabled={current === 0} aria-label="Anterior">←</button>
            <button className="invitados__nav-btn" onClick={next} disabled={current >= total - visible} aria-label="Siguiente">→</button>
          </div>

          <div
            className="invitados__carrusel"
            style={{ transform: `translateX(calc(-${current} * (100% / ${visible}) - ${current} * var(--carousel-gap)))` }}
          >
            {shuffled.map((inv) => (
              <Link
                key={inv.id}
                href="/invitados"
                className="invitado-card"
                style={{ flex: `0 0 calc((100% - ${visible - 1} * var(--carousel-gap)) / ${visible})` }}
              >
                <div className="invitado-card__foto-wrap">
                  <Image
                    className="invitado-card__foto"
                    src={validarFoto(inv.foto)}
                    alt={inv.nombre}
                    width={400}
                    height={400}
                  />
                </div>
                <div className="invitado-card__info">
                  <h3 className="invitado-card__nombre">{inv.nombre}</h3>
                  <p className="invitado-card__rol">{inv.rol}</p>
                  <p className="invitado-card__institucion">{inv.institucion}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="invitados__puntos">
          {Array.from({ length: Math.max(0, total - visible + 1) }).map((_, i) => (
            <button
              key={i}
              className={`invitados__punto ${i === current ? 'is-active' : ''}`}
              onClick={() => setCurrent(i)}
              aria-label={`Ir al invitado ${i + 1}`}
            />
          ))}
        </div>

      </div>
    </section>
  )
}
