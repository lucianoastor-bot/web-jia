'use client'

import Image from 'next/image'

type Speaker = {
  name: string
  role: string
  institution: string
  bio: string
  photo: string
  date: string
  time: string
  place: string
}

const SPEAKERS: Speaker[] = [
  {
    name: 'Albert Einstein',
    role: 'Físico teórico',
    institution: 'Universidad de Princeton',
    bio: 'Desarrolló la teoría de la relatividad especial y general, transformando nuestra comprensión del espacio, el tiempo y la energía.',
    photo: '/speakers/einstein.png',
    date: '10 de junio',
    time: '18:00 hs',
    place: 'Saleon de Actos',
  },
  {
    name: 'Alan Turing',
    role: 'Matemático y científico de la computación',
    institution: 'Universidad de Cambridge',
    bio: 'Padre de la informática y la inteligencia artificial. Formuló el Test de Turing y sentó las bases teóricas de la computación moderna.',
    photo: '/speakers/turing.png',
    date: '11 de junio',
    time: '18:00 hs',
    place: 'Saleon de Actos',
  },
  {
    name: 'Stephen Hawking',
    role: 'Físico teórico y cosmólogo',
    institution: 'Universidad de Cambridge',
    bio: 'Pionero en el estudio de los agujeros negros y la cosmología. Advirtió tempranamente sobre los riesgos existenciales de la inteligencia artificial.',
    photo: '/speakers/hawking.png',
    date: '11 de junio',
    time: '12:00 hs',
    place: 'Salón de Actos',
  },
  {
    name: 'Homero Simpson',
    role: 'Inspector de seguridad nuclear',
    institution: 'Planta Nuclear de Springfield',
    bio: 'Experto en gestión de riesgos tecnológicos con décadas de experiencia en entornos de alta criticidad. Pensador lateral e innovador involuntario.',
    photo: '/speakers/homero.png',
    date: '12 de junio',
    time: '18:00 hs',
    place: 'Hall de Calle Corrientes',
  },
]

export default function Speakers() {
  return (
    <section className="speakers" id="invitados">
      <div className="speakers__inner">

        <div className="section__eyebrow">Conferencias invitadas</div>
        <h2 className="section__title">Invitados</h2>

        <div className="speakers__grid">
          {SPEAKERS.map((speaker) => (
            <div key={speaker.name} className="speaker-card">

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

              {/* Info */}
              <div className="speaker-card__info">
                <h3 className="speaker-card__name">{speaker.name}</h3>
                <p className="speaker-card__role">{speaker.role}</p>
                <p className="speaker-card__institution">{speaker.institution}</p>
                <p className="speaker-card__bio">{speaker.bio}</p>

                {/* Date / time / place */}
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
