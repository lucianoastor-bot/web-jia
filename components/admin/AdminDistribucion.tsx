// components/admin/AdminDistribucion.tsx
'use client'

import { useMemo, useState, Fragment } from 'react'
import { useActividades } from '@/lib/hooks/useActividades'
import { usePropuestas }  from '@/lib/hooks/usePropuestas'
import { useInvitados }   from '@/lib/hooks/useInvitados'
import { CONGRESO }       from '@/congreso.config'
import type { Actividad, Propuesta } from '@/types'

// ── Constantes de grilla ──────────────────────────────────────

const FECHAS_JORNADA = [0, 1, 2].map(d => {
  const ms      = CONGRESO.fechaInicio.getTime() + d * 86_400_000
  const valor   = new Date(ms).toISOString().slice(0, 10)
  const etiqueta = new Date(valor + 'T12:00:00')
    .toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
    .toUpperCase()
  return { valor, etiqueta }
})

const DAY_START  = '08:00'
const DAY_END    = '21:00'
const PX_PER_MIN = 0.85     // px por minuto → 1 hora = 51 px
const HORA_LABELS = Array.from({ length: 14 }, (_, i) => `${String(8 + i).padStart(2, '0')}:00`)

function toMin(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}
const TOP_TOTAL  = (toMin(DAY_END) - toMin(DAY_START)) * PX_PER_MIN  // 780 * 1.2 = 936 px
const timeToTop  = (t: string) => (toMin(t) - toMin(DAY_START)) * PX_PER_MIN
const timeToPx   = (inicio: string, fin: string) => (toMin(fin) - toMin(inicio)) * PX_PER_MIN

// ── Helpers de presentación ───────────────────────────────────

const TYPE_COLOR: Record<string, string> = {
  conferencia: '#4dccbd',
  panel:       '#7c5cbf',
  mesa:        '#e8a23a',
  pósters:     '#3a74ab',
  otro:        '#888',
}

function tipoColor(tipo: string) { return TYPE_COLOR[tipo] ?? '#888' }

function tipoLabel(act: Actividad): string {
  if (act.tipo === 'otro' && act.descriptor) return act.descriptor
  const L: Record<string, string> = {
    conferencia: 'Conferencia',
    panel:       'Panel',
    mesa:        'Mesa',
    pósters:     'Pósters',
    otro:        'Otro',
  }
  return L[act.tipo] ?? act.tipo
}

function subtitulo(act: Actividad, invNombre?: string): string | null {
  if (act.tipo === 'conferencia') return invNombre ?? null
  if (act.tipo === 'panel')       return act.coordinador ?? null
  return null
}

function contarParticipantes(act: Actividad, asignadas: Propuesta[]): number {
  if (act.tipo === 'conferencia') return act.invitadoId ? 1 : 0
  if (act.tipo === 'panel' || act.tipo === 'otro') return act.participantes?.length ?? 0
  // mesa, pósters: autor + coautores de cada propuesta asignada
  return asignadas.reduce((s, p) => s + 1 + (p.coautores?.length ?? 0), 0)
}

function nombresParticipantes(act: Actividad, asignadas: Propuesta[], invNombre?: string): string[] {
  if (act.tipo === 'conferencia') return invNombre ? [invNombre] : []
  if (act.tipo === 'panel' || act.tipo === 'otro')
    return (act.participantes ?? []).map(p => p.nombre)
  // mesa, pósters: autor + coautores de cada propuesta
  return asignadas.flatMap(p => [p.autor.nombre, ...(p.coautores ?? []).map(c => c.nombre)])
}

// ── Tarjeta en la grilla ──────────────────────────────────────

