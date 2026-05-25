'use client'
// components/Programa.tsx
// Vista pública del programa de la jornada.
// Fuente de datos: colección 'actividades' (+ propuestas e invitados para resolver participantes).

import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import jsPDF from 'jspdf'
import { useActividades } from '@/lib/hooks/useActividades'
import { usePropuestas }  from '@/lib/hooks/usePropuestas'
import { useInvitados }   from '@/lib/hooks/useInvitados'
import { CONGRESO, SALAS } from '@/congreso.config'
import type { Actividad, Propuesta, Invitado, ParticipantePanel } from '@/types'

// ── Fechas de jornada ─────────────────────────────────────────

const FECHAS = [0, 1, 2].map(d => {
  const ms      = CONGRESO.fechaInicio.getTime() + d * 86_400_000
  const valor   = new Date(ms).toISOString().slice(0, 10)
  const etiqueta = new Date(valor + 'T12:00:00')
    .toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
    .toUpperCase()
  return { valor, etiqueta }
})

// ── Paleta por tipo ───────────────────────────────────────────

const PALETA: Record<string, { border: string; bg: string; rgb: [number, number, number] }> = {
  conferencia: { border: '#2e7d4f', bg: '#edf7f1', rgb: [46, 125, 79]   },
  panel:       { border: '#7c5cbf', bg: '#f3f0fb', rgb: [124, 92, 191]  },
  mesa:        { border: '#6b7280', bg: '#f5f5f6', rgb: [107, 114, 128] },
  pósters:     { border: '#2374ab', bg: '#eef5fb', rgb: [35, 116, 171]  },
  otro:        { border: '#e8a23a', bg: '#fdf6ec', rgb: [232, 162, 58]  },
}
const paleta = (tipo: string) => PALETA[tipo] ?? PALETA.otro

const TIPO_LABEL: Record<string, string> = {
  conferencia: 'Conferencia',
  panel:       'Panel',
  mesa:        'Mesa de ponencias',
  pósters:     'Sesión de pósters',
  otro:        'Otro',
}
function tipoLabel(act: Actividad) {
  return act.tipo === 'otro' && act.descriptor ? act.descriptor : (TIPO_LABEL[act.tipo] ?? act.tipo)
}

// ── Detección de bloques concurrentes ─────────────────────────

type Bloque = {
  horaInicio:  string
  horaFin:     string
  actividades: Actividad[]
  esSolo:      boolean   // true → ocupa el ancho completo
}

function detectarBloques(acts: Actividad[]): Bloque[] {
  const sorted = [...acts]
    .filter(a => a.horaInicio && a.horaFin)
    .sort((a, b) => a.horaInicio!.localeCompare(b.horaInicio!))

  const bloques: Bloque[] = []
  let grupo: Actividad[] = []
  let finGrupo = ''

  for (const act of sorted) {
    if (!grupo.length) {
      grupo = [act]; finGrupo = act.horaFin!
    } else if (act.horaInicio! < finGrupo) {
      grupo.push(act)
      if (act.horaFin! > finGrupo) finGrupo = act.horaFin!
    } else {
      bloques.push(makeBloque(grupo, finGrupo))
      grupo = [act]; finGrupo = act.horaFin!
    }
  }
  if (grupo.length) bloques.push(makeBloque(grupo, finGrupo))
  return bloques
}

function makeBloque(acts: Actividad[], finGrupo: string): Bloque {
  return { horaInicio: acts[0].horaInicio!, horaFin: finGrupo, actividades: acts, esSolo: acts.length === 1 }
}

// ── Helpers de participantes ──────────────────────────────────

type PartSimple = {
  nombre:           string
  institucion?:     string
  tituloPonencia?:  string
  invitadoId?:      string   // → foto si existe en la colección invitados
  esCoordinador?:   boolean  // se muestra "(coordinador)" junto al nombre
}

const ncP = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')

