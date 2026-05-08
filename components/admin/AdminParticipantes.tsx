// components/admin/AdminParticipantes.tsx
'use client'

import { useMemo, useState } from 'react'
import { useInvitados }  from '@/lib/hooks/useInvitados'
import { usePropuestas } from '@/lib/hooks/usePropuestas'
import { COORDINADORES, COMITE_ORGANIZADOR, COMITE_ACADEMICO } from '@/congreso.config'

// ── Tipos ─────────────────────────────────────────────────────

type Persona = {
  nombre:     string
  email:      string
  dni:        string
  categorias: string[]
}

// ── Orden canónico de categorías ──────────────────────────────

const CATEGORIAS_ORDEN = [
  'Coordinación',
  'Comité Organizador',
  'Comité Académico',
  'Invitado/a',
  'Participante',
  'Voluntario/a',
] as const

// ── Estilos de badge por categoría ────────────────────────────

const CATEGORIA_STYLE: Record<string, { bg: string; color: string }> = {
  'Coordinación':       { bg: 'rgba(35,22,81,0.82)',    color: '#fff'    },
  'Comité Organizador': { bg: 'rgba(35,116,171,0.14)',  color: '#1a5a8a' },
  'Comité Académico':   { bg: 'rgba(58,116,171,0.10)',  color: '#2a5580' },
  'Invitado/a':         { bg: 'rgba(77,204,189,0.18)',  color: '#1a8c7e' },
  'Participante':       { bg: 'rgba(200,150,50,0.12)',  color: '#8c6520' },
  'Voluntario/a':       { bg: 'rgba(100,180,100,0.14)', color: '#3a7a3a' },
}

// ── Helpers ───────────────────────────────────────────────────

const clave     = (n: string) => n.trim().toLowerCase().replace(/\s+/g, ' ')
const apellidoDe = (n: string) => n.trim().split(/\s+/).slice(-1)[0]

// ── Componente ────────────────────────────────────────────────

export default function AdminParticipantes() {
  const { invitados,  loading: loadInv  } = useInvitados()
  const { propuestas, loading: loadProp } = usePropuestas()

  const [filtro, setFiltro] = useState<string>('todas')

  // ── Construcción del listado unificado ────────────────────

  const personas = useMemo(() => {
    const map = new Map<string, Persona>()

    const agregar = (nombre: string, categoria: string, email = '', dni = '') => {
      if (!nombre.trim()) return
      const k = clave(nombre)
      if (map.has(k)) {
        const p = map.get(k)!
        if (!p.categorias.includes(categoria)) p.categorias.push(categoria)
        if (!p.email && email) p.email = email
        if (!p.dni   && dni)   p.dni   = dni
      } else {
        map.set(k, { nombre: nombre.trim(), email, dni, categorias: [categoria] })
      }
    }

    // Organización (solo nombre, desde config)
    COORDINADORES    .forEach(n => agregar(n, 'Coordinación'))
    COMITE_ORGANIZADOR.forEach(n => agregar(n, 'Comité Organizador'))
    COMITE_ACADEMICO  .forEach(n => agregar(n, 'Comité Académico'))

    // Invitados (email opcional en el tipo)
    invitados.forEach(inv => agregar(inv.nombre, 'Invitado/a', inv.email ?? ''))

    // Participantes de propuestas: autor, coautores, participantes de panel
    propuestas.forEach(p => {
      agregar(p.autor.nombre, 'Participante', p.autor.email, p.autor.documento)
      ;(p.coautores   ?? []).forEach(c  => agregar(c.nombre,  'Participante', c.email,  c.documento))
      ;(p.participantes ?? []).forEach(pa => agregar(pa.nombre, 'Participante', pa.email, pa.documento))
    })

    // Voluntarios — sin datos aún; se completará desde Firestore en próxima iteración

    return [...map.values()].sort((a, b) =>
      apellidoDe(a.nombre).localeCompare(apellidoDe(b.nombre), 'es')
    )
  }, [invitados, propuestas])

  const filtradas = filtro === 'todas'
    ? personas
    : personas.filter(p => p.categorias.includes(filtro))

  const conteos = useMemo(() =>
    Object.fromEntries(
      CATEGORIAS_ORDEN.map(cat => [
        cat,
        personas.filter(p => p.categorias.includes(cat)).length,
      ])
    ),
    [personas]
  )

  // ── Render ────────────────────────────────────────────────

  if (loadInv || loadProp) return (
    <div className="admin-module">
      <h2 className="admin-module__title">Participantes</h2>
      <p style={{ color: 'rgba(35,22,81,0.3)', fontSize: '0.82rem' }}>Cargando...</p>
    </div>
  )

  return (
    <div className="admin-module">

      <h2 className="admin-module__title">
        Participantes ({filtradas.length}{filtro !== 'todas' ? ` de ${personas.length}` : ''})
      </h2>

      {/* Filtros por categoría */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <button
          className={`admin-btn ${filtro === 'todas' ? 'admin-btn--primary' : 'admin-btn--ghost'}`}
          style={{ fontSize: '0.78rem', padding: '0.2rem 0.7rem' }}
          onClick={() => setFiltro('todas')}
        >
          Todas ({personas.length})
        </button>
        {CATEGORIAS_ORDEN.map(cat => (
          <button
            key={cat}
            className={`admin-btn ${filtro === cat ? 'admin-btn--primary' : 'admin-btn--ghost'}`}
            style={{ fontSize: '0.78rem', padding: '0.2rem 0.7rem' }}
            onClick={() => setFiltro(cat)}
          >
            {cat} ({conteos[cat]})
          </button>
        ))}
      </div>

      {/* Listado */}
      <div className="admin-list">
        {filtradas.length === 0 && (
          <p className="admin-list__empty">Sin personas en esta categoría.</p>
        )}
        {filtradas.map((p, i) => (
          <div key={i} className="admin-list__item">

            <div className="admin-list__item-info" style={{ flex: 1 }}>
              <p className="admin-list__item-name">{p.nombre}</p>
              {(p.email || p.dni) && (
                <p className="admin-list__item-sub" style={{ fontSize: '0.8rem', fontWeight: 500 }}>
                  {[p.email, p.dni ? `DNI ${p.dni}` : ''].filter(Boolean).join('  ·  ')}
                </p>
              )}
            </div>

            {/* Badges de categoría, en orden canónico */}
            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', justifyContent: 'flex-end', flexShrink: 0 }}>
              {[...p.categorias]
                .sort((a, b) => CATEGORIAS_ORDEN.indexOf(a as typeof CATEGORIAS_ORDEN[number]) - CATEGORIAS_ORDEN.indexOf(b as typeof CATEGORIAS_ORDEN[number]))
                .map(cat => {
                  const s = CATEGORIA_STYLE[cat] ?? { bg: 'rgba(35,22,81,0.07)', color: 'rgba(35,22,81,0.6)' }
                  return (
                    <span
                      key={cat}
                      style={{
                        fontSize:      '0.62rem',
                        fontWeight:    600,
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        padding:       '2px 8px',
                        borderRadius:  10,
                        background:    s.bg,
                        color:         s.color,
                        whiteSpace:    'nowrap',
                      }}
                    >
                      {cat}
                    </span>
                  )
                })}
            </div>

          </div>
        ))}
      </div>

    </div>
  )
}
