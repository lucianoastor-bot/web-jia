// components/admin/AdminDistribucion.tsx
'use client'

import { useMemo, useState } from 'react'
import {
  DndContext, DragOverlay,
  PointerSensor, useSensor, useSensors,
  useDroppable, useDraggable,
  type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core'
import { useActividades }      from '@/lib/hooks/useActividades'
import { usePropuestas }       from '@/lib/hooks/usePropuestas'
import { useInvitados }        from '@/lib/hooks/useInvitados'
import { actualizarActividad } from '@/lib/services/actividades'
import { CONGRESO }            from '@/congreso.config'
import type { Actividad, Propuesta } from '@/types'

// ── Constantes ────────────────────────────────────────────────

const FECHAS_JORNADA = [0, 1, 2].map(d => {
  const ms       = CONGRESO.fechaInicio.getTime() + d * 86_400_000
  const valor    = new Date(ms).toISOString().slice(0, 10)
  const etiqueta = new Date(valor + 'T12:00:00')
    .toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
    .toUpperCase()
  return { valor, etiqueta }
})

const DAY_START    = '08:00'
const DAY_END      = '21:00'
const PX_MIN_FLOOR = 0.9
const PX_MIN_CAP   = 4.0
const HORA_LABELS  = Array.from({ length: 14 }, (_, i) => `${String(8 + i).padStart(2, '0')}:00`)
const VACIA        = '__sin_sala__'  // id de columna droppable para actividades sin sala

// ── Helpers ───────────────────────────────────────────────────

function toMin(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minToTime(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

const H_PADDING   = 14
const H_TIPO      = 20
const H_TITULO    = 24
const H_GAP       = 6
const H_PART_LINE = 22
const H_PART_MAX  = 3

function alturaEstimada(nParticipantes: number): number {
  const lineas = Math.min(nParticipantes, H_PART_MAX)
  return H_PADDING + H_TIPO + H_TITULO + H_GAP + (lineas > 0 ? lineas * H_PART_LINE : 0)
}

function calcPxPerMin(
  acts: Actividad[],
  propuestas: Propuesta[],
  invitados: { id: string; nombre: string }[],
): number {
  let maxPx = PX_MIN_FLOOR
  for (const act of acts) {
    if (!act.horaInicio || !act.horaFin) continue
    const dur = toMin(act.horaFin) - toMin(act.horaInicio)
    if (dur <= 0) continue
    const asignadas = propuestas.filter(p => p.actividadId === act.id)
    const invNombre = act.invitadoId ? invitados.find(i => i.id === act.invitadoId)?.nombre : undefined
    const nPart  = nombresParticipantes(act, asignadas, invNombre).length
    const needed = alturaEstimada(nPart)
    const px     = Math.min(needed / dur, PX_MIN_CAP)
    if (px > maxPx) maxPx = px
  }
  return maxPx
}

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
    conferencia: 'Conferencia', panel: 'Panel',
    mesa: 'Mesa', pósters: 'Pósters', otro: 'Otro',
  }
  return L[act.tipo] ?? act.tipo
}

function contarParticipantes(act: Actividad, asignadas: Propuesta[]): number {
  if (act.tipo === 'conferencia') return act.invitadoId ? 1 : 0
  if (act.tipo === 'panel' || act.tipo === 'otro') return act.participantes?.length ?? 0
  return asignadas.reduce((s, p) => s + 1 + (p.coautores?.length ?? 0), 0)
}

function nombresParticipantes(act: Actividad, asignadas: Propuesta[], invNombre?: string): string[] {
  if (act.tipo === 'conferencia') return invNombre ? [invNombre] : []
  if (act.tipo === 'panel' || act.tipo === 'otro')
    return (act.participantes ?? []).map(p => p.nombre)
  return asignadas.flatMap(p => [p.autor.nombre, ...(p.coautores ?? []).map(c => c.nombre)])
}

// ── ContenidoTarjeta ──────────────────────────────────────────
// Parte visual pura — usada en la grilla y en el DragOverlay

function ContenidoTarjeta({
  act, height, asignadas, invNombre,
}: {
  act:       Actividad
  height:    number
  asignadas: Propuesta[]
  invNombre?: string
}) {
  const color   = tipoColor(act.tipo)
  const compact = height < 36
  const nombres = nombresParticipantes(act, asignadas, invNombre)

  return (
    <div style={{
      height:        '100%',
      background:    'var(--c-white)',
      borderLeft:    `4px solid ${color}`,
      borderRadius:  '0 2px 2px 0',
      boxShadow:     '0 1px 3px rgba(35,22,81,0.08)',
      padding:       compact ? '3px 8px' : '7px 10px',
      overflow:      'hidden',
      display:       'flex',
      flexDirection: 'column',
      gap:           '3px',
    }}>
      {!compact && (
        <span style={{ fontSize: '0.65rem', color, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {tipoLabel(act)}
        </span>
      )}
      <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--c-dark)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {act.titulo || <i style={{ opacity: 0.4 }}>sin título</i>}
      </span>
      {!compact && nombres.length > 0 && (
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(35,22,81,0.7)', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
          {nombres.join(' · ')}
        </p>
      )}
    </div>
  )
}

// ── TarjetaActividad ──────────────────────────────────────────
// Wrapper draggable + posicionamiento absoluto en la grilla

function TarjetaActividad({
  act, top, height, asignadas, invNombre, isDragging,
}: {
  act:        Actividad
  top:        number
  height:     number
  asignadas:  Propuesta[]
  invNombre?: string
  isDragging: boolean
}) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id: act.id })
  const h = Math.max(height - 2, 20)

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        position:    'absolute',
        top:         `${top}px`,
        height:      `${h}px`,
        left: 2, right: 2,
        opacity:     isDragging ? 0.25 : 1,
        cursor:      'grab',
        touchAction: 'none',
        zIndex:      1,
      }}
    >
      <ContenidoTarjeta act={act} height={h} asignadas={asignadas} invNombre={invNombre} />
    </div>
  )
}

