'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { SPEAKERS } from '@/lib/speakers-data'

export default function Speakers() {
  const [current, setCurrent] = useState(0)
  const [visible, setVisible] = useState(4)
  const total = SPEAKERS.length

  /* para desplazar el carousell con el dedo */
  const touchStartX = useRef<number>(0)
  const touchEndX = useRef<number>(0)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX
    const diff = touchStartX.current - touchEndX.current

    if (Math.abs(diff) > 50) {  // umbral mínimo de 50px para considerar swipe
      if (diff > 0) {
        // swipe izquierda → siguiente
        next()
      } else {
        // swipe derecha → anterior
        prev()
      }
    }
  }
/* -------- */

  useEffect(() => {
    const update = () => {
      if (window.innerWidth < 600) setVisible(1)
      else if (window.innerWidth < 900) setVisible(2)
      else setVisible(4)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const prev = () => setCurrent(c => Math.max(0, c - 1))
  const next = () => setCurrent(c => Math.min(total - visible, c + 1))

  const [SHUFFLED, setShuffled] = useState(SPEAKERS)
    useEffect(() => {
      setShuffled([...SPEAKERS].sort(() => Math.random() - 0.5))
  }, [])

  return (
    <section className="speakers" id="invitados">
      <div className="speakers__inner">

        <div className="speakers__header">
            <h2 className="section__title">Invitados</h2>
        </div>

        {/* Carrusel */}
        <div className="speakers__carousel-wrap"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd} >

          {/* Flechas */}
          <div className="speakers__nav">
            <button
              className="speakers__nav-btn"
              onClick={prev}
              disabled={current === 0}
              aria-label="Anterior"
            >
              ←
            </button>
            <button
              className="speakers__nav-btn"
              onClick={next}
              disabled={current >= total - visible}
              aria-label="Siguiente"
            >
              →
            </button>
          </div>
          <div
            className="speakers__carousel"
            style={{
              transform: `translateX(calc(-${current} * (100% / ${visible}) - ${current} * var(--carousel-gap)))`,
            }}
          >
            {SHUFFLED.map((speaker) => (
              <Link
                key={speaker.name}
                href="/invitados"
                className="speaker-card"
                style={{ flex: `0 0 calc((100% - ${visible - 1} * var(--carousel-gap)) / ${visible})` }}
              >
                <div className="speaker-card__photo-wrap">
                  <Image
                    className="speaker-card__photo"
                    src={speaker.photo}
                    alt={speaker.name}
                    width={400}
                    height={400}
                  />
                </div>
                <div className="speaker-card__info">
                  <h3 className="speaker-card__name">{speaker.name}</h3>
                  <p className="speaker-card__role">{speaker.role}</p>
                  <p className="speaker-card__institution">{speaker.institution}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Dots */}
        <div className="speakers__dots">
          {Array.from({ length: total - visible + 1 }).map((_, i) => (
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