function participantesPanel(act: Actividad, propuesta?: Propuesta): PartSimple[] {
  // Nombre del coordinador: explícito en la actividad, o el autor de la propuesta.
  // En paneles cargados como propuesta, el autor ES el coordinador; su título
  // en propuesta.titulo es el del panel (no su ponencia individual). Los
  // participantes, incluyendo al coordinador, se listan en propuesta.participantes[]
  // con sus títulos individuales correctos.
  const coordName = act.coordinador ?? propuesta?.autor.nombre

  let partes: PartSimple[] = propuesta
    ? (propuesta.participantes ?? []).map(p => ({
        nombre: p.nombre, institucion: p.institucion, tituloPonencia: p.tituloPonencia,
      }))
    : (act.participantes ?? []).map(p => ({
        nombre: p.nombre, institucion: p.institucion,
        tituloPonencia: p.tituloPonencia, invitadoId: p.invitadoId,
      }))

  // Coordinador: marcar en la lista si ya aparece, o agregar al frente si no está.
  if (coordName) {
    const coordNc = ncP(coordName)
    const idx = partes.findIndex(p => ncP(p.nombre) === coordNc)
    if (idx >= 0) {
      partes[idx] = { ...partes[idx], esCoordinador: true }
      const [coord] = partes.splice(idx, 1)
      partes.unshift(coord)
    } else {
      // No está en participantes: agregar con los datos del autor si coincide
      const fromAutor = propuesta && ncP(propuesta.autor.nombre) === coordNc
      partes.unshift(fromAutor
        ? { nombre: propuesta!.autor.nombre, institucion: propuesta!.autor.institucion, esCoordinador: true }
        : { nombre: coordName, esCoordinador: true }
      )
    }
  }

  return partes
}

// ── Micro-componentes ─────────────────────────────────────────

function Label({ children, color }: { children: ReactNode; color: string }) {
  return (
    <span style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color }}>
      {children}
    </span>
  )
}

function Hora({ act, color }: { act: Actividad; color?: string }) {
  if (!act.horaInicio || !act.horaFin) return null
  return (
    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: color ?? 'rgba(35,22,81,0.38)', flexShrink: 0 }}>
      {act.horaInicio} – {act.horaFin}
    </span>
  )
}

function SalaBadge({ sala, color }: { sala?: string; color?: string }) {
  if (!sala) return null
  const bg  = color ? `${color}18` : 'rgba(35,22,81,0.06)'
  const txt = color ?? 'rgba(35,22,81,0.45)'
  return (
    <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 9px', background: bg, borderRadius: 12, color: txt, border: `1px solid ${color ? color + '35' : 'transparent'}` }}>
      {sala}
    </span>
  )
}

function Divisor({ label }: { label: string }) {
  return (
    <p style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(35,22,81,0.28)', margin: '0.9rem 0 0.45rem' }}>
      {label}
    </p>
  )
}

function CardWrap({ tipo, esSolo, children }: { tipo: string; esSolo: boolean; children: ReactNode }) {
  const { border, bg } = paleta(tipo)
  return (
    <div style={{
      background:   bg,
      borderLeft:   `4px solid ${border}`,
      borderRadius: '0 8px 8px 0',
      padding:      esSolo ? '1.5rem 1.75rem' : '1.1rem 1.25rem',
      height:       '100%',
      boxSizing:    'border-box',
    }}>
      {children}
    </div>
  )
}

function CardHeader({
  act, esSolo, sala,
}: { act: Actividad; esSolo: boolean; sala?: string }) {
  const { border } = paleta(act.tipo)
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.3rem' }}>
        <Label color={border}>{tipoLabel(act)}</Label>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <SalaBadge sala={sala} color={border} />
          <Hora act={act} color={border} />
        </div>
      </div>
      <h3 style={{
        margin: '0.15rem 0 0.7rem',
        fontSize: esSolo ? '1.3rem' : '1rem',
        fontWeight: 700, color: 'var(--c-dark)', lineHeight: 1.25,
      }}>
        {act.titulo}
      </h3>
    </>
  )
}