// ── ColumnaSala ───────────────────────────────────────────────
// Columna droppable — cambia de color al sobrevolar

function ColumnaSala({
  sala, actsEnSala, topTotal, timeToTop, timeToPx, propuestas, invitados, activeId,
}: {
  sala:        string
  actsEnSala:  Actividad[]
  topTotal:    number
  timeToTop:   (t: string) => number
  timeToPx:    (i: string, f: string) => number
  propuestas:  Propuesta[]
  invitados:   { id: string; nombre: string }[]
  activeId:    string | null
}) {
  const { setNodeRef, isOver } = useDroppable({ id: sala || VACIA })

  return (
    <div
      ref={setNodeRef}
      style={{
        flex:       1,
        position:   'relative',
        height:     topTotal,
        borderLeft: '1px solid rgba(35,22,81,0.08)',
        background: isOver ? 'rgba(77,204,189,0.06)' : '#fafbfd',
        transition: 'background 0.15s',
      }}
    >
      {/* Líneas de hora */}
      {HORA_LABELS.map(h => (
        <div key={h} style={{
          position:      'absolute',
          top:           timeToTop(h),
          left: 0, right: 0,
          height:        1,
          background:    'rgba(35,22,81,0.07)',
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
            isDragging={activeId === act.id}
          />
        )
      })}
    </div>
  )
}

// ── GrillaHorarios ────────────────────────────────────────────

function GrillaHorarios({
  actividades, propuestas, invitados, onMoved,
}: {
  actividades: Actividad[]
  propuestas:  Propuesta[]
  invitados:   { id: string; nombre: string }[]
  onMoved:     () => void
}) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const conHorario = actividades.filter(a => a.horaInicio && a.horaFin)
  const sinHorario = actividades.filter(a => !a.horaInicio || !a.horaFin)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pxPerMin  = useMemo(() => calcPxPerMin(conHorario, propuestas, invitados), [actividades, propuestas, invitados])
  const topTotal  = (toMin(DAY_END) - toMin(DAY_START)) * pxPerMin
  const timeToTop = (t: string) => (toMin(t) - toMin(DAY_START)) * pxPerMin
  const timeToPx  = (i: string, f: string) => (toMin(f) - toMin(i)) * pxPerMin

  const salas = useMemo(() => {
    const set = new Set(conHorario.map(a => a.sala ?? ''))
    return [...set].sort((a, b) => {
      if (!a && b) return 1
      if (a && !b) return -1
      return a.localeCompare(b, 'es')
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actividades])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  // Datos de la actividad que se está arrastrando (para el DragOverlay)
  const activeAct       = activeId ? conHorario.find(a => a.id === activeId) : null
  const activeAsignadas = activeAct ? propuestas.filter(p => p.actividadId === activeAct.id) : []
  const activeInvNombre = activeAct?.invitadoId
    ? invitados.find(i => i.id === activeAct.invitadoId)?.nombre
    : undefined
  const activeHeight    = activeAct?.horaInicio && activeAct.horaFin
    ? Math.max(timeToPx(activeAct.horaInicio, activeAct.horaFin) - 2, 20)
    : 60

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over, delta } = event
    if (!over) return

    const act = conHorario.find(a => a.id === active.id)
    if (!act || !act.horaInicio || !act.horaFin) return

    // Calcular nueva hora: delta.y → minutos, snap a 30 min
    const duracion     = toMin(act.horaFin) - toMin(act.horaInicio)
    const snappedDelta = Math.round((delta.y / pxPerMin) / 30) * 30
    const newInicioMin = Math.max(
      toMin(DAY_START),
      Math.min(toMin(DAY_END) - duracion, toMin(act.horaInicio) + snappedDelta),
    )
    const newFinMin = newInicioMin + duracion

    // Nueva sala (solo si es una columna con nombre)
    const nuevaSala   = over.id === VACIA ? (act.sala ?? '') : over.id as string
    const timeChanged = newInicioMin !== toMin(act.horaInicio)
    const salaChanged = nuevaSala !== (act.sala ?? '')

    if (!timeChanged && !salaChanged) return

    const updates: Partial<Omit<Actividad, 'id'>> = {
      horaInicio: minToTime(newInicioMin),
      horaFin:    minToTime(newFinMin),
    }
    if (salaChanged && nuevaSala) updates.sala = nuevaSala

    await actualizarActividad(act.id, updates)
    onMoved()
  }

  if (conHorario.length === 0 && sinHorario.length === 0) {
    return <p className="admin-list__empty">No hay actividades para este día.</p>
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>

      {conHorario.length > 0 && (
        <div style={{ overflowX: 'auto' }}>

          {/* Cabecera de salas */}
          <div style={{ display: 'flex', paddingLeft: 52, marginBottom: 2, minWidth: salas.length * 160 + 52 }}>
            {salas.map(sala => (
              <div key={sala} style={{
                flex:          1,
                fontSize:      '0.65rem',
                fontWeight:    700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color:         'rgba(35,22,81,0.45)',
                padding:       '0 4px 6px 6px',
                borderBottom:  '2px solid rgba(35,22,81,0.1)',
                textAlign:     'center',
              }}>
                {sala || 'Sin sala'}
              </div>
            ))}
          </div>

          {/* Cuerpo: etiquetas de hora + columnas */}
          <div style={{ display: 'flex', position: 'relative', minWidth: salas.length * 160 + 52 }}>

            {/* Columna de horas */}
            <div style={{ width: 52, flexShrink: 0, position: 'relative', height: topTotal }}>
              {HORA_LABELS.map(h => (
                <div key={h} style={{
                  position:   'absolute',
                  top:        timeToTop(h) - 7,
                  right:      6,
                  fontSize:   '0.62rem',
                  fontWeight: 600,
                  color:      'rgba(35,22,81,0.3)',
                  userSelect: 'none',
                }}>
                  {h}
                </div>
              ))}
            </div>

            {/* Columnas de sala */}
            {salas.map(sala => (
              <ColumnaSala
                key={sala}
                sala={sala}
                actsEnSala={conHorario.filter(a => (a.sala ?? '') === sala)}
                topTotal={topTotal}
                timeToTop={timeToTop}
                timeToPx={timeToPx}
                propuestas={propuestas}
                invitados={invitados}
                activeId={activeId}
              />
            ))}
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
                  padding:    '0.6rem 1rem',
                  background: 'var(--c-white)',
                  border:     '1px dashed rgba(35,22,81,0.15)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem',
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

      {/* Ghost durante el drag */}
      <DragOverlay>
        {activeAct && (
          <div style={{ height: activeHeight, opacity: 0.9, pointerEvents: 'none' }}>
            <ContenidoTarjeta
              act={activeAct}
              height={activeHeight}
              asignadas={activeAsignadas}
              invNombre={activeInvNombre}
            />
          </div>
        )}
      </DragOverlay>

    </DndContext>
  )
}

// ── Componente raíz ───────────────────────────────────────────

export default function AdminDistribucion({ onAgregar }: { onAgregar?: () => void }) {
  const { actividades, cargar, loading: loadAct } = useActividades()
  const { propuestas,  loading: loadProp }         = usePropuestas()
  const { invitados,   loading: loadInv  }         = useInvitados()

  const [diaActivo, setDiaActivo] = useState(FECHAS_JORNADA[0].valor)

  const actsDia  = useMemo(() => actividades.filter(a => a.fecha === diaActivo), [actividades, diaActivo])
  const sinFecha = useMemo(() => actividades.filter(a => !a.fecha),              [actividades])

  const actividadesOrdenadas = useMemo(() =>
    [...actividades].sort((a, b) => {
      const fa = `${a.fecha ?? '9999'} ${a.horaInicio ?? '99:99'}`
      const fb = `${b.fecha ?? '9999'} ${b.horaInicio ?? '99:99'}`
      return fa.localeCompare(fb)
    }),
    [actividades]
  )

  if (loadAct || loadProp || loadInv) return (
    <div className="admin-module">
      <h2 className="admin-module__title">Distribución</h2>
      <p style={{ color: 'rgba(35,22,81,0.3)', fontSize: '0.82rem' }}>Cargando...</p>
    </div>
  )

  return (
    <div className="admin-module" style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '2rem', alignItems: 'start' }}>

      {/* ── Columna izquierda: grilla ── */}
      <div>
        <h2 className="admin-module__title">Distribución</h2>

        {/* Tabs por día */}
        <div style={{ display: 'flex', gap: 0, marginBottom: '1.75rem', borderBottom: '1px solid rgba(35,22,81,0.1)' }}>
          {FECHAS_JORNADA.map(f => (
            <button
              key={f.valor}
              onClick={() => setDiaActivo(f.valor)}
              style={{
                padding:      '0.55rem 1.4rem',
                fontSize:     '0.78rem',
                fontWeight:   diaActivo === f.valor ? 700 : 400,
                border:       'none',
                cursor:       'pointer',
                background:   'transparent',
                color:        diaActivo === f.valor ? 'var(--c-dark)' : 'rgba(35,22,81,0.4)',
                borderBottom: diaActivo === f.valor ? '2px solid var(--c-turq)' : '2px solid transparent',
                marginBottom: -1,
                letterSpacing: '0.02em',
                transition:   'all 0.15s',
              }}
            >
              {f.etiqueta}
            </button>
          ))}
        </div>

        {/* Grilla del día */}
        <GrillaHorarios
          actividades={actsDia}
          propuestas={propuestas}
          invitados={invitados}
          onMoved={cargar}
        />

        {/* Sin fecha */}
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
                  <div key={act.id} style={{ padding: '0.6rem 1rem', background: 'var(--c-white)', border: '1px dashed rgba(35,22,81,0.12)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--c-dark)' }}>{act.titulo || '(sin título)'}</span>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 600, color: tipoColor(act.tipo) }}>{tipoLabel(act)}</span>
                      <span style={{ fontSize: '0.7rem', color: 'rgba(35,22,81,0.4)' }}>{n} part.</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Columna derecha: lista de actividades ── */}
      <div style={{ position: 'sticky', top: '5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.6rem', borderBottom: '2px solid var(--c-turq)' }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--c-dark)' }}>
            Actividades ({actividades.length})
          </span>
          {onAgregar && (
            <button className="admin-btn admin-btn--small" onClick={onAgregar}>
              + Agregar
            </button>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', maxHeight: 'calc(100vh - 12rem)', overflowY: 'auto' }}>
          {actividadesOrdenadas.map(act => {
            const esDiaActivo = act.fecha === diaActivo
            return (
              <div key={act.id} style={{
                padding:    '0.55rem 0.75rem',
                background: esDiaActivo ? 'rgba(77,204,189,0.07)' : 'var(--c-white)',
                border:     esDiaActivo ? '1px solid rgba(77,204,189,0.3)' : '1px solid rgba(35,22,81,0.07)',
                borderLeft: `3px solid ${tipoColor(act.tipo)}`,
              }}>
                <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--c-dark)', lineHeight: 1.3, marginBottom: '0.2rem' }}>
                  {act.titulo || <span style={{ opacity: 0.35 }}>sin título</span>}
                </p>
                <p style={{ fontSize: '0.65rem', color: 'rgba(35,22,81,0.45)' }}>
                  {[
                    act.fecha ? FECHAS_JORNADA.find(f => f.valor === act.fecha)?.etiqueta.split(',')[0] : null,
                    act.horaInicio && act.horaFin ? `${act.horaInicio}–${act.horaFin}` : null,
                    act.sala || null,
                  ].filter(Boolean).join(' · ') || 'Sin programar'}
                </p>
              </div>
            )
          })}
          {actividades.length === 0 && (
            <p style={{ fontSize: '0.78rem', color: 'rgba(35,22,81,0.3)', textAlign: 'center', padding: '1rem' }}>
              Sin actividades
            </p>
          )}
        </div>
      </div>

    </div>
  )
}
