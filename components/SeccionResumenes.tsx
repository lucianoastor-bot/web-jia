// components/SeccionResumenes.tsx
// Versión reducida para el home: timeline + CTA. El detalle completo está en /propuestas.

import PlazoTimeline from '@/components/PlazoTimeline'
import { CONGRESO } from '@/congreso.config'

export default function SeccionResumenes() {
  return (
    <section className="section" id="resumenes">
      <div className="section__eyebrow">Envío de Resúmenes</div>
      <h2 className="section__title">Presentá tu propuesta</h2>
      <p className="section__body" style={{ marginTop: '1rem' }}>
        La convocatoria está abierta hasta el {CONGRESO.plazoResumenes}.
        Se aceptan ponencias, paneles, relatos de experiencia y pósters.
      </p>
      <div style={{ margin: '2.5rem 0' }}>
        <PlazoTimeline />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
        <a
          href={CONGRESO.formularioResumenes}
          className="btn btn--primary"
          target="_blank"
          rel="noopener noreferrer"
        >
          Formulario de envío →
        </a>
        <a href="/propuestas" style={{ fontSize: '0.85rem', color: 'var(--c-mid)', letterSpacing: '0.04em' }}>
          Ver pautas completas
        </a>
      </div>
    </section>
  )
}