function LineaParticipante({ p, esSolo, borderColor, invitados }: {
  p:           PartSimple
  esSolo:      boolean
  borderColor: string
  invitados:   Invitado[]
}) {
  const invitado = p.invitadoId ? invitados.find(i => i.id === p.invitadoId) : undefined
  const fotoSize = esSolo ? 48 : 36

  const nombreNode = (
    <p style={{ fontSize: '0.88rem', fontWeight: 600, margin: '0 0 0.08rem', color: 'var(--c-dark)' }}>
      {p.nombre}
      {p.esCoordinador && (
        <span style={{ fontSize: '0.72rem', fontWeight: 400, color: 'rgba(35,22,81,0.42)', marginLeft: '0.4rem' }}>
          (coordinador/a)
        </span>
      )}
    </p>
  )

  const institucionNode = p.institucion && (
    <p style={{ fontSize: '0.75rem', color: 'rgba(35,22,81,0.45)', margin: '0 0 0.12rem' }}>
      {p.institucion}
    </p>
  )

  const ponenciaNode = p.tituloPonencia && (
    <p style={{ fontSize: '0.85rem', fontStyle: 'italic', color: 'rgba(35,22,81,0.62)', margin: 0, lineHeight: 1.45 }}>
      {p.tituloPonencia}
    </p>
  )

  if (invitado) {
    return (
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
        <FotoCirculo src={invitado.foto} alt={p.nombre} size={fotoSize} borderColor={borderColor} />
        <div style={{ minWidth: 0 }}>
          {nombreNode}
          {institucionNode}
          {ponenciaNode}
        </div>
      </div>
    )
  }

  return (
    <div style={{ paddingLeft: '0.85rem', borderLeft: `2px solid ${borderColor}55` }}>
      {nombreNode}
      {institucionNode}
      {ponenciaNode}
    </div>
  )
}

function Moderador({ nombre }: { nombre: string }) {
  return (
    <p style={{ fontSize: '0.74rem', color: 'rgba(35,22,81,0.38)', margin: '0.7rem 0 0' }}>
      Modera: <strong>{nombre}</strong>
    </p>
  )
}

const PLACEHOLDER = '/invitados/placeholder.jpg'

function FotoCirculo({ src, alt, size, borderColor }: {
  src?:        string
  alt:         string
  size:        number
  borderColor: string
}) {
  const borderPx = size >= 80 ? 3 : 2
  return (
    <img
      src={src || PLACEHOLDER}
      alt={alt}
      onError={e => { e.currentTarget.src = PLACEHOLDER }}
      style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: `${borderPx}px solid ${borderColor}`, flexShrink: 0 }}
    />
  )
}

// ── Tarjetas por tipo ─────────────────────────────────────────

