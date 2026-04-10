// components/SeccionResumenes.tsx
// Versión reducida para el home: timeline + CTA. El detalle completo está en /propuestas.

import PlazoTimeline from '@/components/PlazoTimeline'
import { CONGRESO } from '@/congreso.config'

export default function SeccionResumenes() {
  return (
    <section className="section" id="resumenes">
      <h2 className="section__title" style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}>Envía tu propuesta</h2>
      <p className="section__body" style={{ marginTop: '1rem', fontSize: '1.5rem' }}>
        La convocatoria está abierta hasta el {CONGRESO.plazoResumenes}. Se aceptan ponencias de investigación, relatos de experiencia, paneles y pósters.
      </p>
      <div style={{ margin: '2.5rem 0' }}>
        <PlazoTimeline />
      </div>
      <a href="/propuestas" className="btn btn--primary">
        Envío de Resúmenes →
      </a>
    </section>
  )
}
