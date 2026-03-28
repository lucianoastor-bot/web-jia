import type { Metadata } from 'next'
import InvitadosLista from '@/components/InvitadosLista'
import { CONGRESO } from '@/congreso.config'

export const metadata: Metadata = {
  title: `Invitados — ${CONGRESO.nombreCorto}`,
  description: `Conferencias invitadas. ${CONGRESO.nombre}, ${CONGRESO.siglas} — ${CONGRESO.anio}.`,
}

export default function Invitados() {
  return (
    <main className="page">
      <section className="invitados-pagina">
        <div className="invitados-pagina__inner">
          <div className="section__eyebrow">Keynote Speakers</div>
          <h1 className="section__title">Invitados</h1>
          <InvitadosLista />
        </div>
      </section>
    </main>
  )
}
