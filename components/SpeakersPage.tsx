'use client'

import Image from 'next/image'
import { useInvitados } from '@/lib/useInvitados'

export default function SpeakersPage() {
  const { invitados, loading } = useInvitados()

  if (loading) return (
    <section className="speakers-page">
      <div className="speakers-page__inner">
        <div className="section__eyebrow">Conferencias invitadas</div>
        <h1 className="section__title">Invitados</h1>
        <p style={{ color: 'rgba(35,22,81,0.3)', fontSize: '0.82rem' }}>Cargando...</p>
      </div>
    </section>
  )

  return (
    <section className="speakers-page" id="conferencias">
      <div className="speakers-page__inner">
        <div className="section__eyebrow">Conferencias invitadas</div>
        <h1 className="section__title">Invitados</h1>

        <div className="speakers-page__grid">
          {invitados.map((inv) => (
            <article key={inv.id} className="speaker-full-card">

              <div className="speaker-full-card__photo-wrap">
                <Image
                  className="speaker-full-card__photo"
                  src={inv.foto || '/speakers/placeholder.jpg'}
                  alt={inv.nombre}
                  width={300}
                  height={300}
                />
              </div>

              <div className="speaker-full-card__content">
                <div className="speaker-full-card__header">
                  <h2 className="speaker-full-card__name">{inv.nombre}</h2>
                  <p className="speaker-full-card__role">{inv.rol}</p>
                  <p className="speaker-full-card__institution">{inv.institucion}</p>
                </div>
                <p className="speaker-full-card__bio">{inv.bio}</p>
                <div className="speaker-full-card__meta">
                  <span className="speaker-full-card__meta-item">📅 {inv.fecha}</span>
                  <span className="speaker-full-card__meta-item">🕐 {inv.hora}</span>
                  <span className="speaker-full-card__meta-item">📍 {inv.lugar}</span>
                </div>
              </div>

            </article>
          ))}
        </div>

      </div>
    </section>
  )
}