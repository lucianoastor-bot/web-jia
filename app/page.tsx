import Hero from '@/components/Hero'
import Ejes from '@/components/Ejes'
import InvitadosCarrusel from '@/components/InvitadosCarrusel'
import Noticias from '@/components/Noticias'
import { CONGRESO } from '@/congreso.config'

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'EducationEvent',
  name: CONGRESO.nombre,
  description: `Jornadas académicas sobre inteligencia artificial organizadas por la ${CONGRESO.institucion} de la ${CONGRESO.universidad}.`,
  startDate: '2026-06-10T09:00:00-03:00',
  endDate: '2026-06-12T20:00:00-03:00',
  eventStatus: 'https://schema.org/EventScheduled',
  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  location: {
    '@type': 'Place',
    name: `${CONGRESO.institucion} — ${CONGRESO.universidad}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Entre Ríos 758',
      addressLocality: 'Rosario',
      addressRegion: 'Santa Fe',
      addressCountry: 'AR',
    },
  },
  organizer: {
    '@type': 'Organization',
    name: `${CONGRESO.institucion}, ${CONGRESO.universidad}`,
    url: CONGRESO.urlInstitucion,
  },
  url: CONGRESO.url,
  image: `${CONGRESO.url}/og.png`,
}

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main>
        <Hero />
        <div className="content" id="contenido">
          <InvitadosCarrusel />
          <Noticias />
          <Ejes />
        </div>
      </main>
    </>
  )
}
