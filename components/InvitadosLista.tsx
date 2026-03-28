'use client'

import Image from 'next/image'
import { useInvitados } from '@/lib/hooks/useInvitados'
import { formatearFecha, formatearHora } from '@/lib/utils/formato'

export default function InvitadosLista() {
  const { invitados: todos, loading } = useInvitados()
  const invitados = todos.filter(inv => inv.confirmado)

  if (loading) return (
    <section className="invitados-pagina">
      <div className="invitados-pagina__inner">
        <h1 className="section__title">Invitados</h1>
        <p style={{ color: 'rgba(35,22,81,0.3)', fontSize: '0.82rem' }}>Cargando...</p>
      </div>
    </section>
  )

  return (
    <section className="invitados-pagina" id="conferencias">
      <div className="invitados-pagina__inner">
        <div className="section__eyebrow">Conferencias invitadas</div>
        <h1 className="section__title">Invitados</h1>

        <div className="invitados-pagina__grilla">
          {invitados.map((inv) => (
            <article key={inv.id} className="invitado-completo">

              <div className="invitado-completo__foto-wrap">
                <Image
                  className="invitado-completo__foto"
                  src={inv.foto || '/invitados/placeholder.jpg'}
                  alt={inv.nombre}
                  width={300}
                  height={300}
                  onError={(e) => { (e.target as HTMLImageElement).src = '/invitados/placeholder.jpg' }}
                />
              </div>

              <div className="invitado-completo__contenido">
                <div className="invitado-completo__encabezado">
                  <h2 className="invitado-completo__nombre">{inv.nombre}</h2>
                  <p className="invitado-completo__rol">{inv.rol}</p>
                  <p className="invitado-completo__institucion">{inv.institucion}</p>
                </div>
                <p className="invitado-completo__bio">{inv.bio}</p>
                {(inv.fecha || inv.hora || inv.lugar) && (
                  <div className="invitado-completo__meta">
                    {inv.fecha  && <span className="invitado-completo__meta-item">📅 {formatearFecha(inv.fecha)}</span>}
                    {inv.hora   && <span className="invitado-completo__meta-item">🕐 {formatearHora(inv.hora)}</span>}
                    {inv.lugar  && <span className="invitado-completo__meta-item">📍 {inv.lugar}</span>}
                  </div>
                )}
              </div>

            </article>
          ))}
        </div>

      </div>
    </section>
  )
}
