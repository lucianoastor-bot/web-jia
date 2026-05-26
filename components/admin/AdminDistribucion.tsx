// components/admin/AdminDistribucion.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import jsPDF from 'jspdf'
import {
  DndContext, DragOverlay,
  PointerSensor, useSensor, useSensors,
  useDroppable, useDraggable,
  type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core'
import { useActividades }      from '@/lib/hooks/useActividades'
import { usePropuestas }       from '@/lib/hooks/usePropuestas'
import { useInvitados }        from '@/lib/hooks/useInvitados'
import { actualizarActividad, actualizarParticipantesPanel } from '@/lib/services/actividades'
import { asignarPropuesta, desasignarPropuesta } from '@/lib/services/propuestas'
import { CONGRESO, PROPUESTAS_COMPATIBLES, TIPOS_PROPUESTA, PERTENENCIAS, ESTADOS_PROPUESTA, SALAS } from '@/congreso.config'
import type { Actividad, Propuesta, Invitado, ParticipantePanel } from '@/types'

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
const PX_MIN_FLOOR = 2.0
const PX_MIN_CAP   = 4.0
const HORA_LABELS  = Array.from({ length: 14 }, (_, i) => `${String(8 + i).padStart(2, '0')}:00`)
const VACIA        = '__sin_sala__'
const POOL_ID      = '__pool__'

// ── Bandera: mostrar solo propuestas aceptadas en el pool ─────
// Cambiar a true cuando el flujo de evaluación esté completo
const SOLO_APROBADAS = false

// ── Helpers de tiempo ─────────────────────────────────────────

function toMin(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minToTime(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// ── Cálculo de escala ─────────────────────────────────────────

const H_PADDING   = 14
const H_HANDLE    = 44   // altura fija del handle (tipo + título)
const H_PART_LINE = 20   // altura por línea de participante
const H_PART_MAX  = 3

function alturaEstimada(nParticipantes: number): number {
  const lineas = Math.min(nParticipantes, H_PART_MAX)
  return H_PADDING + H_HANDLE + (lineas > 0 ? lineas * H_PART_LINE : 0)
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

// ── Tipo activo en el drag ────────────────────────────────────

type ActiveItem =
  | { type: 'actividad'; id: string }
  | { type: 'propuesta'; id: string; fromActividadId: string | null }

// ── PropuestaChip ─────────────────────────────────────────────
// Chip draggable — usado en el pool y dentro de las tarjetas

function PropuestaChip({
  prop, fromActividadId, dimmed, showTitle,
}: {
  prop:            Propuesta
  fromActividadId: string | null
  dimmed?:         boolean
  showTitle?:      boolean
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id:   prop.id,
    data: { type: 'propuesta', fromActividadId },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        display:       'flex',
        flexDirection: showTitle ? 'column' : 'row',
        alignItems:    showTitle ? 'flex-start' : 'baseline',
        gap:           showTitle ? '1px' : '0.35rem',
        padding:       '0.3rem 0.5rem',
        background:    isDragging ? 'rgba(35,22,81,0.03)' : 'rgba(35,22,81,0.04)',
        borderRadius:  2,
        cursor:        'grab',
        touchAction:   'none',
        opacity:       isDragging || dimmed ? 0.35 : 1,
        userSelect:    'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', width: '100%' }}>
        <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--c-dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {prop.autor.nombre}
        </span>
        <span style={{ fontSize: '0.65rem', color: 'rgba(35,22,81,0.4)', flexShrink: 0 }}>
          Eje {prop.eje}
        </span>
        {showTitle && (
          <span style={{ fontSize: '0.65rem', color: 'rgba(35,22,81,0.55)', flexShrink: 0, marginLeft: 'auto', fontStyle: 'italic' }}>
            {TIPOS_PROPUESTA.find(t => t.valor === prop.tipo)?.etiqueta ?? prop.tipo}
          </span>
        )}
      </div>
      {showTitle && (
        <span style={{ fontSize: '0.72rem', color: 'rgba(35,22,81,0.55)', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {prop.titulo}
        </span>
      )}
    </div>
  )
}

// ── ZonaContenido ─────────────────────────────────────────────
// Mitad inferior de la tarjeta: droppable + lista de propuestas/participantes

function ZonaContenido({
  act, asignadas, invNombre, activeItem,
}: {
  act:        Actividad
  asignadas:  Propuesta[]
  invNombre?: string
  activeItem: ActiveItem | null
}) {
  const aceptaPropuestas = !!PROPUESTAS_COMPATIBLES[act.tipo]
  // Mesa, pósters y panel muestran chips draggables; conferencia/otro muestran nombres
  const mostrarChips = act.tipo === 'mesa' || act.tipo === 'pósters' || act.tipo === 'panel'

  const { setNodeRef, isOver } = useDroppable({
    id:       `prop-${act.id}`,
    data:     { type: 'actividad-slot', actividadId: act.id },
    disabled: !aceptaPropuestas,
  })

  const nombres = nombresParticipantes(act, asignadas, invNombre)

  const propDragging = activeItem?.type === 'propuesta'
  const propId       = propDragging ? activeItem.id : null

  return (
    <div
      ref={setNodeRef}
      style={{
        flex:          1,
        padding:       '4px 8px 6px',
        background:    isOver && aceptaPropuestas ? 'rgba(77,204,189,0.1)' : 'transparent',
        borderTop:     '1px solid rgba(35,22,81,0.07)',
        display:       'flex',
        flexDirection: 'column',
        gap:           '3px',
        transition:    'background 0.12s',
        minHeight:     24,
      }}
    >
      {/* Mesa / pósters / panel con propuesta: chips draggables */}
      {mostrarChips && asignadas.map(p => (
        <PropuestaChip
          key={p.id}
          prop={p}
          fromActividadId={act.id}
          dimmed={propId === p.id}
        />
      ))}

      {/* Panel sin propuesta asignada: participantes manuales como texto */}
      {act.tipo === 'panel' && asignadas.length === 0 && nombres.map((n, i) => (
        <span key={i} style={{ fontSize: '0.76rem', color: 'rgba(35,22,81,0.65)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {n}
        </span>
      ))}

      {/* Conferencia / otro: participantes como texto */}
      {!mostrarChips && nombres.map((n, i) => (
        <span key={i} style={{ fontSize: '0.76rem', color: 'rgba(35,22,81,0.65)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {n}
        </span>
      ))}

      {/* Indicador de zona vacía al arrastrar sobre actividad compatible */}
      {aceptaPropuestas && asignadas.length === 0 && propDragging && (
        <div style={{ fontSize: '0.65rem', color: 'rgba(77,204,189,0.7)', fontStyle: 'italic' }}>
          Soltar aquí
        </div>
      )}
    </div>
  )
}

// ── HandleActividad ───────────────────────────────────────────
// Mitad superior de la tarjeta: drag handle para mover la actividad

function HandleActividad({
  act, isDragging, onVerDetalle,
}: {
  act:          Actividad
  isDragging:   boolean
  onVerDetalle: (id: string) => void
}) {
  const color = tipoColor(act.tipo)
  const { attributes, listeners, setNodeRef } = useDraggable({
    id:   act.id,
    data: { type: 'actividad' },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onVerDetalle(act.id)}
      style={{
        height:      H_HANDLE,
        flexShrink:  0,
        padding:     '6px 10px',
        cursor:      isDragging ? 'grabbing' : 'grab',
        touchAction: 'none',
        display:     'flex',
        flexDirection: 'column',
        gap:         '2px',
        justifyContent: 'center',
      }}
    >
      <span style={{ fontSize: '0.6rem', color, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', lineHeight: 1 }}>
        {tipoLabel(act)}
      </span>
      <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--c-dark)', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {act.titulo || <i style={{ opacity: 0.4 }}>sin título</i>}
      </span>
    </div>
  )
}

// ── TarjetaActividad ──────────────────────────────────────────
// Posicionamiento absoluto + handle + zona de contenido

function TarjetaActividad({
  act, top, height, asignadas, invNombre, isDragging, activeItem, onVerDetalle,
}: {
  act:          Actividad
  top:          number
  height:       number
  asignadas:    Propuesta[]
  invNombre?:   string
  isDragging:   boolean
  activeItem:   ActiveItem | null
  onVerDetalle: (id: string) => void
}) {
  const color = tipoColor(act.tipo)
  const h     = Math.max(height - 2, H_HANDLE + 4)

  return (
    <div style={{
      position:      'absolute',
      top:           `${top}px`,
      minHeight:     `${h}px`,
      left: 2, right: 2,
      background:    'var(--c-white)',
      borderLeft:    `4px solid ${color}`,
      borderRadius:  '0 2px 2px 0',
      boxShadow:     '0 1px 3px rgba(35,22,81,0.08)',
      display:       'flex',
      flexDirection: 'column',
      opacity:       isDragging ? 0.25 : 1,
      zIndex:        1,
    }}>
      <HandleActividad act={act} isDragging={isDragging} onVerDetalle={onVerDetalle} />
      <ZonaContenido act={act} asignadas={asignadas} invNombre={invNombre} activeItem={activeItem} />
    </div>
  )
}

// ── ColumnaSala ───────────────────────────────────────────────

function ColumnaSala({
  sala, actsEnSala, topTotal, timeToTop, timeToPx,
  propuestas, invitados, activeItem, onVerDetalle,
}: {
  sala:         string
  actsEnSala:   Actividad[]
  topTotal:     number
  timeToTop:    (t: string) => number
  timeToPx:     (i: string, f: string) => number
  propuestas:   Propuesta[]
  invitados:    { id: string; nombre: string }[]
  activeItem:   ActiveItem | null
  onVerDetalle: (id: string) => void
}) {
  const isActDragging = activeItem?.type === 'actividad'
  const { setNodeRef, isOver } = useDroppable({
    id:       sala || VACIA,
    data:     { type: 'sala' },
    disabled: !isActDragging,   // solo acepta actividades
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        flex:       1,
        position:   'relative',
        height:     topTotal,
        borderLeft: '1px solid rgba(35,22,81,0.08)',
        background: isOver && isActDragging ? 'rgba(77,204,189,0.06)' : '#fafbfd',
        transition: 'background 0.15s',
      }}
    >
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
            isDragging={activeItem?.type === 'actividad' && activeItem.id === act.id}
            activeItem={activeItem}
            onVerDetalle={onVerDetalle}
          />
        )
      })}
    </div>
  )
}

// ── GrillaHorarios ────────────────────────────────────────────

function GrillaHorarios({
  actividades, propuestas, invitados, pxPerMin, activeItem, onVerDetalle,
}: {
  actividades:  Actividad[]
  propuestas:   Propuesta[]
  invitados:    { id: string; nombre: string }[]
  pxPerMin:     number
  activeItem:   ActiveItem | null
  onVerDetalle: (id: string) => void
}) {
  const conHorario = actividades.filter(a => a.horaInicio && a.horaFin)
  const sinHorario = actividades.filter(a => !a.horaInicio || !a.horaFin)

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
                flex: 1, textAlign: 'center',
                fontSize: '0.65rem', fontWeight: 700,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'rgba(35,22,81,0.45)',
                padding: '0 4px 6px 6px',
                borderBottom: '2px solid rgba(35,22,81,0.1)',
              }}>
                {sala || 'Sin sala'}
              </div>
            ))}
          </div>

          {/* Cuerpo */}
          <div style={{ display: 'flex', position: 'relative', minWidth: salas.length * 160 + 52 }}>

            {/* Etiquetas de hora */}
            <div style={{ width: 52, flexShrink: 0, position: 'relative', height: topTotal }}>
              {HORA_LABELS.map(h => (
                <div key={h} style={{
                  position: 'absolute', top: timeToTop(h) - 7, right: 6,
                  fontSize: '0.62rem', fontWeight: 600,
                  color: 'rgba(35,22,81,0.3)', userSelect: 'none',
                }}>
                  {h}
                </div>
              ))}
            </div>

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
                activeItem={activeItem}
                onVerDetalle={onVerDetalle}
              />
            ))}
          </div>
        </div>
      )}

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
                  padding: '0.6rem 1rem', background: 'var(--c-white)',
                  border: '1px dashed rgba(35,22,81,0.15)',
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
    </>
  )
}

