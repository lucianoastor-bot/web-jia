// app/contacto/page.tsx

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contacto — Jornadas: La IA en Debate',
  description: 'Contacto y consultas sobre las Jornadas La IA en Debate, FHyA UNR 2026.',
}

export default function Contacto() {
  return (
    <main className="page">
      <div className="section">

        <div className="section__eyebrow">Contacto</div>
        <h1 className="section__title">Consultas e información</h1>

        <p className="section__body">
          Ante cualquier duda o inquietud sobre las jornadas, la convocatoria
          o el proceso de envío de resúmenes, no dudes en comunicarte con el
          equipo organizador.
        </p>

        <div style={{ marginTop: '3rem' }}>
          <p style={{
            fontSize: '0.68rem',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--c-mid)',
            fontWeight: 500,
            marginBottom: '0.6rem'
          }}>
            Correo electrónico
          </p>
          
          <a href="mailto:ia.jornadas.hya@gmail.com"
            style={{
              fontSize: '1.1rem',
              color: 'var(--c-dark)',
              fontWeight: 400,
              letterSpacing: '0.02em',
              borderBottom: '1px solid var(--c-turq)',
              paddingBottom: '0.1rem',
              transition: 'color 0.2s',
            }}
          >
            ia.jornadas.hya@gmail.com
          </a>
        </div>

      </div>
    </main>
  )
}
