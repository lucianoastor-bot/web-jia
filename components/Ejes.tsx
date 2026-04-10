'use client'

import { useState } from 'react'
import { EJES } from '@/congreso.config'

export default function Ejes() {
  const [active, setActive] = useState<string | null>(null)

  const toggle = (num: string) => {
    setActive(prev => prev === num ? null : num)
  }

  return (
    <section className="ejes" id="ejes">
      <div className="ejes__inner">

        <h2 className="section__title">Ejes temáticos</h2>
        <br />
        <div className="ejes__grid">
          {EJES.map((eje) => (
            <div
              key={eje.num}
              className={`eje-card ${active === eje.num ? 'is-active' : ''}`}
              onClick={() => toggle(eje.num)}
            >
              <span className="eje-card__num">{eje.num}</span>
              <h3 className="eje-card__title">{eje.titulo}</h3>
              <p className="eje-card__desc">{eje.descripcion}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
