// app/organizacion/page.tsx

import type { Metadata } from 'next'
import { CONGRESO, COORDINADORES, COMITE_ORGANIZADOR, COMITE_ACADEMICO } from '@/congreso.config'

export const metadata: Metadata = {
  title: `Organización — ${CONGRESO.nombreCorto}`,
  description: `Coordinadores, comité organizador y comité académico. ${CONGRESO.nombre} — ${CONGRESO.siglas} — ${CONGRESO.anio}.`,
}

function ListaPersonas({ nombres }: { nombres: string[] }) {
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      {nombres.map(nombre => (
        <li key={nombre} style={{ fontSize: '1.05rem', color: '#444', borderBottom: '1px solid rgba(35,22,81,0.06)', paddingBottom: '0.4rem' }}>
          {nombre}
        </li>
      ))}
    </ul>
  )
}

function NombresInline({ nombres }: { nombres: string[] }) {
  return (
    <p style={{ fontSize: '1.05rem', color: '#444', lineHeight: 1.8 }}>
      {nombres.join(' · ')}
    </p>
  )
}

export default function Organizacion() {
  return (
    <main className="page">
      <div className="section">

        <div className="section__eyebrow">Team</div>
        <h1 className="section__title">Organización</h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem', marginTop: '2.5rem', maxWidth: '720px' }}>

          <div>
            <h2 className="section__title" style={{ fontSize: 'clamp(1.1rem, 2vw, 1.6rem)', marginBottom: '1.5rem' }}>
              Coordinadores
            </h2>
            <ListaPersonas nombres={COORDINADORES} />
          </div>

          <div>
            <h2 className="section__title" style={{ fontSize: 'clamp(1.1rem, 2vw, 1.6rem)', marginBottom: '1.5rem' }}>
              Comité académico
            </h2>
            <NombresInline nombres={COMITE_ACADEMICO} />
          </div>

          <div>
            <h2 className="section__title" style={{ fontSize: 'clamp(1.1rem, 2vw, 1.6rem)', marginBottom: '1.5rem' }}>
              Comité organizador
            </h2>
            <NombresInline nombres={COMITE_ORGANIZADOR} />
          </div>

        </div>

      </div>
    </main>
  )
}
