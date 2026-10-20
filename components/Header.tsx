'use client'

import React from 'react'
import Image from 'next/image'
import { useState } from 'react'
import { CONGRESO } from '@/congreso.config'
import { NAVEGACION } from '@/app.config'

// ARCHIVO 2026: el sitio se publica bajo /archivo/2026, servido como estático
// desde una subcarpeta del sitio principal. Para evitar que el router SPA de
// Next duplique el basePath al navegar, TODA la navegación interna usa anclas
// normales (<a>, recarga completa) con la URL absoluta del archivo.
const BASE = '/archivo/2026'

function archivoHref(href: string): string {
  if (href.startsWith('http')) return href                 // externo (ej: Instagram)
  if (href.startsWith('/#'))   return `${BASE}/${href.slice(1)}` // /#organizacion → /archivo/2026/#organizacion
  return `${BASE}${href}/`                                   // /invitados → /archivo/2026/invitados/
}

const InstagramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
  </svg>
)

export default function Header() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <nav className="nav" role="navigation" aria-label="Navegación principal">

        {/* Brand */}
        <a href={`${BASE}/`} className="nav__brand">
          <Image
            className="nav__brand-logo"
            src={CONGRESO.logoPath}
            alt={CONGRESO.siglas}
            width={120}
            height={34}
            priority
          />
          <div className="nav__brand-text">
            <span className="nav__brand-title">{CONGRESO.nombreCorto}</span>
            <span className="nav__brand-sub">{CONGRESO.siglas} · {CONGRESO.anio}</span>
          </div>
        </a>

        {/* Desktop links */}
        <ul className="nav__links">
          {NAVEGACION.map((enlace, i) => (
            <React.Fragment key={enlace.href}>
              {i > 0 && <li><span className="nav__sep">·</span></li>}
              <li>
                <a
                  href={archivoHref(enlace.href)}
                  className="nav__link"
                  {...(enlace.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  {enlace.etiqueta}
                </a>
              </li>
            </React.Fragment>
          ))}
          <li>
            <a
              href={CONGRESO.instagram}
              className="nav__link nav__link--icon"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram de las Jornadas"
            >
              <InstagramIcon />
            </a>
          </li>
        </ul>

        {/* Mobile menu button */}
        <button
          className="nav__menu-btn"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
        >
          <span />
          <span />
          <span />
        </button>
      </nav>

      {/* Mobile drawer */}
      <div className={`nav__drawer ${open ? 'is-open' : ''}`} role="menu">
        {NAVEGACION.map(enlace => (
          <a
            key={enlace.href}
            href={archivoHref(enlace.href)}
            className="nav__link"
            role="menuitem"
            onClick={() => setOpen(false)}
            {...(enlace.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            {enlace.etiqueta}
          </a>
        ))}
        <a
          href={CONGRESO.instagram}
          className="nav__link nav__link--icon"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram de las Jornadas"
          onClick={() => setOpen(false)}
        >
          <InstagramIcon />
          Instagram
        </a>
      </div>
    </>
  )
}
