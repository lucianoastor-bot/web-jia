'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect } from 'react'
import Countdown from './Countdown'

export default function Hero() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/tsparticles@2.12.0/tsparticles.bundle.min.js'
    script.onload = () => {
      // @ts-ignore
      window.tsParticles?.load('hero-particles', {
        fullScreen: { enable: false },
        fpsLimit: 60,
        background: { color: { value: 'transparent' } },
        particles: {
          number: { value: 55, density: { enable: true, area: 1000 } },
          color:  { value: ['#2374ab', '#4dccbd', '#ff8484'] },
          opacity: { value: 0.35, random: { enable: true, minimumValue: 0.1 } },
          size:    { value: { min: 1, max: 2.5 } },
          links: {
            enable: true, distance: 140,
            color: '#2374ab', opacity: 0.25, width: 1,
          },
          move: {
            enable: true, speed: 0.35, random: true,
            outModes: { default: 'bounce' },
          },
        },
        interactivity: {
          events: { onHover: { enable: true, mode: 'grab' } },
          modes:  { grab: { distance: 160, links: { opacity: 0.28 } } },
        },
        detectRetina: true,
      })
    }
    document.head.appendChild(script)
  }, [])

  return (
    <section className="hero" aria-label="Hero">

      {/* Background: particles */}
      <div id="hero-particles" className="hero__particles" aria-hidden="true" />

      {/* Background: ghost logo */}
      <Image
        className="hero__bg-logo"
        src="/logo-azul2.png"
        alt=""
        aria-hidden="true"
        width={1100}
        height={883}
        priority
      />

      {/* Content */}
      <div className="hero__content">

        <div className="hero__text">
          <p className="hero__jornadas">Jornadas</p>

          <h1 className="hero__title">
            <span className="hero__title-la">La</span>
            <span className="hero__title-ia">Inteligencia</span>
            <span className="hero__title-art">Artificial</span>
            <span className="hero__title-debate">en Debate</span>
          </h1>

          <p className="hero__date">
            <strong>10 · 11 · 12 de junio de 2026</strong>
            {' '}·{' '}Rosario, Argentina
          </p>
        </div>

        <div className="hero__actions">
          <Link href="/propuestas" className="btn btn--primary">
            Envío de resúmenes
          </Link>
          <Link href="/contacto" className="btn btn--ghost">
            Contacto
          </Link>
        </div>

      </div>

      <div className="hero__scroll" aria-hidden="true">scroll</div>

      <Countdown />

    </section>
  )
}
