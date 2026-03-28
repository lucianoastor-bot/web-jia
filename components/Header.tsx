'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { CONGRESO } from '@/congreso.config'
import { NAVEGACION } from '@/app.config'

export default function Header() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <nav className="nav" role="navigation" aria-label="Navegación principal">

        {/* Brand */}
        <Link href="/" className="nav__brand">
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
        </Link>

        {/* Desktop links */}
        <ul className="nav__links">
          {NAVEGACION.map((enlace, i) => (
            <React.Fragment key={enlace.href}>
              {i > 0 && <li><span className="nav__sep">·</span></li>}
              <li>
                <Link href={enlace.href} className="nav__link">
                  {enlace.etiqueta}
                </Link>
              </li>
            </React.Fragment>
          ))}
          <li>
            <Link href="/login" className="nav__link nav__link--login">
              Login
            </Link>
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
          <Link
            key={enlace.href}
            href={enlace.href}
            className="nav__link"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            {enlace.etiqueta}
          </Link>
        ))}
        <Link
          href="/login"
          className="nav__link nav__link--login"
          role="menuitem"
          onClick={() => setOpen(false)}
        >
          Login
        </Link>
      </div>
    </>
  )
}
