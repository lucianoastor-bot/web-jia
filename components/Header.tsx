'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

const NAV_LINKS = [
  { href: '/conferencias', label: 'Conferencias' },
  { href: '/programa',     label: 'Programa' },
  { href: '/propuestas',   label: 'Envío de resúmenes' },
  { href: '/organizacion', label: 'Organización' },
  { href: '/contacto',     label: 'Contacto' },
]

export default function Header() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <nav className="nav" role="navigation" aria-label="Navegación principal">

        {/* Brand */}
        <Link href="/" className="nav__brand">
          <Image
            className="nav__brand-logo"
            src="/logo-hya.png"
            alt="HyA UNR"
            width={120}
            height={34}
            priority
          />
          <div className="nav__brand-text">
            <span className="nav__brand-title">La IA en Debate</span>
            <span className="nav__brand-sub">FHyA · UNR · 2026</span>
          </div>
        </Link>

        {/* Desktop links */}
        <ul className="nav__links">
          {NAV_LINKS.map((link, i) => (
            <React.Fragment key={link.href}>
              {i > 0 && <li><span className="nav__sep">·</span></li>}
              <li>
                <Link href={link.href} className="nav__link">
                  {link.label}
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
        {NAV_LINKS.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className="nav__link"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            {link.label}
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
