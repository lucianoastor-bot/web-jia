'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navLinks = [
  { href: '/conferencias',    label: 'Conferencias' },
  { href: '/programa',        label: 'Programa' },
  { href: '/call-for-papers', label: 'Call for Papers' },
  { href: '/organizacion',    label: 'Organización' },
  { href: '/contacto',        label: 'Contacto' },
]

export default function Header() {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const pathname = usePathname()

  return (
    <>
      <header className="header">

        {/* Logo texto */}
        <Link href="/" className="header-logo">
          <img src="/logo-hya-azul.png" alt="" />
          <span className="header-logo-texto">
            La IA en Debate
            <span>FHyA · UNR · 2026</span>
          </span>
        </Link>

        {/* Nav desktop */}
        <ul className="header-nav">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={pathname === link.href ? 'activo' : ''}
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/login" className="header-btn-login">
              Login
            </Link>
          </li>
        </ul>

        {/* Botón hamburger */}
        <button
          className="header-hamburger"
          onClick={() => setMenuAbierto(!menuAbierto)}
          aria-label="Menú"
        >
          <span className="hamburger-line" />
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </button>

      </header>

      {/* Menú móvil */}
      {menuAbierto && (
        <nav className="header-nav-mobile">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={pathname === link.href ? 'activo' : ''}
              onClick={() => setMenuAbierto(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="header-btn-login-mobile"
            onClick={() => setMenuAbierto(false)}
          >
            Login
          </Link>
        </nav>
      )}
    </>
  )
}
