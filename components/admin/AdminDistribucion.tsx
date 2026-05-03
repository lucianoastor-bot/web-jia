// components/admin/AdminDistribucion.tsx
'use client'

import { useMemo } from 'react'
import { useActividades } from '@/lib/hooks/useActividades'
import { usePropuestas } from '@/lib/hooks/usePropuestas'
import { PROPUESTAS_COMPATIBLES, RESTRICCIONES_ACTIVIDAD, TIPOS_PROPUESTA, EJES } from '@/congreso.config'
import type { Actividad, Propuesta } from '@/types'

// ── Helpers ───────────────────────────────────────────────────

function maxDe(tipo: string): number | null {
  const r = RESTRICCIONES_ACTIVIDAD[tipo as keyof typeof RESTRICCIONES_ACTIVIDAD]
  return r && 'maxPropuestas' in r ? r.maxPropuestas : null
}

function minDe(tipo: string): number | null {
  const r = RESTRICCIONES_ACTIVIDAD[tipo as keyof typeof RESTRICCIONES_ACTIVIDAD]
  return r && 'minPropuestas' in r ? r.minPropuestas : null
}

function etiquetaTipo(tipo: string) {
  return TIPOS_PROPUESTA.find(t => t.valor === tipo)?.etiqueta ?? tipo
}

function etiquetaEje(num: string) {
  return EJES.find(e => e.num === num)?.titulo ?? num
}

function formatHorario(act: Actividad) {
  const partes = [
    act.fecha,
    act.horaInicio && act.horaFin ? `${act.horaInicio}–${act.horaFin}` : act.horaInicio,
    act.sala,
  ].filter(Boolean)
  return partes.join(' · ') || null
}

// ── Subcomponentes ────────────────────────────────────────────

function BarraProgreso({ actual, max, min }: { actual: number; max: number | null; min: number | null }) {
  if (!max) return null
  const pct     = Math.min(100, (actual / max) * 100)
  const completo = min !== null && actual >= min
  const color    = actual === 0 ? 'rgba(35,22,81,0.12)' : completo ? '#4dccbd' : '#e8a23a'

  return (
    <div style={{ marginTop: '0.6rem' }}>
      <div style={{ height: 4, background: 'rgba(35,22,81,0.08)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 0.3s' }} />
      </div>
      <p style={{ fontSize: '0.68rem', color: 'rgba(35,22,81,0.4)', marginTop: '0.3rem', textAlign: 'right' }}>
        {actual} / {max}{min !== null && actual < min ? ` · mín ${min}` : ''}
      </p>
    </div>
  )
}