// ── Helpers del modal ─────────────────────────────────────────

function MetaDato({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(35,22,81,0.35)', margin: 0 }}>
        {label}
      </p>
      <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--c-dark)', margin: 0 }}>
        {value}
      </p>
    </div>
  )
}

function FilaPropuesta({ prop }: { prop: Propuesta }) {
  const pertEtiqueta   = PERTENENCIAS.find(p => p.valor === prop.autor.pertenencia)?.etiqueta ?? prop.autor.pertenencia ?? ''
  const estadoEtiqueta = ESTADOS_PROPUESTA.find(e => e.valor === prop.estado)?.etiqueta ?? prop.estado
  const tipoEtiqueta   = TIPOS_PROPUESTA.find(t => t.valor === prop.tipo)?.etiqueta ?? prop.tipo

  return (
    <div style={{ padding: '0.65rem 0.85rem', background: 'rgba(35,22,81,0.03)', borderRadius: 3, borderLeft: '3px solid rgba(35,22,81,0.12)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.2rem' }}>
        <p style={{ fontWeight: 700, fontSize: '0.88rem', margin: 0, color: 'var(--c-dark)' }}>
          {prop.autor.nombre}
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0, alignItems: 'center' }}>
          <span style={{ fontSize: '0.65rem', color: 'rgba(35,22,81,0.45)' }}>Eje {prop.eje}</span>
          <span style={{ fontSize: '0.65rem', padding: '1px 6px', background: 'rgba(35,22,81,0.07)', borderRadius: 10, color: 'rgba(35,22,81,0.6)' }}>{tipoEtiqueta}</span>
          <span style={{ fontSize: '0.65rem', padding: '1px 6px', background: 'rgba(35,22,81,0.07)', borderRadius: 10, color: 'rgba(35,22,81,0.6)' }}>{estadoEtiqueta}</span>
        </div>
      </div>
      {pertEtiqueta && (
        <p style={{ fontSize: '0.75rem', color: 'rgba(35,22,81,0.45)', margin: '0 0 0.2rem' }}>{pertEtiqueta}</p>
      )}
      {prop.coautores && prop.coautores.length > 0 && (
        <p style={{ fontSize: '0.75rem', color: 'rgba(35,22,81,0.5)', margin: '0 0 0.25rem' }}>
          Con: {prop.coautores.map(c => c.nombre).join(', ')}
        </p>
      )}
      <p style={{ fontSize: '0.82rem', fontStyle: 'italic', color: 'rgba(35,22,81,0.7)', margin: '0 0 0.25rem', lineHeight: 1.4 }}>
        {prop.titulo}
      </p>
      {prop.resumenLink && (
        <a
          href={prop.resumenLink}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: '0.75rem', color: 'var(--c-turq)', textDecoration: 'none' }}
        >
          Ver resumen →
        </a>
      )}
    </div>
  )
}

