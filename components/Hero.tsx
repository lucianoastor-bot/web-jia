'use client'

import Link from 'next/link'

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-blocks">

        {/* Logo */}
        <div className="hero-logo">
          <img src="/logo-azul.png" alt="Jornadas: La IA en Debate" />
        </div>

        {/* Divisor */}
        <div className="hero-divider" />

        {/* Texto */}
        <div className="hero-text">
          
          <div className="text-jornadas">Jornadas</div>
          <div className="text-title">
            <span className="t-mid">La </span>
            <span className="t-dark">Inteligencia</span>
            <span className="line2">
              <span className="t-dark">Artificial </span>
              <span className="t-mid">en Debate</span>
            </span>
          </div>
          <div className="text-date">
            10 &nbsp;·&nbsp; 11 &nbsp;·&nbsp; 12 de junio &nbsp;·&nbsp; Rosario, Argentina
          </div>
          <div className="text-cta">
            <Link href="/call-for-papers" className="btn-primary">
              {'Call for papers'}
            </Link>
            <Link href="/contacto" className="btn-ghost">
              Contacto
            </Link>
          </div>
        </div>

      </div>
    </section>
  )
}