function TarjetaActividad({ act, propuestas }: { act: Actividad; propuestas: Propuesta[] }) {
  const asignadas = propuestas.filter(p => p.actividadId === act.id)
  const max       = maxDe(act.tipo)
  const min       = minDe(act.tipo)
  const vacia     = asignadas.length === 0
  const horario   = formatHorario(act)

  const tipoLabel = act.tipo === 'otro' && act.descriptor
    ? act.descriptor
    : TIPOS_PROPUESTA.find(t => t.valor === act.tipo)?.etiqueta ?? act.tipo

  return (
    <div style={{
      background: 'var(--c-white)',
      border: vacia
        ? '1.5px dashed rgba(35,22,81,0.2)'
        : '1px solid rgba(35,22,81,0.08)',
      padding: '1.1rem 1.3rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
    }}>
      {/* Cabecera */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--c-dark)', lineHeight: 1.3 }}>
            {act.titulo || <span style={{ opacity: 0.35 }}>(sin título)</span>}
          </p>
          {horario && (
            <p style={{ fontSize: '0.72rem', color: 'rgba(35,22,81,0.45)', marginTop: '0.2rem' }}>
              {horario}
            </p>
          )}
        </div>
        <span className="admin-badge admin-badge--pending" style={{ flexShrink: 0, marginLeft: 0 }}>
          {tipoLabel}
        </span>
      </div>

      {/* Barra de progreso */}
      <BarraProgreso actual={asignadas.length} max={max} min={min} />

      {/* Lista de propuestas asignadas */}
      {asignadas.length > 0 ? (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.25rem' }}>
          {asignadas.map(p => (
            <li key={p.id} style={{
              fontSize: '0.78rem',
              padding: '0.45rem 0.65rem',
              background: 'rgba(35,22,81,0.03)',
              borderLeft: '2px solid rgba(77,204,189,0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.1rem',
            }}>
              <span style={{ fontWeight: 600, color: 'var(--c-dark)' }}>{p.titulo}</span>
              <span style={{ color: 'rgba(35,22,81,0.5)' }}>
                {p.autor.nombre}
                {p.autor.institucion && ` · ${p.autor.institucion}`}
                {' · '}
                <span style={{ fontWeight: 500 }}>Eje {p.eje}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ fontSize: '0.75rem', color: 'rgba(35,22,81,0.3)', fontStyle: 'italic', textAlign: 'center', padding: '0.75rem 0' }}>
          Sin propuestas asignadas
        </p>
      )}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────

export default function AdminDistribucion() {
  const { actividades, loading: loadAct } = useActividades()
  const { propuestas, loading: loadProp } = usePropuestas()

  // Solo actividades que agrupan propuestas (panel, mesa, pósters, y 'otro' con restricción)
  const actividadesConPropuestas = useMemo(() =>
    actividades.filter(a => PROPUESTAS_COMPATIBLES[a.tipo] || a.tipo === 'otro'),
    [actividades]
  )

  // Propuestas aceptadas sin actividad asignada
  const sinAsignar = useMemo(() =>
    propuestas.filter(p => p.estado === 'aceptada' && !p.actividadId),
    [propuestas]
  )

  // Agrupar sin asignar por tipo
  const sinAsignarPorTipo = useMemo(() => {
    const grupos: Record<string, Propuesta[]> = {}
    for (const p of sinAsignar) {
      if (!grupos[p.tipo]) grupos[p.tipo] = []
      grupos[p.tipo].push(p)
    }
    return grupos
  }, [sinAsignar])

  // Stats
  const totalAsignadas = propuestas.filter(p => p.estado === 'aceptada' && p.actividadId).length
  const totalAceptadas = propuestas.filter(p => p.estado === 'aceptada').length

  if (loadAct || loadProp) return (
    <div className="admin-module">
      <h2 className="admin-module__title">Distribución</h2>
      <p style={{ color: 'rgba(35,22,81,0.3)', fontSize: '0.82rem' }}>Cargando...</p>
    </div>
  )

  return (
    <div className="admin-module">

      {/* ── Título y resumen ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2rem', paddingBottom: '0.75rem', borderBottom: '2px solid var(--c-turq)' }}>
        <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '1rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--c-dark)', margin: 0 }}>
          Distribución
        </h2>
        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.75rem', color: 'rgba(35,22,81,0.5)' }}>
          <span><strong style={{ color: 'var(--c-dark)' }}>{actividadesConPropuestas.length}</strong> actividades</span>
          <span><strong style={{ color: '#4dccbd' }}>{totalAsignadas}</strong> / {totalAceptadas} propuestas asignadas</span>
          {sinAsignar.length > 0 && (
            <span style={{ color: '#e8a23a', fontWeight: 600 }}>{sinAsignar.length} sin asignar</span>
          )}
        </div>
      </div>

      {/* ── Grid de actividades ── */}
      {actividadesConPropuestas.length === 0 ? (
        <p className="admin-list__empty">No hay actividades que agrupen propuestas.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          {actividadesConPropuestas.map(act => (
            <TarjetaActividad key={act.id} act={act} propuestas={propuestas} />
          ))}
        </div>
      )}

      {/* ── Propuestas sin asignar ── */}
      <div style={{ marginTop: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', marginBottom: '1.25rem', paddingBottom: '0.6rem', borderBottom: '1px solid rgba(35,22,81,0.08)' }}>
          <h3 style={{ fontFamily: 'var(--font-sans)', fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(35,22,81,0.5)', margin: 0 }}>
            Sin asignar
          </h3>
          {sinAsignar.length === 0
            ? <span style={{ fontSize: '0.75rem', color: '#4dccbd', fontWeight: 600 }}>✓ Todas asignadas</span>
            : <span style={{ fontSize: '0.75rem', color: '#e8a23a', fontWeight: 600 }}>{sinAsignar.length} pendientes</span>
          }
        </div>

        {sinAsignar.length === 0 ? null : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {Object.entries(sinAsignarPorTipo).map(([tipo, props]) => (
              <div key={tipo}>
                <p style={{ fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(35,22,81,0.4)', marginBottom: '0.6rem' }}>
                  {etiquetaTipo(tipo)} ({props.length})
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {props.map(p => (
                    <div key={p.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.6rem 1rem',
                      background: 'var(--c-white)',
                      border: '1px solid rgba(35,22,81,0.08)',
                      gap: '1rem',
                    }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--c-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.titulo}
                        </p>
                        <p style={{ fontSize: '0.7rem', color: 'rgba(35,22,81,0.45)', marginTop: '0.1rem' }}>
                          {p.autor.nombre}
                          {p.autor.institucion && ` · ${p.autor.institucion}`}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, alignItems: 'center' }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'rgba(35,22,81,0.5)', whiteSpace: 'nowrap' }}>
                          Eje {p.eje}
                        </span>
                        <span className="admin-badge admin-badge--revision" style={{ marginLeft: 0 }}>
                          {etiquetaEje(p.eje).split(' ').slice(0, 3).join(' ')}…
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