function TarjetaActividad({
  act, top, height, asignadas, invNombre,
}: {
  act:       Actividad
  top:       number
  height:    number
  asignadas: Propuesta[]
  invNombre?: string
}) {
  const color      = tipoColor(act.tipo)
  const compact    = height < 36
  const nombres    = nombresParticipantes(act, asignadas, invNombre)

  return (
    <div style={{
      position:      'absolute',
      top:           `${top}px`,
      height:        `${Math.max(height - 2, 20)}px`,
      left:          2, right: 2,
      background:    'var(--c-white)',
      borderLeft:    `4px solid ${color}`,
      borderRadius:  '0 2px 2px 0',
      boxShadow:     '0 1px 3px rgba(35,22,81,0.08)',
      padding:       compact ? '3px 8px' : '7px 10px',
      overflow:      'hidden',
      display:       'flex',
      flexDirection: 'column',
      gap:           '3px',
      zIndex:        1,
    }}>
      {/* Tipo */}
      {!compact && (
        <span style={{ fontSize: '0.65rem', color, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {tipoLabel(act)}
        </span>
      )}

      {/* Título */}
      <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--c-dark)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {act.titulo || <i style={{ opacity: 0.4 }}>sin título</i>}
      </span>

      {/* Participantes separados por · */}
      {!compact && nombres.length > 0 && (
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(35,22,81,0.7)', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
          {nombres.join(' · ')}
        </p>
      )}
    </div>
  )
}

// ── Grilla principal ──────────────────────────────────────────

function GrillaHorarios({
  actividades, propuestas, invitados,
}: {
  actividades: Actividad[]
  propuestas:  Propuesta[]
  invitados:   { id: string; nombre: string }[]
}) {
  const conHorario = actividades.filter(a => a.horaInicio && a.horaFin)
  const sinHorario = actividades.filter(a => !a.horaInicio || !a.horaFin)

  // Salas como columnas (orden: primero las nombradas, luego las sin nombre)
  const salas = useMemo(() => {
    const set = new Set(conHorario.map(a => a.sala ?? ''))
    return [...set].sort((a, b) => {
      if (!a && b)  return 1
      if (a && !b)  return -1
      return a.localeCompare(b, 'es')
    })
  }, [conHorario])

  if (conHorario.length === 0 && sinHorario.length === 0) {
    return <p className="admin-list__empty">No hay actividades para este día.</p>
  }

  return (
    <>
      {conHorario.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          {/* Cabecera de salas */}
          <div style={{ display: 'flex', paddingLeft: 52, marginBottom: 2, minWidth: salas.length * 160 + 52 }}>
            {salas.map(sala => (
              <div key={sala} style={{
                flex: 1,
                fontSize: '0.65rem',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'rgba(35,22,81,0.45)',
                padding: '0 4px 6px 6px',
                borderBottom: '2px solid rgba(35,22,81,0.1)',
                textAlign: 'center',
              }}>
                {sala || 'Sin sala'}
              </div>
            ))}
          </div>

          {/* Cuerpo: etiquetas de hora + columnas de sala */}
          <div style={{ display: 'flex', position: 'relative', minWidth: salas.length * 160 + 52 }}>

            {/* Columna de horas */}
            <div style={{ width: 52, flexShrink: 0, position: 'relative', height: TOP_TOTAL }}>
              {HORA_LABELS.map(h => (
                <div key={h} style={{
                  position: 'absolute',
                  top:      timeToTop(h) - 7,
                  right:    6,
                  fontSize: '0.62rem',
                  fontWeight: 600,
                  color:    'rgba(35,22,81,0.3)',
                  userSelect: 'none',
                }}>
                  {h}
                </div>
              ))}
            </div>

            {/* Columnas de sala */}
            {salas.map(sala => {
              const actsEnSala = conHorario.filter(a => (a.sala ?? '') === sala)
              return (
                <div key={sala} style={{
                  flex:     1,
                  position: 'relative',
                  height:   TOP_TOTAL,
                  borderLeft: '1px solid rgba(35,22,81,0.08)',
                  background: '#fafbfd',
                }}>
                  {/* Líneas de hora */}
                  {HORA_LABELS.map(h => (
                    <div key={h} style={{
                      position: 'absolute',
                      top:      timeToTop(h),
                      left:     0, right: 0,
                      height:   1,
                      background: 'rgba(35,22,81,0.07)',
                      pointerEvents: 'none',
                    }} />
                  ))}

                  {/* Actividades */}
                  {actsEnSala.map(act => {
                    const asignadas = propuestas.filter(p => p.actividadId === act.id)
                    const invNombre = act.invitadoId
                      ? invitados.find(i => i.id === act.invitadoId)?.nombre
                      : undefined
                    return (
                      <TarjetaActividad
                        key={act.id}
                        act={act}
                        top={timeToTop(act.horaInicio!)}
                        height={timeToPx(act.horaInicio!, act.horaFin!)}
                        asignadas={asignadas}
                        invNombre={invNombre}
                      />
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Sin horario */}
      {sinHorario.length > 0 && (
        <div style={{ marginTop: conHorario.length > 0 ? '2.5rem' : 0 }}>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(35,22,81,0.3)', marginBottom: '0.6rem' }}>
            Sin horario asignado
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {sinHorario.map(act => {
              const asignadas = propuestas.filter(p => p.actividadId === act.id)
              const n = contarParticipantes(act, asignadas)
              return (
                <div key={act.id} style={{
                  padding: '0.6rem 1rem',
                  background: 'var(--c-white)',
                  border: '1px dashed rgba(35,22,81,0.15)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--c-dark)' }}>
                    {act.titulo || '(sin título)'}
                  </span>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 600, color: tipoColor(act.tipo) }}>{tipoLabel(act)}</span>
                    <span style={{ fontSize: '0.7rem', color: 'rgba(35,22,81,0.4)' }}>{n} participantes</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}

// ── Componente raíz ───────────────────────────────────────────

export default function AdminDistribucion() {
  const { actividades, loading: loadAct } = useActividades()
  const { propuestas,  loading: loadProp } = usePropuestas()
  const { invitados,   loading: loadInv  } = useInvitados()

  const [diaActivo, setDiaActivo] = useState(FECHAS_JORNADA[0].valor)

  const actsDia   = useMemo(() => actividades.filter(a => a.fecha === diaActivo), [actividades, diaActivo])
  const sinFecha  = useMemo(() => actividades.filter(a => !a.fecha),              [actividades])

  if (loadAct || loadProp || loadInv) return (
    <div className="admin-module">
      <h2 className="admin-module__title">Distribución</h2>
      <p style={{ color: 'rgba(35,22,81,0.3)', fontSize: '0.82rem' }}>Cargando...</p>
    </div>
  )

  return (
    <div className="admin-module">

      <h2 className="admin-module__title">Distribución</h2>

      {/* Tabs por día */}
      <div style={{ display: 'flex', gap: 0, marginBottom: '1.75rem', borderBottom: '1px solid rgba(35,22,81,0.1)' }}>
        {FECHAS_JORNADA.map(f => (
          <button
            key={f.valor}
            onClick={() => setDiaActivo(f.valor)}
            style={{
              padding:     '0.55rem 1.4rem',
              fontSize:    '0.78rem',
              fontWeight:  diaActivo === f.valor ? 700 : 400,
              border:      'none',
              cursor:      'pointer',
              background:  'transparent',
              color:       diaActivo === f.valor ? 'var(--c-dark)' : 'rgba(35,22,81,0.4)',
              borderBottom: diaActivo === f.valor ? '2px solid var(--c-turq)' : '2px solid transparent',
              marginBottom: -1,
              letterSpacing: '0.02em',
              transition:  'all 0.15s',
            }}
          >
            {f.etiqueta}
          </button>
        ))}
      </div>

      {/* Grilla del día */}
      <GrillaHorarios actividades={actsDia} propuestas={propuestas} invitados={invitados} />

      {/* Actividades sin fecha */}
      {sinFecha.length > 0 && (
        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid rgba(35,22,81,0.08)' }}>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(35,22,81,0.3)', marginBottom: '0.75rem' }}>
            Sin fecha asignada ({sinFecha.length})
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {sinFecha.map(act => {
              const asignadas = propuestas.filter(p => p.actividadId === act.id)
              const n = contarParticipantes(act, asignadas)
              return (
                <div key={act.id} style={{
                  padding: '0.6rem 1rem',
                  background: 'var(--c-white)',
                  border: '1px dashed rgba(35,22,81,0.12)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--c-dark)' }}>
                    {act.titulo || '(sin título)'}
                  </span>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 600, color: tipoColor(act.tipo) }}>{tipoLabel(act)}</span>
                    <span style={{ fontSize: '0.7rem', color: 'rgba(35,22,81,0.4)' }}>{n} participantes</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