function FilaParticipante({ participante }: { participante: ParticipantePanel }) {
  return (
    <div style={{ padding: '0.65rem 0.85rem', background: 'rgba(35,22,81,0.03)', borderRadius: 3, borderLeft: '3px solid rgba(35,22,81,0.12)' }}>
      <p style={{ fontWeight: 700, fontSize: '0.88rem', margin: '0 0 0.15rem', color: 'var(--c-dark)' }}>
        {participante.nombre}
      </p>
      {participante.institucion && (
        <p style={{ fontSize: '0.75rem', color: 'rgba(35,22,81,0.5)', margin: '0 0 0.2rem' }}>
          {participante.institucion}
        </p>
      )}
      {participante.tituloPonencia && (
        <p style={{ fontSize: '0.82rem', fontStyle: 'italic', color: 'rgba(35,22,81,0.7)', margin: 0, lineHeight: 1.4 }}>
          {participante.tituloPonencia}
        </p>
      )}
    </div>
  )
}

// ── DetalleModal ──────────────────────────────────────────────

function DetalleModal({
  act, propuestas, invitados, onCerrar,
}: {
  act:       Actividad
  propuestas: Propuesta[]
  invitados:  Invitado[]
  onCerrar:  () => void
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onCerrar])

  const color     = tipoColor(act.tipo)
  const asignadas = propuestas.filter(p => p.actividadId === act.id)
  const invitado  = act.invitadoId ? invitados.find(i => i.id === act.invitadoId) : null
  const fecha     = act.fecha ? FECHAS_JORNADA.find(f => f.valor === act.fecha)?.etiqueta : null

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(35,22,81,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}
      onClick={e => { if (e.target === e.currentTarget) onCerrar() }}
    >
      <div style={{ background: 'var(--c-white)', borderRadius: 6, maxWidth: 660, width: '100%', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(35,22,81,0.2)' }}>

        {/* Encabezado */}
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(35,22,81,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {tipoLabel(act)}
            </span>
            <h2 style={{ margin: '0.2rem 0 0', fontSize: '1.1rem', fontWeight: 700, color: 'var(--c-dark)', lineHeight: 1.3 }}>
              {act.titulo || <span style={{ opacity: 0.4 }}>Sin título</span>}
            </h2>
          </div>
          <button
            onClick={onCerrar}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: 'rgba(35,22,81,0.35)', padding: '0.2rem', lineHeight: 1, flexShrink: 0 }}
          >
            ✕
          </button>
        </div>

        {/* Metadatos */}
        <div style={{ padding: '0.85rem 1.5rem', borderBottom: '1px solid rgba(35,22,81,0.06)', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          {fecha         && <MetaDato label="Fecha"       value={fecha} />}
          {act.horaInicio && act.horaFin && <MetaDato label="Hora" value={`${act.horaInicio} – ${act.horaFin}`} />}
          {act.sala      && <MetaDato label="Sala"        value={act.sala} />}
          {act.moderador && <MetaDato label="Moderador"   value={act.moderador} />}
          {act.coordinador && <MetaDato label="Coordinador" value={act.coordinador} />}
        </div>

        {/* Participantes */}
        <div style={{ padding: '1rem 1.5rem 1.5rem' }}>
          <p style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(35,22,81,0.3)', marginBottom: '0.75rem' }}>
            Participantes
          </p>

          {/* Conferencia */}
          {act.tipo === 'conferencia' && (
            invitado
              ? <FilaParticipante participante={{ nombre: invitado.nombre, institucion: invitado.institucion }} />
              : <p style={{ color: 'rgba(35,22,81,0.3)', fontSize: '0.82rem' }}>Sin conferencista asignado</p>
          )}

          {/* Mesa / pósters: propuestas */}
          {(act.tipo === 'mesa' || act.tipo === 'pósters') && (
            asignadas.length === 0
              ? <p style={{ color: 'rgba(35,22,81,0.3)', fontSize: '0.82rem' }}>Sin propuestas asignadas</p>
              : <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {asignadas.map(p => <FilaPropuesta key={p.id} prop={p} />)}
                </div>
          )}

          {/* Panel / otro: propuesta asignada (si existe) o participantes manuales */}
          {(act.tipo === 'panel' || act.tipo === 'otro') && (
            asignadas.length > 0
              ? <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {asignadas.map(p => <FilaPropuesta key={p.id} prop={p} />)}
                </div>
              : (act.participantes ?? []).length === 0
                ? <p style={{ color: 'rgba(35,22,81,0.3)', fontSize: '0.82rem' }}>Sin participantes</p>
                : <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {(act.participantes ?? []).map((p, i) => <FilaParticipante key={i} participante={p} />)}
                  </div>
          )}
        </div>

      </div>
    </div>
  )
}

// ── PoolPropuestas ────────────────────────────────────────────
// Panel derecho: propuestas sin asignar, droppable para desasignar

function PoolPropuestas({
  propuestas, actividades, activeItem, onAgregar,
}: {
  propuestas:  Propuesta[]
  actividades: Actividad[]
  activeItem:  ActiveItem | null
  onAgregar?:  () => void
}) {
  const isPropDragging = activeItem?.type === 'propuesta'
  const { setNodeRef, isOver } = useDroppable({
    id:       POOL_ID,
    data:     { type: 'pool' },
    disabled: !isPropDragging,
  })

  // Incluye propuestas sin actividadId Y huérfanas (actividadId apunta a actividad
  // que ya no existe, p.ej. porque fue eliminada sin desasignar antes)
  const actividadIds = useMemo(() => new Set(actividades.map(a => a.id)), [actividades])

  const sinAsignar = propuestas.filter(p =>
    (!p.actividadId || !actividadIds.has(p.actividadId)) &&
    (SOLO_APROBADAS ? p.estado === 'aceptada' : true)
  )

  return (
    <div style={{ position: 'sticky', top: '5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

      {/* Cabecera */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.6rem', borderBottom: '2px solid var(--c-turq)' }}>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--c-dark)' }}>
          Propuestas ({sinAsignar.length})
        </span>
        {onAgregar && (
          <button className="admin-btn admin-btn--small" onClick={onAgregar}>
            + Actividad
          </button>
        )}
      </div>

      {/* Zona droppable */}
      <div
        ref={setNodeRef}
        style={{
          display:       'flex',
          flexDirection: 'column',
          gap:           '0.3rem',
          minHeight:     60,
          maxHeight:     'calc(100vh - 12rem)',
          overflowY:     'auto',
          padding:       isOver ? '0.35rem' : '0',
          background:    isOver ? 'rgba(77,204,189,0.06)' : 'transparent',
          borderRadius:  4,
          transition:    'background 0.15s, padding 0.15s',
        }}
      >
        {sinAsignar.length === 0 && (
          <p style={{ fontSize: '0.78rem', color: 'rgba(35,22,81,0.3)', textAlign: 'center', padding: '1rem 0' }}>
            {SOLO_APROBADAS ? 'Sin propuestas aceptadas sin asignar' : 'Sin propuestas sin asignar'}
          </p>
        )}

        {sinAsignar.map(p => (
          <PropuestaChip
            key={p.id}
            prop={p}
            fromActividadId={null}
            showTitle
            dimmed={activeItem?.type === 'propuesta' && activeItem.id === p.id}
          />
        ))}
      </div>
    </div>
  )
}

// ── AdminDistribucion ─────────────────────────────────────────

export default function AdminDistribucion({ onAgregar }: { onAgregar?: () => void }) {
  const { actividades, cargar: recargarActs, loading: loadAct } = useActividades()
  const { propuestas,  cargar: recargarP,    loading: loadProp } = usePropuestas()
  const { invitados,                         loading: loadInv  } = useInvitados()

  const [diaActivo,    setDiaActivo]    = useState(FECHAS_JORNADA[0].valor)
  const [activeItem,   setActiveItem]   = useState<ActiveItem | null>(null)
  const [detalleActId, setDetalleActId] = useState<string | null>(null)

  const actsDia  = useMemo(() => actividades.filter(a => a.fecha === diaActivo), [actividades, diaActivo])
  const sinFecha = useMemo(() => actividades.filter(a => !a.fecha), [actividades])

  // pxPerMin para el día activo — necesario en onDragEnd
  const pxPerMin = useMemo(
    () => calcPxPerMin(actsDia, propuestas, invitados),
    [actsDia, propuestas, invitados]
  )

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  // ── DnD handlers ──────────────────────────────────────────

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current
    if (data?.type === 'actividad') {
      setActiveItem({ type: 'actividad', id: event.active.id as string })
    } else if (data?.type === 'propuesta') {
      setActiveItem({ type: 'propuesta', id: event.active.id as string, fromActividadId: data.fromActividadId ?? null })
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const item = activeItem
    setActiveItem(null)
    const { active, over, delta } = event
    if (!over || !item) return

    const overType = over.data.current?.type

    // ── Mover actividad ──────────────────────────────────────
    if (item.type === 'actividad' && overType === 'sala') {
      const act = actsDia.find(a => a.id === active.id)
      if (!act?.horaInicio || !act.horaFin) return

      const duracion     = toMin(act.horaFin) - toMin(act.horaInicio)
      const snappedDelta = Math.round((delta.y / pxPerMin) / 30) * 30
      const newInicioMin = Math.max(
        toMin(DAY_START),
        Math.min(toMin(DAY_END) - duracion, toMin(act.horaInicio) + snappedDelta),
      )
      const newFinMin  = newInicioMin + duracion
      const nuevaSala  = over.id === VACIA ? (act.sala ?? '') : over.id as string
      const timeChanged = newInicioMin !== toMin(act.horaInicio)
      const salaChanged = nuevaSala !== (act.sala ?? '')

      if (!timeChanged && !salaChanged) return

      const updates: Partial<Omit<Actividad, 'id'>> = {
        horaInicio: minToTime(newInicioMin),
        horaFin:    minToTime(newFinMin),
      }
      if (salaChanged && nuevaSala) updates.sala = nuevaSala
      await actualizarActividad(act.id, updates)
      await recargarActs()
    }

    // ── Asignar propuesta a actividad ────────────────────────
    if (item.type === 'propuesta' && overType === 'actividad-slot') {
      const actividadId = over.data.current?.actividadId as string
      if (actividadId === item.fromActividadId) return  // ya está aquí

      const act  = actividades.find(a => a.id === actividadId)
      const prop = propuestas.find(p => p.id === item.id)
      if (!act || !prop) return

      // Validar compatibilidad
      const compatibles = PROPUESTAS_COMPATIBLES[act.tipo]?.tipos ?? []
      if (!(compatibles as string[]).includes(prop.tipo)) return

      await asignarPropuesta(item.id, actividadId)

      // Para paneles: auto-poblar participantes desde el autor y participantes de la propuesta
      if (act.tipo === 'panel') {
        const nuevos: ParticipantePanel[] = [
          {
            nombre:     prop.autor.nombre,
            ...(prop.autor.institucion && { institucion: prop.autor.institucion }),
          },
          ...((prop.participantes ?? []) as { nombre: string; institucion?: string }[]).map(p => ({
            nombre: p.nombre,
            ...(p.institucion && { institucion: p.institucion }),
          })),
        ]
        await actualizarParticipantesPanel(actividadId, [
          ...(act.participantes ?? []),
          ...nuevos,
        ])
        await recargarActs()
      }

      await recargarP()
    }

    // ── Devolver propuesta al pool (desasignar) ──────────────
    if (item.type === 'propuesta' && overType === 'pool') {
      if (!item.fromActividadId) return  // ya está en el pool
      await desasignarPropuesta(item.id)
      await recargarP()
    }
  }

  // ── PDF ──────────────────────────────────────────────────

  const descargarPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    // ── Paleta por tipo (idéntica a Programa) ─────────────────
    const PALETA_D: Record<string, string> = {
      conferencia: '#2e7d4f',
      panel:       '#7c5cbf',
      mesa:        '#6b7280',
      pósters:     '#2374ab',
      otro:        '#e8a23a',
    }
    const borderColor = (tipo: string) => PALETA_D[tipo] ?? PALETA_D.otro

    // ── Helpers de color ──────────────────────────────────────
    function hexToRgb(hex: string): [number, number, number] {
      const n = parseInt(hex.replace('#', ''), 16)
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
    }
    function tintRgb(hex: string, alpha = 0.09): [number, number, number] {
      const [r, g, b] = hexToRgb(hex)
      return [
        Math.round(255 - (255 - r) * alpha),
        Math.round(255 - (255 - g) * alpha),
        Math.round(255 - (255 - b) * alpha),
      ]
    }

    // ── Constantes de página ──────────────────────────────────
    const PW = 210, PH = 297
    const ML = 10, MR = 10, HEADER_H = 22, MB = 12
    const CW       = PW - ML - MR
    const BORDER_W = 2.5
    const PAD_H    = 4
    const PAD_V    = 3.5
    const CARD_GAP = 2.5
    const BADGE_H  = 4
    const HORA_SIZE = 7
    const GAP_BADGE = 0.8
    const GAP_HORA  = 3.5
    const GAP_TITLE = 2
    const lh = (size: number) => size * 0.352778 * 1.5

    // ── Tipo de línea de contenido ────────────────────────────
    type Linea = {
      txt:    string
      size:   number
      bold?:  boolean
      italic?: boolean
      color?: [number, number, number]
      wrap?:  boolean
      gap?:   number
    }

    // ── partesPanel (misma lógica que Programa) ───────────────
    function partesPanel(act: Actividad) {
      const ncL = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')
      const prop = propuestas.find(p => p.actividadId === act.id)
      const coordName = act.coordinador ?? prop?.autor.nombre
      type Parte = { nombre: string; institucion?: string; tituloPonencia?: string; esCoord: boolean }
      let parts: Parte[] = prop
        ? (prop.participantes ?? []).map(p => ({ nombre: p.nombre, institucion: p.institucion, tituloPonencia: p.tituloPonencia, esCoord: false }))
        : (act.participantes ?? []).map(p => ({ nombre: p.nombre, institucion: p.institucion, tituloPonencia: p.tituloPonencia, esCoord: false }))
      if (coordName) {
        const cn = ncL(coordName)
        const idx = parts.findIndex(p => ncL(p.nombre) === cn)
        if (idx >= 0) {
          parts[idx] = { ...parts[idx], esCoord: true }
          const [c] = parts.splice(idx, 1); parts.unshift(c)
        } else {
          const fromAutor = prop && ncL(prop.autor.nombre) === cn
          parts.unshift(fromAutor
            ? { nombre: prop!.autor.nombre, institucion: prop!.autor.institucion, esCoord: true }
            : { nombre: coordName, esCoord: true })
        }
      }
      return parts
    }

    // ── Contenido por tipo (idéntico a Programa) ──────────────
    function lineas(act: Actividad, innerW: number): Linea[] {
      const dark:  [number,number,number] = [30,  20,  60]
      const gray:  [number,number,number] = [70,  70,  70]
      const light: [number,number,number] = [130, 130, 130]
      const out: Linea[] = []

      if (act.tipo === 'conferencia') {
        const inv = act.invitadoId ? invitados.find(i => i.id === act.invitadoId) : null
        if (inv) {
          out.push({ txt: inv.nombre, size: 9.5, bold: true, color: dark })
          if (inv.institucion) out.push({ txt: inv.institucion, size: 7, italic: true, color: light })
          if (inv.bio) {
            const bio = inv.bio.length > 400 ? inv.bio.slice(0, 397) + '…' : inv.bio
            out.push({ txt: bio, size: 7, color: gray, wrap: true, gap: 1.5 })
          }
        }
      } else if (act.tipo === 'panel') {
        const esDirecto = !propuestas.some(p => p.actividadId === act.id)
        partesPanel(act).forEach((p, i) => {
          const nombre = p.nombre + (p.esCoord ? ' (coordinador/a)' : '')
          if (esDirecto) {
            out.push({ txt: nombre, size: 8.5, bold: true, color: dark, gap: i > 0 ? 1.5 : 0 })
            if (p.institucion) out.push({ txt: p.institucion, size: 6.5, color: light })
            if (p.tituloPonencia) out.push({ txt: p.tituloPonencia, size: 7, italic: true, color: gray, wrap: true })
          } else {
            out.push({ txt: nombre, size: 7.5, color: gray, gap: i > 0 ? 1.5 : 0 })
            if (p.institucion) out.push({ txt: p.institucion, size: 6.5, color: light })
            if (p.tituloPonencia) out.push({ txt: p.tituloPonencia, size: 7, italic: true, color: gray, wrap: true })
          }
        })
      } else if (act.tipo === 'mesa' || act.tipo === 'pósters') {
        propuestas.filter(p => p.actividadId === act.id).forEach((prop, i) => {
          const autores = [prop.autor, ...(prop.coautores ?? [])].map(a => a.nombre).join(', ')
          out.push({ txt: autores, size: 7.5, bold: true, color: dark, wrap: true, gap: i > 0 ? 2 : 0 })
          if (prop.autor.institucion) out.push({ txt: prop.autor.institucion, size: 6.5, color: light })
          out.push({ txt: prop.titulo, size: 7, italic: true, color: gray, wrap: true })
        })
      } else {
        if (act.descripcion) out.push({ txt: act.descripcion, size: 7, italic: true, color: light, wrap: true })
        ;(act.participantes ?? []).forEach((p, i) => {
          const nombre = p.nombre + (p.rol ? ` (${p.rol})` : '')
          out.push({ txt: nombre, size: 8.5, bold: true, color: dark, gap: i > 0 ? 1.5 : 0 })
          if (p.institucion) out.push({ txt: p.institucion, size: 6.5, color: light })
        })
      }
      if (act.moderador) out.push({ txt: 'Modera: ' + act.moderador, size: 7, italic: true, color: light, gap: 2 })
      return out
    }

    // ── Medir altura de una tarjeta ───────────────────────────
    function medirCard(act: Actividad, w: number): number {
      const innerW = w - BORDER_W - PAD_H * 2
      let h = PAD_V
      h += BADGE_H + GAP_BADGE
      const haHora = !!(act.horaInicio || act.sala)
      if (haHora) h += lh(HORA_SIZE) + GAP_HORA
      else         h += GAP_HORA - GAP_BADGE
      doc.setFontSize(9.5)
      h += doc.splitTextToSize(act.titulo || '(sin título)', innerW).length * lh(9.5) + GAP_TITLE
      for (const ln of lineas(act, innerW)) {
        h += ln.gap ?? 0
        doc.setFontSize(ln.size)
        const n = ln.wrap ? doc.splitTextToSize(ln.txt, innerW).length : 1
        h += n * lh(ln.size)
      }
      h += PAD_V
      return h
    }

    // ── Dibujar una tarjeta ───────────────────────────────────
    function dibujarCard(act: Actividad, x: number, y: number, w: number): number {
      const h            = medirCard(act, w)
      const bc           = borderColor(act.tipo)
      const [cr, cg, cb] = hexToRgb(bc)
      const [tr, tg, tb] = tintRgb(bc)
      const innerX       = x + BORDER_W + PAD_H
      const innerW       = w - BORDER_W - PAD_H * 2

      // Fondo tintado
      doc.setFillColor(tr, tg, tb)
      doc.rect(x, y, w, h, 'F')
      // Barra izquierda
      doc.setFillColor(cr, cg, cb)
      doc.rect(x, y, BORDER_W, h, 'F')

      let cy = y + PAD_V

      // ── Badge de tipo ──
      const badgeTxt = tipoLabel(act).toUpperCase()
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(6.5)
      const badgeW = doc.getTextWidth(badgeTxt) + 3.5
      doc.setFillColor(cr, cg, cb)
      doc.rect(innerX, cy, badgeW, BADGE_H, 'F')
      doc.setTextColor(255, 255, 255)
      doc.text(badgeTxt, innerX + 1.75, cy + BADGE_H - 1.1)

      // Badge "OCULTO" si mostrar === false
      if (act.mostrar === false) {
        const ox = innerX + badgeW + 1.5
        const hideTxt = 'OCULTO'
        doc.setFontSize(6.5)
        const hideW = doc.getTextWidth(hideTxt) + 3.5
        doc.setFillColor(180, 40, 40)
        doc.rect(ox, cy, hideW, BADGE_H, 'F')
        doc.setTextColor(255, 255, 255)
        doc.text(hideTxt, ox + 1.75, cy + BADGE_H - 1.1)
      }

      cy += BADGE_H + GAP_BADGE

      // ── Hora · Sala ──
      const horaParts = [
        act.sala,
        act.horaInicio ? (act.horaFin ? `${act.horaInicio}–${act.horaFin}` : act.horaInicio) : '',
      ].filter(Boolean)
      if (horaParts.length > 0) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(HORA_SIZE)
        doc.setTextColor(cr, cg, cb)
        doc.text(horaParts.join('  ·  '), innerX, cy + lh(HORA_SIZE) * 0.78)
        cy += lh(HORA_SIZE) + GAP_HORA
      } else {
        cy += GAP_HORA - GAP_BADGE
      }

      // ── Título ──
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9.5)
      doc.setTextColor(20, 12, 55)
      const titleLines = doc.splitTextToSize(act.titulo || '(sin título)', innerW) as string[]
      titleLines.forEach(line => { doc.text(line, innerX, cy); cy += lh(9.5) })
      cy += GAP_TITLE

      // ── Contenido ──
      for (const ln of lineas(act, innerW)) {
        cy += ln.gap ?? 0
        doc.setFont('helvetica', ln.bold ? 'bold' : ln.italic ? 'italic' : 'normal')
        doc.setFontSize(ln.size)
        const [r2, g2, b2] = ln.color ?? [60, 60, 60]
        doc.setTextColor(r2, g2, b2)
        const wrapped = ln.wrap ? (doc.splitTextToSize(ln.txt, innerW) as string[]) : [ln.txt]
        wrapped.forEach(line => { doc.text(line, innerX, cy); cy += lh(ln.size) })
      }

      return h
    }

    // ── detectarBloques ───────────────────────────────────────
    // En un programa de congreso, las actividades paralelas son las que
    // empiezan a la misma hora. Agrupar por solapamiento transitivo produce
    // columnas falsas cuando una actividad "puente" enlaza dos franjas que
    // en realidad no se superponen (ej: 11-12:30 + 12-13:30 + 13-14:30).
    function detectarBloques(acts: Actividad[]) {
      const sorted = [...acts].sort((a, b) => a.horaInicio!.localeCompare(b.horaInicio!))
      const bloques: { actividades: Actividad[]; esSolo: boolean }[] = []
      let grupo: Actividad[] = []

      for (const act of sorted) {
        if (!grupo.length || act.horaInicio === grupo[0].horaInicio) {
          grupo.push(act)
        } else {
          bloques.push({ actividades: grupo, esSolo: grupo.length === 1 })
          grupo = [act]
        }
      }
      if (grupo.length) bloques.push({ actividades: grupo, esSolo: grupo.length === 1 })
      return bloques
    }

    // ── Encabezado de página ──────────────────────────────────
    function dibujarEncabezado(titulo: string) {
      doc.setFillColor(35, 22, 81)
      doc.rect(0, 0, PW, HEADER_H, 'F')
      // Línea inferior naranja — distingue del programa público
      doc.setFillColor(232, 162, 58)
      doc.rect(0, HEADER_H - 1, PW, 1, 'F')
      // Etiqueta derecha
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(140, 130, 180)
      doc.text('DISTRIBUCIÓN INTERNA · JORNADAS IA EN DEBATE · FHyA UNR 2026', PW - MR, 9, { align: 'right' })
      // Título del día / sección
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.setTextColor(255, 255, 255)
      doc.text(titulo, ML, 16.5)
    }

    // ── Volcar una lista de actividades en página ─────────────
    // Devuelve la nueva y tras escribir
    function volcarActividades(acts: Actividad[], yStart: number, titulo: string): number {
      let y = yStart
      const bloques = detectarBloques(acts.filter(a => a.horaInicio && a.horaFin))
      const sinHorario = acts.filter(a => !a.horaInicio || !a.horaFin)

      for (const bloque of bloques) {
        const n     = bloque.actividades.length
        const cardW = n === 1 ? CW : (CW - CARD_GAP * (n - 1)) / n
        const blockH = Math.max(...bloque.actividades.map(a => medirCard(a, cardW)))

        if (y + blockH > PH - MB) {
          doc.addPage()
          dibujarEncabezado(titulo)
          y = HEADER_H + 4
        }

        const ordenadas = [...bloque.actividades].sort((a, b) => {
          const ia = SALAS.indexOf(a.sala ?? '')
          const ib = SALAS.indexOf(b.sala ?? '')
          if (ia === -1 && ib === -1) return 0
          if (ia === -1) return 1
          if (ib === -1) return -1
          return ia - ib
        })

        ordenadas.forEach((act, i) => {
          dibujarCard(act, ML + i * (cardW + CARD_GAP), y, cardW)
        })

        y += blockH + CARD_GAP
      }

      // Actividades sin horario al final
      if (sinHorario.length > 0) {
        y += 3
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7)
        doc.setTextColor(150, 140, 170)
        doc.text('SIN HORARIO ASIGNADO', ML, y + 3.5)
        y += 7

        for (const act of sinHorario) {
          const h = medirCard(act, CW)
          if (y + h > PH - MB) {
            doc.addPage()
            dibujarEncabezado(titulo)
            y = HEADER_H + 4
          }
          dibujarCard(act, ML, y, CW)
          y += h + CARD_GAP
        }
      }

      return y
    }

    // ── Iteración por días ────────────────────────────────────
    FECHAS_JORNADA.forEach((dia, dIdx) => {
      if (dIdx > 0) doc.addPage()
      dibujarEncabezado(dia.etiqueta)

      const actsDelDia = actividades
        .filter(a => a.fecha === dia.valor)
        .sort((a, b) => (a.horaInicio ?? 'ZZ').localeCompare(b.horaInicio ?? 'ZZ'))

      if (actsDelDia.length === 0) {
        doc.setFont('helvetica', 'italic')
        doc.setFontSize(9)
        doc.setTextColor(160, 160, 160)
        doc.text('Sin actividades para este día.', ML, HEADER_H + 10)
        return
      }

      volcarActividades(actsDelDia, HEADER_H + 4, dia.etiqueta)
    })

    // ── Página final: sin fecha ───────────────────────────────
    const sinFecha = actividades
      .filter(a => !a.fecha)
      .sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'))

    if (sinFecha.length > 0) {
      doc.addPage()
      dibujarEncabezado('SIN FECHA ASIGNADA')
      volcarActividades(sinFecha, HEADER_H + 4, 'SIN FECHA ASIGNADA')
    }

    doc.save(`distribucion-${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  // ── DragOverlay content ──────────────────────────────────

  const overlayActividadAct = activeItem?.type === 'actividad'
    ? actsDia.find(a => a.id === activeItem.id)
    : null

  const overlayPropuesta = activeItem?.type === 'propuesta'
    ? propuestas.find(p => p.id === activeItem.id)
    : null

  // ── Render ───────────────────────────────────────────────

  if (loadAct || loadProp || loadInv) return (
    <div className="admin-module">
      <h2 className="admin-module__title">Distribución</h2>
      <p style={{ color: 'rgba(35,22,81,0.3)', fontSize: '0.82rem' }}>Cargando...</p>
    </div>
  )

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="admin-module" style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: '2rem', alignItems: 'start' }}>

        {/* ── Columna izquierda: grilla ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '0.25rem' }}>
            <h2 className="admin-module__title" style={{ margin: 0 }}>Distribución</h2>
            <button
              className="admin-btn admin-btn--ghost"
              style={{ fontSize: '0.78rem', padding: '0.2rem 0.6rem', marginLeft: 'auto' }}
              onClick={descargarPDF}
            >
              ↓ PDF
            </button>
          </div>

          {/* Tabs por día */}
          <div style={{ display: 'flex', marginBottom: '1.75rem', borderBottom: '1px solid rgba(35,22,81,0.1)' }}>
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

          <GrillaHorarios
            actividades={actsDia}
            propuestas={propuestas}
            invitados={invitados}
            pxPerMin={pxPerMin}
            activeItem={activeItem}
            onVerDetalle={setDetalleActId}
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

        {/* ── Panel derecho: pool de propuestas ── */}
        <PoolPropuestas
          propuestas={propuestas}
          actividades={actividades}
          activeItem={activeItem}
          onAgregar={onAgregar}
        />

      </div>

      {/* ── Ghost durante el drag ── */}
      <DragOverlay>
        {overlayActividadAct && (
          <div style={{ height: H_HANDLE, background: 'var(--c-white)', borderLeft: `4px solid ${tipoColor(overlayActividadAct.tipo)}`, borderRadius: '0 2px 2px 0', boxShadow: '0 4px 12px rgba(35,22,81,0.15)', padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'center', opacity: 0.95 }}>
            <span style={{ fontSize: '0.6rem', color: tipoColor(overlayActividadAct.tipo), fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>
              {tipoLabel(overlayActividadAct)}
            </span>
            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--c-dark)', lineHeight: 1.2 }}>
              {overlayActividadAct.titulo || '(sin título)'}
            </span>
          </div>
        )}
        {overlayPropuesta && (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', padding: '0.3rem 0.6rem', background: 'var(--c-white)', borderRadius: 2, boxShadow: '0 4px 12px rgba(35,22,81,0.15)', opacity: 0.95 }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--c-dark)' }}>
              {overlayPropuesta.autor.nombre}
            </span>
            <span style={{ fontSize: '0.65rem', color: 'rgba(35,22,81,0.4)' }}>
              Eje {overlayPropuesta.eje}
            </span>
          </div>
        )}
      </DragOverlay>

      {/* ── Modal de detalle ── */}
      {detalleActId && (() => {
        const act = actividades.find(a => a.id === detalleActId)
        if (!act) return null
        return (
          <DetalleModal
            act={act}
            propuestas={propuestas}
            invitados={invitados}
            onCerrar={() => setDetalleActId(null)}
          />
        )
      })()}

    </DndContext>
  )
}
