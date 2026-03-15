// app/organizacion/page.tsx

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Organización — Jornadas IA en Debate',
  description: 'Comité organizador y comité académico de las Jornadas La IA en Debate, FHyA UNR 2026.',
}

export default function Organizacion() {
  return (
    <main className="page">
      <div className="section">

        <div className="section__eyebrow">Equipo</div>
        <h1 className="section__title">Organización</h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          <div className="placeholder">
            <div>
              <span className="placeholder__icon">👥</span>
              <p className="placeholder__title">Comité organizador</p>
              <p className="placeholder__text">
                En los próximos días estará disponible<br />
                la información sobre el comité organizador.
              </p>
            </div>
          </div>

          <div className="placeholder">
            <div>
              <span className="placeholder__icon">🎓</span>
              <p className="placeholder__title">Comité académico</p>
              <p className="placeholder__text">
                En los próximos días estará disponible<br />
                la información sobre el comité académico.
              </p>
            </div>
          </div>

        </div>

      </div>
    </main>
  )
}
