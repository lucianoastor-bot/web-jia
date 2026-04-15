'use client'

import Image from 'next/image'
import { useInvitados } from '@/lib/hooks/useInvitados'
import { validarFoto } from '@/lib/utils/formato'

export default function InvitadosLista() {
  const { invitados: todos, loading } = useInvitados()
  const invitados = todos
    .filter(inv => inv.confirmado)
    .sort((a, b) => {
      const apellido = (n: string) => n.trim().split(' ').slice(-1)[0]
      return apellido(a.nombre).localeCompare(apellido(b.nombre), 'es')
    })

  if (loading) return (
    <p style={{ color: 'rgba(35,22,81,0.3)', fontSize: '0.82rem' }}>Cargando...</p>
  )

  return (
    <div className="invitados-pagina__grilla" id="conferencias">
      {invitados.map((inv) => (
            <article key={inv.id} className="invitado-completo">

              <div className="invitado-completo__foto-wrap">
                <Image
                  className="invitado-completo__foto"
                  src={validarFoto(inv.foto)}
                  alt={inv.nombre}
                  width={300}
                  height={300}
                />
              </div>

              <div className="invitado-completo__contenido">
                <div className="invitado-completo__encabezado">
                  <h2 className="invitado-completo__nombre">{inv.nombre}</h2>
                  <p className="invitado-completo__rol">{inv.rol}</p>
                  <p className="invitado-completo__institucion">{inv.institucion}</p>
                  {(inv.linkedin || inv.instagram || inv.web) && (
                    <div className="invitado-completo__links">
                      {inv.linkedin && (
                        <a href={inv.linkedin} target="_blank" rel="noopener noreferrer" className="invitado-completo__link" aria-label="LinkedIn">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                        </a>
                      )}
                      {inv.instagram && (
                        <a href={inv.instagram} target="_blank" rel="noopener noreferrer" className="invitado-completo__link" aria-label="Instagram">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
                        </a>
                      )}
                      {inv.web && (
                        <a href={inv.web} target="_blank" rel="noopener noreferrer" className="invitado-completo__link" aria-label="Sitio web">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                        </a>
                      )}
                    </div>
                  )}
                </div>
                <p className="invitado-completo__bio">{inv.bio}</p>
              </div>

            </article>
          ))}
    </div>
  )
}
