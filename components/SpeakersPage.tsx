// components/SpeakersPage.tsx

import Image from 'next/image'
import { SPEAKERS, type Speaker } from '@/lib/speakers-data'

export default function SpeakersPage() {
  return (
    <section className="speakers-page" id="conferencias">
      <div className="speakers-page__inner">

        <h1 className="section__title">Invitados</h1>

        <div className="speakers-page__grid">
          {SPEAKERS.map((speaker) => (
            <article key={speaker.name} className="speaker-full-card">

              {/* Foto */}
              <div className="speaker-full-card__photo-wrap">
                <Image
                  className="speaker-full-card__photo"
                  src={speaker.photo}
                  alt={speaker.name}
                  width={300}
                  height={300}
                />
              </div>

              {/* Contenido */}
              <div className="speaker-full-card__content">
                <div className="speaker-full-card__header">
                  <h2 className="speaker-full-card__name">{speaker.name}</h2>
                  <p className="speaker-full-card__role">{speaker.role}</p>
                  <p className="speaker-full-card__institution">{speaker.institution}</p>
                </div>
                <p className="speaker-full-card__bio">{speaker.bio}</p>
                <div className="speaker-full-card__meta">
                  <span className="speaker-full-card__meta-item">📅 {speaker.date}</span>
                  <span className="speaker-full-card__meta-item">🕐 {speaker.time}</span>
                  <span className="speaker-full-card__meta-item">📍 {speaker.place}</span>
                </div>
              </div>

            </article>
          ))}
        </div>

      </div>
    </section>
  )
}
