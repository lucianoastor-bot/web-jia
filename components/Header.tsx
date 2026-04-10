'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { CONGRESO } from '@/congreso.config'
import { NAVEGACION } from '@/app.config'

export default function Header() {
  const [open, setOpen]   = useState(false)
  const router            = useRouter()
  const pathname          = usePathname()

  // Navegación a secciones del home via hash.
  // Si ya estamos en /, hace scrollIntoView directo.
  // Si venimos de otra página, navega sin scroll y luego desplaza al elemento.
  const handleHashNav = useCallback((e: React.MouseEvent, href: string) => {
    e.preventDefault()
    const id = href.replace('/#', '')
    setOpen(false)

    const scrollToEl = () => {
      const el = document.getElementById(id)
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }

    if (pathname === '/') {
      scrollToEl()
    } else {
      router.push('/', { scroll: false })
      // Espera a que el home renderice antes de desplazar
      setTimeout(scrollToEl, 400)
    }
  }, [pathname, router])

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
                {enlace.href.startsWith('/#')
                  ? <a href={enlace.href} className="nav__link" onClick={e => handleHashNav(e, enlace.href)}>
                      {enlace.etiqueta}
                    </a>
                  : <Link href={enlace.href} className="nav__link">
                      {enlace.etiqueta}
                    </Link>
                }
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
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <circle cx="12" cy="12" r="4"/>
                <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
              </svg>
            </a>
          </li>
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
          enlace.href.startsWith('/#')
            ? <a
                key={enlace.href}
                href={enlace.href}
                className="nav__link"
                role="menuitem"
                onClick={e => handleHashNav(e, enlace.href)}
              >
                {enlace.etiqueta}
              </a>
            : <Link
                key={enlace.href}
                href={enlace.href}
                className="nav__link"
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                {enlace.etiqueta}
              </Link>
        ))}
        <a
          href={CONGRESO.instagram}
          className="nav__link nav__link--icon"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram de las Jornadas"
          onClick={() => setOpen(false)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
            <circle cx="12" cy="12" r="4"/>
            <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
          </svg>
          Instagram
        </a>
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