function TarjetaConferencia({ act, invitado, esSolo }: {
  act: Actividad; invitado?: Invitado; esSolo: boolean
}) {
  const { border } = paleta('conferencia')
  const conFoto  = esSolo && !!invitado

  return (
    <CardWrap tipo="conferencia" esSolo={esSolo}>

      {/* Fila tipo + sala + hora — igual que el resto de las actividades */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.3rem' }}>
        <Label color={border}>{tipoLabel(act)}</Label>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <SalaBadge sala={act.sala} color={border} />
          <Hora act={act} color={border} />
        </div>
      </div>

      {/* Fila: foto + columna derecha con título y datos del invitado */}
      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', marginBottom: invitado ? '0.9rem' : '0.5rem' }}>

        {conFoto && (
          <div style={{ marginTop: '0.4rem' }}>
            <FotoCirculo src={invitado!.foto} alt={invitado!.nombre} size={96} borderColor={border} />
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Título */}
          <h3 style={{ margin: '0.15rem 0 0.5rem', fontSize: esSolo ? '1.25rem' : '1rem', fontWeight: 700, color: 'var(--c-dark)', lineHeight: 1.25 }}>
            {act.titulo}
          </h3>

          {/* Nombre e institución del invitado */}
          {invitado && (
            <>
              <p style={{ fontSize: '0.95rem', fontWeight: 600, margin: '0 0 0.1rem', color: 'var(--c-dark)' }}>
                {invitado.nombre}
              </p>
              <p style={{ fontSize: '0.8rem', color: 'rgba(35,22,81,0.48)', margin: 0 }}>
                {[invitado.rol, invitado.institucion].filter(Boolean).join(' · ')}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Bio — full width, debajo de la fila foto+datos */}
      {esSolo && invitado?.bio && (
        <p style={{ fontSize: '0.9rem', color: 'rgba(35,22,81,0.62)', lineHeight: 1.65, margin: '0 0 0.85rem' }}>
          {invitado.bio}
        </p>
      )}

      {/* Resumen — full width */}
      {esSolo && act.resumen && (
        <>
          <Divisor label="Resumen" />
          <p style={{ fontSize: '0.9rem', color: 'rgba(35,22,81,0.62)', lineHeight: 1.65, margin: 0 }}>
            {act.resumen}
          </p>
        </>
      )}

      {act.moderador && <Moderador nombre={act.moderador} />}
    </CardWrap>
  )
}

function TarjetaPanel({ act, propuesta, esSolo, invitados }: {
  act: Actividad; propuesta?: Propuesta; esSolo: boolean; invitados: Invitado[]
}) {
  const { border } = paleta('panel')
  const partes = participantesPanel(act, propuesta)

  return (
    <CardWrap tipo="panel" esSolo={esSolo}>
      <CardHeader act={act} esSolo={esSolo} sala={act.sala} />

      {partes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: esSolo ? '0.9rem' : '0.45rem' }}>
          {partes.map((p, i) => (
            <LineaParticipante key={i} p={p} esSolo={esSolo} borderColor={border} invitados={invitados} />
          ))}
        </div>
      )}

      {esSolo && propuesta?.resumen && (
        <>
          <Divisor label="Resumen" />
          <p style={{ fontSize: '0.9rem', color: 'rgba(35,22,81,0.62)', lineHeight: 1.65, margin: 0 }}>
            {propuesta.resumen}
          </p>
        </>
      )}

      {act.moderador && <Moderador nombre={act.moderador} />}
    </CardWrap>
  )
}

