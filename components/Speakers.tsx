// components/Speakers.tsx
'use client'

import Image from 'next/image'
import { useState } from 'react'
import { SPEAKERS, type Speaker } from '@/lib/speakers-data'

export default function Speakers() {
  const [active, setActive] = useState<string | null>(null)

  const toggle = (name: string) => {
    setActive(prev => prev === name ? null : name)
  }

  return (
    <section className="speakers" id="invitados">
      <div className="speakers__inner">
        <h2 className="section__title">Invitados</h2>

        <div className="speakers__grid">
          {SPEAKERS.map((speaker) => (
            <div
              key={speaker.name}
              className={`speaker-card ${active === speaker.name ? 'is-active' : ''}`}
              onClick={() => toggle(speaker.name)}
            >
              {/* Photo */}
              <div className="speaker-card__photo-wrap">
                <Image
                  className="speaker-card__photo"
                  src={speaker.photo}
                  alt={speaker.name}
                  width={400}
                  height={400}
                />
              </div>

              {/* Info base */}
              <div className="speaker-card__info">
                <h3 className="speaker-card__name">{speaker.name}</h3>
                <p className="speaker-card__role">{speaker.role}</p>
                <p className="speaker-card__institution">{speaker.institution}</p>
              </div>

              {/* Overlay — al final para quedar encima */}
              <div className="speaker-card__overlay">
                <p className="speaker-card__bio">{speaker.bio}</p>
                <div className="speaker-card__meta">
                  <span className="speaker-card__meta-item">📅 {speaker.date}</span>
                  <span className="speaker-card__meta-item">🕐 {speaker.time}</span>
                  <span className="speaker-card__meta-item">📍 {speaker.place}</span>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
