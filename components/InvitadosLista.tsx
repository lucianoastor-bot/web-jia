'use client'

import { useMemo } from 'react'
import { useInvitados }   from '@/lib/hooks/useInvitados'
import { useActividades } from '@/lib/hooks/useActividades'
import { validarFoto }    from '@/lib/utils/formato'
import type { Actividad } from '@/types'

const COLOR       = '#2374ab'
const BG          = '#eef5fb'
const PLACEHOLDER = '/invitados/placeholder.jpg'

function labelFecha(fecha: string) {
  return new Date(fecha + 'T12:00:00')
    .toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })
}

// ── Componente ────────────────────────────────────────────────

export default function InvitadosLista() {
  const { invitados: todos,  loading: loadInv } = useInvitados()
  const { actividades,       loading: loadAct } = useActividades()

  const invitados = useMemo(() =>
    todos
      .filter(inv => inv.confirmado)
      .sort((a, b) => {
        const apellido = (n: string) => n.trim().split(' ').slice(-1)[0]
        return apellido(a.nombre).localeCompare(apellido(b.nombre), 'es')
      }),
    [todos]
  )

  // Mapa invitadoId → actividades donde aparece (públicas y con horario)
  const actPorInvitado = useMemo(() => {
    const map = new Map<string, Actividad[]>()
    for (const act of actividades) {
      if (act.mostrar === false) continue
      if (!act.fecha || !act.horaInicio)  continue

      const agregar = (id: string) => {
        const arr = map.get(id) ?? []
        if (!arr.find(a => a.id === act.id)) arr.push(act)
        map.set(id, arr)
      }

      // Conferencia / otro: invitadoId directo
      if (act.invitadoId) agregar(act.invitadoId)

      // Panel / otro: participantes con invitadoId
      act.participantes?.forEach(p => { if (p.invitadoId) agregar(p.invitadoId) })
    }
    return map
  }, [actividades])

  if (loadInv || loadAct) return (
    <p style={{ color: 'rgba(35,22,81,0.3)', fontSize: '0.82rem' }}>Cargando...</p>
  )

  return (
    <div className="invitados-pagina__grilla" id="conferencias">
      {invitados.map((inv) => {
        const fotoSrc  = validarFoto(inv.foto) || PLACEHOLDER
        const hayLinks = inv.linkedin || inv.instagram || inv.web || inv.academia || inv.facebook || inv.youtube
        const acts     = (actPorInvitado.get(inv.id) ?? [])
          .sort((a, b) => {
            if (a.fecha !== b.fecha) return (a.fecha ?? '').localeCompare(b.fecha ?? '')
            return (a.horaInicio ?? '').localeCompare(b.horaInicio ?? '')
          })

        return (
          <article
            key={inv.id}
            style={{
              borderLeft: `4px solid ${COLOR}`,
              background: BG,
              borderRadius: '0 8px 8px 0',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            {/* ── Encabezado: foto + nombre/rol/links ── */}
            <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'flex-start' }}>

              {/* Foto circular */}
              <div style={{
                width: 88, height: 88,
                borderRadius: '50%',
                overflow: 'hidden',
                flexShrink: 0,
                border: `2px solid ${COLOR}`,
                background: 'rgba(35,22,81,0.06)',
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={fotoSrc}
                  alt={inv.nombre}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  onError={e => { e.currentTarget.src = PLACEHOLDER }}
                />
              </div>

              {/* Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: 0, flex: 1 }}>
                <h2 style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '1rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: 'var(--c-dark)',
                  margin: 0,
                  lineHeight: 1.2,
                }}>
                  {inv.nombre}
                </h2>

                <p style={{
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: COLOR,
                  margin: 0,
                }}>
                  {inv.rol}{inv.institucion ? ` · ${inv.institucion}` : ''}
                </p>

                {acts.map(act => (
                  <p key={act.id} style={{
                    fontSize: '0.83rem',
                    fontWeight: 500,
                    color: '#111',
                    margin: 0,
                    lineHeight: 1.35,
                    fontStyle: 'italic',
                  }}>
                    {act.titulo}
                  </p>
                ))}

                {hayLinks && (
                  <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                    {inv.linkedin && (
                      <a href={inv.linkedin} target="_blank" rel="noopener noreferrer" className="invitado-completo__link" aria-label="LinkedIn">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                      </a>
                    )}
                    {inv.instagram && (
                      <a href={inv.instagram} target="_blank" rel="noopener noreferrer" className="invitado-completo__link" aria-label="Instagram">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
                      </a>
                    )}
                    {inv.facebook && (
                      <a href={inv.facebook} target="_blank" rel="noopener noreferrer" className="invitado-completo__link" aria-label="Facebook">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>
                      </a>
                    )}
                    {inv.youtube && (
                      <a href={inv.youtube} target="_blank" rel="noopener noreferrer" className="invitado-completo__link" aria-label="YouTube">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                      </a>
                    )}
                    {inv.academia && (
                      <a href={inv.academia} target="_blank" rel="noopener noreferrer" className="invitado-completo__link" aria-label="Academia.edu">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.805 2.003 6.553 16.5H4.5v1.5h6v-1.5H8.91l1.26-3.5h4.665l1.259 3.5H14.5v1.5h6.002v-1.5h-2.053L13.197 2.003h-1.392zm.696 2.45 1.87 5.197h-3.74l1.87-5.197zM5.5 19.5v1.497h13V19.5H5.5z"/></svg>
                      </a>
                    )}
                    {inv.web && (
                      <a href={inv.web} target="_blank" rel="noopener noreferrer" className="invitado-completo__link" aria-label="Sitio web">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ── Agenda de actividades ── */}
            {acts.length > 0 && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.45rem',
                borderTop: `1px solid rgba(35,116,171,0.15)`,
                paddingTop: '0.85rem',
              }}>
                {acts.map(act => (
                  <div key={act.id} style={{ display: 'flex', alignItems: 'baseline', gap: '0.55rem', flexWrap: 'wrap' }}>
                    {/* Fecha */}
                    <span style={{
                      fontSize: '0.75rem',
                      color: 'var(--c-dark)',
                      fontWeight: 500,
                    }}>
                      {labelFecha(act.fecha!)}
                    </span>

                    {/* Hora */}
                    <span style={{ fontSize: '0.75rem', color: '#666' }}>
                      {act.horaInicio}{act.horaFin ? `–${act.horaFin}` : ''}
                    </span>

                    {/* Sala */}
                    {act.sala && (
                      <span style={{ fontSize: '0.72rem', color: COLOR, fontWeight: 600 }}>
                        {act.sala}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* ── Bio ── */}
            {inv.bio && (
              <p style={{
                fontSize: '0.85rem',
                color: '#444',
                lineHeight: 1.7,
                margin: 0,
                borderTop: `1px solid rgba(35,116,171,0.15)`,
                paddingTop: '0.9rem',
              }}>
                {inv.bio}
              </p>
            )}
          </article>
        )
      })}
    </div>
  )
}
