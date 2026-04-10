// components/SeccionOrganizacion.tsx
// Sección de organización para el home. La página /organizacion puede usar este componente.

import { COORDINADORES, COMITE_ORGANIZADOR, COMITE_ACADEMICO } from '@/congreso.config'

export default function SeccionOrganizacion() {
  return (
    <section className="section" id="organizacion">
      <div className="section__eyebrow">Organización</div>
      <h2 className="section__title">El equipo</h2>

      <div style={{ display: 'flex', gap: '4rem', marginTop: '2.5rem', flexWrap: 'wrap' }}>

        <div>
          <p style={{ fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--c-mid)', fontWeight: 500, marginBottom: '1rem' }}>
            Coordinación
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {COORDINADORES.map(n => (
              <li key={n} style={{ fontSize: '1.05rem', color: '#444', borderBottom: '1px solid rgba(35,22,81,0.06)', paddingBottom: '0.5rem' }}>
                {n}
              </li>
            ))}
          </ul>
        </div>

        <div style={{ maxWidth: '520px' }}>
          <p style={{ fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--c-mid)', fontWeight: 500, marginBottom: '1rem' }}>
            Comité organizador
          </p>
          <p style={{ fontSize: '1rem', color: '#444', lineHeight: 1.9 }}>
            {COMITE_ORGANIZADOR.join(' · ')}
          </p>
        </div>

        {COMITE_ACADEMICO.length > 0 && (
          <div style={{ maxWidth: '520px' }}>
            <p style={{ fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--c-mid)', fontWeight: 500, marginBottom: '1rem' }}>
              Comité académico
            </p>
            <p style={{ fontSize: '1rem', color: '#444', lineHeight: 1.9 }}>
              {COMITE_ACADEMICO.join(' · ')}
            </p>
          </div>
        )}

      </div>
    </section>
  )
}