function TarjetaMesa({ act, propuestas, esSolo }: {
  act: Actividad; propuestas: Propuesta[]; esSolo: boolean
}) {
  const { border } = paleta(act.tipo)
  const asignadas  = propuestas.filter(p => p.actividadId === act.id)

  return (
    <CardWrap tipo={act.tipo} esSolo={esSolo}>
      <CardHeader act={act} esSolo={esSolo} sala={act.sala} />

      {asignadas.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: esSolo ? '1.1rem' : '0.6rem' }}>
          {asignadas.map(prop => {
            const autores = [prop.autor, ...(prop.coautores ?? [])]
            return (
              <div key={prop.id} style={{ paddingLeft: '0.85rem', borderLeft: `2px solid ${border}55` }}>
                <p style={{ fontSize: '0.86rem', fontWeight: 600, margin: '0 0 0.08rem', color: 'var(--c-dark)' }}>
                  {autores.map(a => a.nombre).join(' · ')}
                </p>
                {prop.autor.institucion && (
                  <p style={{ fontSize: '0.74rem', color: 'rgba(35,22,81,0.42)', margin: '0 0 0.2rem' }}>
                    {prop.autor.institucion}
                  </p>
                )}
                <p style={{ fontSize: '0.86rem', fontStyle: 'italic', color: 'rgba(35,22,81,0.65)', margin: '0 0 0.2rem', lineHeight: 1.45 }}>
                  {prop.titulo}
                </p>
                {esSolo && prop.resumen && (
                  <p style={{ fontSize: '0.85rem', color: 'rgba(35,22,81,0.55)', lineHeight: 1.55, margin: 0 }}>
                    {prop.resumen}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {act.moderador && <Moderador nombre={act.moderador} />}
    </CardWrap>
  )
}

function TarjetaOtro({ act, esSolo, invitados }: {
  act: Actividad; esSolo: boolean; invitados: Invitado[]
}) {
  const { border } = paleta('otro')
  const partes: PartSimple[] = (act.participantes ?? []).map(p => ({
    nombre: p.nombre, institucion: p.institucion, tituloPonencia: p.tituloPonencia,
    invitadoId: p.invitadoId,
  }))

  return (
    <CardWrap tipo="otro" esSolo={esSolo}>
      <CardHeader act={act} esSolo={esSolo} sala={act.sala} />
      {esSolo && act.descripcion && (
        <p style={{ fontSize: '0.9rem', color: 'rgba(35,22,81,0.6)', lineHeight: 1.6, margin: '0 0 0.75rem' }}>
          {act.descripcion}
        </p>
      )}
      {partes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: esSolo ? '0.75rem' : '0.4rem' }}>
          {partes.map((p, i) => (
            <LineaParticipante key={i} p={p} esSolo={esSolo} borderColor={border} invitados={invitados} />
          ))}
        </div>
      )}
    </CardWrap>
  )
}

// ── Dispatcher de tarjetas ────────────────────────────────────

function TarjetaActividad({ act, propuestas, invitados, esSolo }: {
  act:       Actividad
  propuestas: Propuesta[]
  invitados:  Invitado[]
  esSolo:     boolean
}) {
  const invitado  = act.invitadoId ? invitados.find(i => i.id === act.invitadoId)  : undefined
  const propuesta = propuestas.find(p => p.actividadId === act.id)

  if (act.tipo === 'conferencia') return <TarjetaConferencia act={act} invitado={invitado} esSolo={esSolo} />
  if (act.tipo === 'panel')       return <TarjetaPanel act={act} propuesta={propuesta} esSolo={esSolo} invitados={invitados} />
  if (act.tipo === 'mesa' || act.tipo === 'pósters') return <TarjetaMesa act={act} propuestas={propuestas} esSolo={esSolo} />
  return <TarjetaOtro act={act} esSolo={esSolo} invitados={invitados} />
}

// ── Bloque horario ────────────────────────────────────────────

function BloqueHorario({ bloque, propuestas, invitados }: {
  bloque:     Bloque
  propuestas: Propuesta[]
  invitados:  Invitado[]
}) {
  const { actividades, esSolo } = bloque

  if (esSolo) {
    return (
      <div style={{ marginBottom: '1.5rem' }}>
        <TarjetaActividad
          act={actividades[0]}
          propuestas={propuestas}
          invitados={invitados}
          esSolo
        />
      </div>
    )
  }

  // Actividades paralelas: agrupar por sala en columnas
  const salas = [...new Set(actividades.map(a => a.sala ?? ''))].sort((a, b) => {
    if (!a && b) return 1; if (a && !b) return -1
    return a.localeCompare(b, 'es')
  })

  return (
    <div style={{ marginBottom: '1.75rem' }}>
      {/* Cabeceras de sala — actúan también como separador de bloque */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem' }}>
        {salas.map(sala => (
          <div key={sala} style={{
            flex: 1,
            fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.1em', color: 'rgba(35,22,81,0.38)',
            textAlign: 'center', paddingBottom: '0.4rem',
            borderBottom: '2px solid rgba(35,22,81,0.08)',
          }}>
            {sala || ''}
          </div>
        ))}
      </div>

      {/* Columnas */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
        {salas.map(sala => (
          <div key={sala} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {actividades
              .filter(a => (a.sala ?? '') === sala)
              .map(act => (
                <TarjetaActividad
                  key={act.id}
                  act={act}
                  propuestas={propuestas}
                  invitados={invitados}
                  esSolo={false}
                />
              ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── PDF ───────────────────────────────────────────────────────
// Genera un PDF con tarjetas visuales por actividad, similar al diseño web:
// borde izquierdo de color, badge de tipo, hora/sala, título y contenido.

function buildPDF(
  actividades: Actividad[],
  propuestas:  Propuesta[],
  invitados:   Invitado[],
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  // ── Constantes de página ──
  const PW = 210, PH = 297
  const ML = 10, MR = 10, HEADER_H = 22, MB = 12
  const CW = PW - ML - MR          // 190 mm de ancho útil
  const BORDER_W = 2.5             // barra izquierda de color
  const PAD_H    = 4               // padding horizontal interno
  const PAD_V    = 3.5             // padding vertical interno
  const CARD_GAP = 2.5             // separación entre tarjetas
  const BADGE_H  = 4               // alto del badge de tipo

  // ── Helpers de color ──
  function hexToRgb(hex: string): [number, number, number] {
    const n = parseInt(hex.replace('#', ''), 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  }
  function tintRgb(hex: string, alpha = 0.1): [number, number, number] {
    const [r, g, b] = hexToRgb(hex)
    return [
      Math.round(255 - (255 - r) * alpha),
      Math.round(255 - (255 - g) * alpha),
      Math.round(255 - (255 - b) * alpha),
    ]
  }

  // ── Altura de línea en mm ──
  const lh = (size: number) => size * 0.352778 * 1.5

  // ── Contenido tipado de cada actividad ──
  // gap: espacio extra en mm ANTES de esta línea (separación entre grupos)
  type Linea = { txt: string; size: number; bold?: boolean; italic?: boolean; color?: [number,number,number]; wrap?: boolean; gap?: number }

  // Misma lógica que participantesPanel() en la web
  function partesPanel(act: Actividad): Array<{ nombre: string; institucion?: string; tituloPonencia?: string; esCoord: boolean }> {
    const ncL = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')
    const prop = propuestas.find(p => p.actividadId === act.id)
    const coordName = act.coordinador ?? prop?.autor.nombre

    let parts: Array<{ nombre: string; institucion?: string; tituloPonencia?: string; esCoord: boolean }> = prop
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

  function lineas(act: Actividad, innerW: number): Linea[] {
    const dark:  [number,number,number] = [30,  20,  60 ]
    const gray:  [number,number,number] = [70,  70,  70 ]
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
      const esDireto = !propuestas.some(p => p.actividadId === act.id)
      partesPanel(act).forEach((p, i) => {
        const nombre = p.nombre + (p.esCoord ? ' (coordinador/a)' : '')
        if (esDireto) {
          // Panel cargado directamente (ej: invitados): mismo estilo que Otro
          out.push({ txt: nombre, size: 8.5, bold: true, color: dark, gap: i > 0 ? 1.5 : 0 })
          if (p.institucion) out.push({ txt: p.institucion, size: 6.5, color: light })
        } else {
          // Panel desde propuesta: lista compacta con títulos de ponencias
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
        out.push({ txt: p.nombre, size: 8.5, bold: true, color: dark, gap: i > 0 ? 1.5 : 0 })
        if (p.institucion) out.push({ txt: p.institucion, size: 6.5, color: light })
      })
    }

    if (act.moderador) out.push({ txt: 'Modera: ' + act.moderador, size: 7, italic: true, color: light, gap: 2 })
    return out
  }

  // ── Constantes de layout interno de card ──
  const HORA_SIZE    = 7
  const GAP_BADGE    = 0.8   // badge → hora/sala  (pegados)
  const GAP_HORA     = 3.5   // hora/sala → título (más aire)
  const GAP_TITLE    = 2     // título → contenido

  // ── Medir altura de una tarjeta ──
  function medirCard(act: Actividad, w: number): number {
    const innerW = w - BORDER_W - PAD_H * 2
    let h = PAD_V

    // Badge
    h += BADGE_H + GAP_BADGE

    // Hora/sala en su propia línea
    const haHora = !!(act.horaInicio || act.sala)
    if (haHora) h += lh(HORA_SIZE) + GAP_HORA
    else         h += GAP_HORA - GAP_BADGE   // ajuste si no hay hora

    // Título
    doc.setFontSize(9.5)
    h += doc.splitTextToSize(act.titulo, innerW).length * lh(9.5) + GAP_TITLE

    // Contenido
    for (const ln of lineas(act, innerW)) {
      h += ln.gap ?? 0
      doc.setFontSize(ln.size)
      const n = ln.wrap ? doc.splitTextToSize(ln.txt, innerW).length : 1
      h += n * lh(ln.size)
    }

    h += PAD_V
    return h
  }

  // ── Dibujar una tarjeta ──
  function dibujarCard(act: Actividad, x: number, y: number, w: number): number {
    const h             = medirCard(act, w)
    const p             = paleta(act.tipo)
    const [cr, cg, cb]  = hexToRgb(p.border)
    const [tr, tg, tb]  = tintRgb(p.border, 0.09)
    const innerX        = x + BORDER_W + PAD_H
    const innerW        = w - BORDER_W - PAD_H * 2

    // Fondo tintado
    doc.setFillColor(tr, tg, tb)
    doc.rect(x, y, w, h, 'F')

    // Barra izquierda de color
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
    cy += BADGE_H + GAP_BADGE

    // ── Hora · Sala — línea propia debajo del badge ──
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
    const titleLines = doc.splitTextToSize(act.titulo, innerW) as string[]
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

  // ── Encabezado de día ──
  function dibujarEncabezado(dia: typeof FECHAS[0]) {
    doc.setFillColor(35, 22, 81)
    doc.rect(0, 0, PW, HEADER_H, 'F')

    // Línea decorativa inferior
    doc.setFillColor(77, 204, 189)   // turquesa
    doc.rect(0, HEADER_H - 1, PW, 1, 'F')

    // Evento (derecha, chico)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(140, 130, 180)
    doc.text('JORNADAS: LA IA EN DEBATE · FHyA UNR 2026', PW - MR, 9, { align: 'right' })

    // Día (izquierda, grande)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(255, 255, 255)
    doc.text(dia.etiqueta, ML, 16.5)
  }

  // ── Iteración por días ──
  FECHAS.forEach((dia, dIdx) => {
    if (dIdx > 0) doc.addPage()
    dibujarEncabezado(dia)

    const actsDelDia = actividades
      .filter(a => a.fecha === dia.valor && a.horaInicio && a.mostrar !== false)
      .sort((a, b) => (a.horaInicio ?? '').localeCompare(b.horaInicio ?? ''))

    if (actsDelDia.length === 0) {
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(9)
      doc.setTextColor(160, 160, 160)
      doc.text('Sin actividades programadas.', ML, HEADER_H + 10)
      return
    }

    const bloques = detectarBloques(actsDelDia)
    let y = HEADER_H + 4

    for (const bloque of bloques) {
      const n     = bloque.actividades.length
      const cardW = n === 1 ? CW : (CW - CARD_GAP * (n - 1)) / n

      // Altura máxima del bloque
      const blockH = Math.max(...bloque.actividades.map(a => medirCard(a, cardW)))

      // Salto de página si no hay espacio
      if (y + blockH > PH - MB) {
        doc.addPage()
        dibujarEncabezado(dia)
        y = HEADER_H + 4
      }

      // Ordenar actividades del bloque por orden de sala (igual que la web)
      const ordenadas = [...bloque.actividades].sort((a, b) => {
        const ia = SALAS.indexOf(a.sala ?? '')
        const ib = SALAS.indexOf(b.sala ?? '')
        if (ia === -1 && ib === -1) return 0
        if (ia === -1) return 1
        if (ib === -1) return -1
        return ia - ib
      })

      // Dibujar tarjetas del bloque
      ordenadas.forEach((act, i) => {
        const cx = ML + i * (cardW + CARD_GAP)
        dibujarCard(act, cx, y, cardW)
      })

      y += blockH + CARD_GAP
    }
  })

  doc.save(`programa-jia-${new Date().toISOString().slice(0, 10)}.pdf`)
}

// ── Componente principal ──────────────────────────────────────

export default function Programa() {
  const { actividades, loading: loadActs, error: errorActs, cargar: recargar } = useActividades()
  const { propuestas,  loading: loadProps } = usePropuestas()
  const { invitados,   loading: loadInvs  } = useInvitados()
  const [diaActivo, setDiaActivo] = useState(FECHAS[0].valor)

  const loading = loadActs || loadProps || loadInvs

  const programaPorDia = useMemo(() =>
    FECHAS.map(dia => ({
      ...dia,
      bloques: detectarBloques(
        actividades.filter(a => a.fecha === dia.valor && a.mostrar !== false)
      ),
    })),
  [actividades])

  const diaData    = programaPorDia.find(d => d.valor === diaActivo)
  const hayPrograma = !loading && !errorActs && actividades.some(a => a.fecha)

  return (
    <main className="page">
      <div className="section">

        {/* Encabezado */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="section__eyebrow">10 · 11 · 12 de junio de 2026</div>
            <h1 className="section__title" style={{ margin: 0 }}>Programa</h1>
          </div>
          {hayPrograma && (
            <button
              onClick={() => buildPDF(actividades, propuestas, invitados)}
              style={{
                padding: '0.5rem 1.2rem',
                background: 'transparent',
                border: '1px solid rgba(35,22,81,0.18)',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: 'rgba(35,22,81,0.55)',
              }}
            >
              ↓ PDF
            </button>
          )}
        </div>

        {/* Aviso */}
        <p style={{ fontSize: '1rem', color: 'rgba(35,22,81,0.55)', marginBottom: '2.5rem', lineHeight: 1.6 }}>
          A partir del 20 de mayo estará disponible el programa completo con las propuestas de ponencias, relatos, pósters y paneles.
        </p>

        {loading && (
          <p style={{ color: 'rgba(35,22,81,0.3)', fontSize: '0.9rem' }}>Cargando programa...</p>
        )}

        {!loading && errorActs && (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'rgba(35,22,81,0.45)' }}>
            <p style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
              No se pudo cargar el programa. Verificá tu conexión e intentá nuevamente.
            </p>
            <button
              onClick={recargar}
              style={{
                padding: '0.5rem 1.4rem',
                background: 'var(--c-dark)',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 600,
              }}
            >
              Reintentar
            </button>
          </div>
        )}

        {!loading && !errorActs && !hayPrograma && (
          <div className="placeholder">
            <div>
              <p className="placeholder__title">Próximamente</p>
            </div>
          </div>
        )}

        {hayPrograma && (
          <>
            {/* Tabs por día */}
            <div style={{ display: 'flex', borderBottom: '2px solid rgba(35,22,81,0.1)', marginBottom: '2.5rem', gap: '0.1rem' }}>
              {FECHAS.map(dia => {
                const activo = diaActivo === dia.valor
                return (
                  <button
                    key={dia.valor}
                    onClick={() => setDiaActivo(dia.valor)}
                    style={{
                      padding:      '0.65rem 1.5rem',
                      fontSize:     '0.82rem',
                      fontWeight:   activo ? 700 : 400,
                      border:       'none',
                      background:   'transparent',
                      cursor:       'pointer',
                      color:        activo ? 'var(--c-dark)' : 'rgba(35,22,81,0.38)',
                      borderBottom: activo ? '2px solid #2374ab' : '2px solid transparent',
                      marginBottom: -2,
                      letterSpacing: '0.02em',
                      transition:   'all 0.15s',
                    }}
                  >
                    {dia.etiqueta}
                  </button>
                )
              })}
            </div>

            {/* Bloques del día activo */}
            {diaData && (
              diaData.bloques.length === 0
                ? (
                  <p style={{ color: 'rgba(35,22,81,0.3)', fontSize: '0.9rem' }}>
                    Sin actividades programadas para este día.
                  </p>
                )
                : diaData.bloques.map((bloque, i) => (
                  <BloqueHorario
                    key={i}
                    bloque={bloque}
                    propuestas={propuestas}
                    invitados={invitados}
                  />
                ))
            )}
          </>
        )}

      </div>
    </main>
  )
}
