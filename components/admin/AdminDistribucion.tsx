// components/admin/AdminDistribucion.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import jsPDF      from 'jspdf'
import autoTable  from 'jspdf-autotable'
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
import { CONGRESO, PROPUESTAS_COMPATIBLES, TIPOS_PROPUESTA, PERTENENCIAS, ESTADOS_PROPUESTA } from '@/congreso.config'
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

    // ── Colores por tipo (RGB) ────────────────────────────────
    const TYPE_RGB: Record<string, [number, number, number]> = {
      conferencia: [ 77, 204, 189],
      panel:       [124,  92, 191],
      mesa:        [232, 162,  58],
      pósters:     [ 58, 116, 171],
      otro:        [136, 136, 136],
    }
    const tipoRgb = (tipo: string): [number, number, number] => TYPE_RGB[tipo] ?? [136, 136, 136]
    // Mezcla el color con blanco al α dado (simula un fondo translúcido)
    const lighten = ([r, g, b]: [number, number, number], a = 0.10): [number, number, number] => [
      Math.round(255 + a * (r - 255)),
      Math.round(255 + a * (g - 255)),
      Math.round(255 + a * (b - 255)),
    ]

    // ── Layout A4 portrait ────────────────────────────────────
    const ML = 10, MR = 8, MT = 8, MB = 6
    const TITLE_H  = 10   // alto bloque título
    const ROOM_H   = 8    // alto cabecera de salas
    const TIME_W   = 12   // ancho columna de horas
    const DAY_S    = toMin('08:00')
    const DAY_E    = toMin('21:00')
    const TOTAL_M  = DAY_E - DAY_S

    const gridL    = ML + TIME_W
    const gridT    = MT + TITLE_H + ROOM_H
    const gridR    = 210 - MR       // A4 portrait: 210mm de ancho
    const gridB    = 297 - MB       // A4 portrait: 297mm de alto
    const gridW    = gridR - gridL
    const gridH    = gridB - gridT
    const mmPerMin = gridH / TOTAL_M

    const timeToY  = (t: string) => gridT + (toMin(t) - DAY_S) * mmPerMin
    const HOUR_LBL = Array.from({ length: 14 }, (_, i) => `${String(8 + i).padStart(2, '0')}:00`)

    // ── Una página por día: grilla gráfica ───────────────────
    FECHAS_JORNADA.forEach((dia, diaIdx) => {
      if (diaIdx > 0) doc.addPage()   // primera jornada usa la página inicial

      // Título del día
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(13)
      doc.setTextColor(35, 22, 81)
      doc.text(dia.etiqueta, ML, MT + 8)

      const actsDia = actividades
        .filter(a => a.fecha === dia.valor && a.horaInicio && a.horaFin)

      if (actsDia.length === 0) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(160, 160, 170)
        doc.text('Sin actividades para este día.', ML, MT + TITLE_H + 5)
        return
      }

      // Salas del día ordenadas igual que en la grilla
      const salas = [...new Set(actsDia.map(a => a.sala ?? ''))].sort((a, b) => {
        if (!a && b) return 1
        if (a && !b) return -1
        return a.localeCompare(b, 'es')
      })
      const colW    = gridW / salas.length
      const salaToX = (sala: string) => gridL + salas.indexOf(sala ?? '') * colW

      // ── Cabecera de salas ──
      const roomY = MT + TITLE_H
      doc.setFillColor(35, 22, 81)
      doc.rect(gridL, roomY, gridW, ROOM_H, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(255, 255, 255)
      salas.forEach((sala, i) => {
        const cx = gridL + i * colW + colW / 2
        const label = sala || 'Sin sala'
        // Truncar si no cabe (aprox 1 char ≈ 2mm a 8pt)
        const maxChars = Math.floor(colW / 2.0)
        doc.text(label.length > maxChars ? label.slice(0, maxChars - 1) + '…' : label,
          cx, roomY + ROOM_H * 0.68, { align: 'center' })
      })

      // ── Fondo de grilla ──
      doc.setFillColor(250, 251, 253)
      doc.rect(gridL, gridT, gridW, gridH, 'F')

      // ── Líneas de hora + etiquetas ──
      doc.setFont('helvetica', 'normal')
      HOUR_LBL.forEach(h => {
        const y = timeToY(h)
        doc.setFontSize(7.5)
        doc.setTextColor(140, 140, 155)
        doc.text(h, ML + TIME_W - 1.5, y + 1.2, { align: 'right' })
        doc.setDrawColor(210, 212, 228)
        doc.setLineWidth(0.15)
        doc.line(gridL, y, gridR, y)
      })

      // ── Separadores verticales entre salas ──
      doc.setDrawColor(200, 202, 218)
      doc.setLineWidth(0.2)
      for (let i = 1; i < salas.length; i++) {
        const x = gridL + i * colW
        doc.line(x, gridT, x, gridB)
      }

      // ── Tarjetas de actividad ──
      for (const act of actsDia) {
        const GAP = 1.2
        const ax  = salaToX(act.sala ?? '') + GAP
        const ay  = timeToY(act.horaInicio!)
        const aw  = colW - GAP * 2
        const ah  = Math.max((toMin(act.horaFin!) - toMin(act.horaInicio!)) * mmPerMin - 0.5, 4)
        const rgb = tipoRgb(act.tipo)
        const fill = lighten(rgb, 0.10)

        // Fondo y borde
        doc.setFillColor(fill[0], fill[1], fill[2])
        doc.setDrawColor(rgb[0], rgb[1], rgb[2])
        doc.setLineWidth(0.15)
        doc.roundedRect(ax, ay, aw, ah, 0.5, 0.5, 'FD')

        // Barra de color izquierda
        const barW = 2.0
        doc.setFillColor(rgb[0], rgb[1], rgb[2])
        doc.rect(ax, ay, barW, ah, 'F')

        // Texto
        const tx   = ax + barW + 1.5
        const tw   = aw - barW - 2.5
        let   ty   = ay + 4.5
        const maxY = ay + ah - 1.5

        // Tipo
        if (ah >= 6 && ty < maxY) {
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(6)
          doc.setTextColor(rgb[0], rgb[1], rgb[2])
          doc.text(tipoLabel(act).toUpperCase(), tx, ty)
          ty += 3.5
        }

        // Título
        if (ah >= 10 && ty < maxY) {
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(7.5)
          doc.setTextColor(35, 22, 81)
          const lines  = doc.splitTextToSize(act.titulo || '(sin título)', tw) as string[]
          const nLines = Math.min(lines.length, Math.floor((maxY - ty) / 3.2))
          if (nLines > 0) {
            doc.text(lines.slice(0, nLines), tx, ty)
            ty += nLines * 3.2 + 1.0
          }
        }

        // Participantes
        if (ah >= 12 && ty < maxY) {
          const asignadas = propuestas.filter(p => p.actividadId === act.id)
          const inv       = act.invitadoId ? invitados.find(i => i.id === act.invitadoId) : null
          let names: string[] = []
          if (act.tipo === 'conferencia' && inv) {
            names = [inv.nombre]
          } else if (act.tipo === 'mesa' || act.tipo === 'pósters') {
            names = asignadas.map(p => p.autor.nombre)
          } else if (act.tipo === 'panel' && asignadas.length > 0) {
            // Panel con propuesta asignada: autor + participantes de la propuesta
            const prop = asignadas[0]
            names = [prop.autor.nombre, ...(prop.participantes ?? []).map(p => p.nombre)]
          } else {
            // Panel sin propuesta o tipo 'otro': participantes manuales
            names = (act.participantes ?? []).map(p => p.nombre)
          }

          doc.setFont('helvetica', 'normal')
          doc.setFontSize(7.5)
          doc.setTextColor(60, 40, 90)
          const lineH   = 3.5
          const maxN    = Math.max(0, Math.floor((maxY - ty) / lineH) - 1)
          const visible = names.slice(0, maxN)
          visible.forEach(name => {
            if (ty < maxY) { doc.text(`· ${name}`, tx, ty); ty += lineH }
          })
          if (names.length > visible.length && ty < maxY) {
            doc.setTextColor(130, 110, 160)
            doc.text(`+${names.length - visible.length} más`, tx, ty)
          }
        }
      }

      // ── Borde exterior de la grilla ──
      doc.setDrawColor(180, 182, 205)
      doc.setLineWidth(0.3)
      doc.rect(gridL, gridT, gridW, gridH)
    })

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
