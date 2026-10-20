// app/page.tsx
// Landing provisoria: el sitio 2026 quedó archivado en /archivo/2026 y la
// edición 2027 está en preparación.

import { CONGRESO } from '@/congreso.config'

export default function Home() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--c-dark)',
        color: 'var(--c-white)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* Barra superior: login */}
      <header style={{ display: 'flex', justifyContent: 'flex-end', padding: '1.5rem 8vw' }}>
        <a
          href="/login"
          style={{
            color: 'var(--c-white)',
            textDecoration: 'none',
            fontSize: '0.8rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            fontWeight: 500,
            opacity: 0.7,
          }}
        >
          Login
        </a>
      </header>

      {/* Contenido central */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: '2rem',
          padding: '1rem 8vw',
        }}
      >
        <div style={{ maxWidth: '760px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <p
            style={{
              fontSize: 'clamp(1.2rem, 3vw, 1.7rem)',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: 'var(--c-turq)',
              fontWeight: 500,
              margin: 0,
            }}
          >
            Jornadas
          </p>

          <h1
            style={{
              fontSize: 'clamp(2rem, 6vw, 3.5rem)',
              lineHeight: 1.1,
              fontWeight: 700,
              margin: 0,
            }}
          >
            La Inteligencia Artificial en debate
          </h1>

          <p
            style={{
              fontSize: 'clamp(1.1rem, 2.5vw, 1.5rem)',
              color: 'rgba(255,255,255,0.75)',
              margin: 0,
            }}
          >
            Ya estamos trabajando en las de 2027
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
          <a
            href="/archivo/2026/index.html"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.9rem 1.8rem',
              background: 'var(--c-turq)',
              color: 'var(--c-dark)',
              fontWeight: 700,
              fontSize: '1rem',
              textDecoration: 'none',
              borderRadius: '2px',
            }}
          >
            Jornadas 2026 →
          </a>

          {/* Instagram + contacto */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem', marginTop: '0.25rem' }}>
            <a
              href={CONGRESO.instagram}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                color: 'var(--c-white)',
                textDecoration: 'none',
                opacity: 0.85,
                fontSize: '0.95rem',
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
              </svg>
              @jornadas.ia
            </a>

            <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.7)', margin: 0 }}>
              Contacto:{' '}
              <a
                href="mailto:ia.jornadas.hya@gmail.com"
                style={{ color: 'var(--c-turq)', textDecoration: 'none' }}
              >
                ia.jornadas.hya@gmail.com
              </a>
            </p>
          </div>
        </div>
      </main>

      {/* Logos institucionales — igual que el footer 2026 */}
      <footer
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '2.5rem',
          padding: '2.5rem 8vw',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-upar.png"
          alt="Universidad Nacional de Rosario"
          style={{ height: '48px', width: 'auto' }}
        />
        <a href={CONGRESO.urlInstitucion} target="_blank" rel="noopener noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-hya.png"
            alt={`${CONGRESO.institucion} — ${CONGRESO.universidad}`}
            style={{ height: '48px', width: 'auto', display: 'block' }}
          />
        </a>
      </footer>
    </div>
  )
}
