'use client'
// components/Programa.tsx
// Vista pública del programa de la jornada.
// Fuente de datos: colección 'actividades' (+ propuestas e invitados para resolver participantes).

import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import jsPDF     from 'jspdf'
import autoTable from 'jspdf-autotable'
import { useActividades } from '@/lib/hooks/useActividades'
import { usePropuestas }  from '@/lib/hooks/usePropuestas'
import { useInvitados }   from '@/lib/hooks/useInvitados'
import { CONGRESO }       from '@/congreso.config'
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
  conferencia: { border: '#2374ab', bg: '#eef5fb', rgb: [35, 116, 171] },
  panel:       { border: '#7c5cbf', bg: '#f3f0fb', rgb: [124, 92, 191] },
  mesa:        { border: '#e8a23a', bg: '#fdf6ec', rgb: [232, 162, 58]  },
  pósters:     { border: '#4dccbd', bg: '#edfaf8', rgb: [77, 204, 189]  },
  otro:        { border: '#6b7280', bg: '#f5f5f6', rgb: [107, 114, 128] },
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

type PartSimple = { nombre: string; institucion?: string; tituloPonencia?: string }

function participantesPanel(act: Actividad, propuesta?: Propuesta): PartSimple[] {
  if (propuesta) {
    const base: PartSimple[] = act.coordinador
      ? []
      : [{ nombre: propuesta.autor.nombre, institucion: propuesta.autor.institucion, tituloPonencia: propuesta.titulo }]
    const extras = (propuesta.participantes ?? []).map(p => ({
      nombre: p.nombre, institucion: p.institucion, tituloPonencia: p.tituloPonencia,
    }))
    return [...base, ...extras]
  }
  return (act.participantes ?? []).map(p => ({
    nombre: p.nombre, institucion: p.institucion, tituloPonencia: p.tituloPonencia,
  }))
}

// ── Micro-componentes ─────────────────────────────────────────

function Label({ children, color }: { children: ReactNode; color: string }) {
  return (
    <span style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color }}>
      {children}
    </span>
  )
}

function Hora({ act }: { act: Actividad }) {
  if (!act.horaInicio || !act.horaFin) return null
  return (
    <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(35,22,81,0.38)', flexShrink: 0 }}>
      {act.horaInicio} – {act.horaFin}
    </span>
  )
}

function SalaBadge({ sala }: { sala?: string }) {
  if (!sala) return null
  return (
    <span style={{ fontSize: '0.65rem', fontWeight: 600, padding: '1px 8px', background: 'rgba(35,22,81,0.06)', borderRadius: 12, color: 'rgba(35,22,81,0.45)' }}>
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
  act, esSolo, extra,
}: { act: Actividad; esSolo: boolean; extra?: ReactNode }) {
  const { border } = paleta(act.tipo)
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.3rem' }}>
        <Label color={border}>{tipoLabel(act)}</Label>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {extra}
          <Hora act={act} />
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

function LineaParticipante({ p, esSolo, borderColor }: {
  p:           PartSimple
  esSolo:      boolean
  borderColor: string
}) {
  return (
    <div style={{ paddingLeft: '0.85rem', borderLeft: `2px solid ${borderColor}55` }}>
      <p style={{ fontSize: '0.88rem', fontWeight: 600, margin: '0 0 0.08rem', color: 'var(--c-dark)' }}>
        {p.nombre}
      </p>
      {p.institucion && (
        <p style={{ fontSize: '0.75rem', color: 'rgba(35,22,81,0.45)', margin: '0 0 0.12rem' }}>
          {p.institucion}
        </p>
      )}
      {esSolo && p.tituloPonencia && (
        <p style={{ fontSize: '0.85rem', fontStyle: 'italic', color: 'rgba(35,22,81,0.62)', margin: 0, lineHeight: 1.45 }}>
          {p.tituloPonencia}
        </p>
      )}
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

// ── Tarjetas por tipo ─────────────────────────────────────────

function TarjetaConferencia({ act, invitado, esSolo }: {
  act: Actividad; invitado?: Invitado; esSolo: boolean
}) {
  const { border } = paleta('conferencia')
  const inner = (
    <>
      <CardHeader act={act} esSolo={esSolo} />

      {invitado && (
        <div style={{ marginBottom: esSolo ? '0.9rem' : 0 }}>
          <p style={{ fontSize: '0.95rem', fontWeight: 600, margin: '0 0 0.12rem', color: 'var(--c-dark)' }}>
            {invitado.nombre}
          </p>
          <p style={{ fontSize: '0.82rem', color: 'rgba(35,22,81,0.48)', margin: 0 }}>
            {[invitado.rol, invitado.institucion].filter(Boolean).join(' · ')}
          </p>
        </div>
      )}

      {esSolo && invitado?.bio && (
        <p style={{ fontSize: '0.9rem', color: 'rgba(35,22,81,0.62)', lineHeight: 1.65, margin: '0 0 0.85rem' }}>
          {invitado.bio}
        </p>
      )}

      {esSolo && act.resumen && (
        <>
          <Divisor label="Resumen" />
          <p style={{ fontSize: '0.9rem', color: 'rgba(35,22,81,0.62)', lineHeight: 1.65, margin: 0 }}>
            {act.resumen}
          </p>
        </>
      )}

      {act.moderador && <Moderador nombre={act.moderador} />}
    </>
  )

  // Cuando es solo + tiene foto: grid con foto a la izquierda
  if (esSolo && invitado?.foto) {
    return (
      <CardWrap tipo="conferencia" esSolo={esSolo}>
        <div style={{ display: 'grid', gridTemplateColumns: '116px 1fr', gap: '1.75rem', alignItems: 'start' }}>
          <img
            src={invitado.foto}
            alt={invitado.nombre}
            style={{ width: 116, height: 116, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${border}` }}
          />
          <div>{inner}</div>
        </div>
      </CardWrap>
    )
  }

  return <CardWrap tipo="conferencia" esSolo={esSolo}>{inner}</CardWrap>
}

function TarjetaPanel({ act, propuesta, esSolo }: {
  act: Actividad; propuesta?: Propuesta; esSolo: boolean
}) {
  const { border } = paleta('panel')
  const partes = participantesPanel(act, propuesta)

  return (
    <CardWrap tipo="panel" esSolo={esSolo}>
      <CardHeader act={act} esSolo={esSolo} extra={<SalaBadge sala={act.sala} />} />

      {act.coordinador && (
        <p style={{ fontSize: '0.78rem', color: 'rgba(35,22,81,0.48)', margin: '-0.4rem 0 0.75rem' }}>
          Coordinador/a: <strong>{act.coordinador}</strong>
        </p>
      )}

      {partes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: esSolo ? '0.9rem' : '0.45rem' }}>
          {partes.map((p, i) => (
            <LineaParticipante key={i} p={p} esSolo={esSolo} borderColor={border} />
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
      <CardHeader act={act} esSolo={esSolo} extra={<SalaBadge sala={act.sala} />} />

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

function TarjetaOtro({ act, esSolo }: { act: Actividad; esSolo: boolean }) {
  return (
    <CardWrap tipo="otro" esSolo={esSolo}>
      <CardHeader act={act} esSolo={esSolo} />
      {esSolo && act.descripcion && (
        <p style={{ fontSize: '0.9rem', color: 'rgba(35,22,81,0.6)', lineHeight: 1.6, margin: '0 0 0.6rem' }}>
          {act.descripcion}
        </p>
      )}
      {act.participantes && act.participantes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
          {act.participantes.map((p: ParticipantePanel, i: number) => (
            <p key={i} style={{ fontSize: '0.86rem', margin: 0, color: 'var(--c-dark)' }}>
              {p.nombre}
              {p.institucion && (
                <span style={{ fontWeight: 400, color: 'rgba(35,22,81,0.42)', marginLeft: '0.4rem' }}>
                  · {p.institucion}
                </span>
              )}
            </p>
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
  if (act.tipo === 'panel')       return <TarjetaPanel act={act} propuesta={propuesta} esSolo={esSolo} />
  if (act.tipo === 'mesa' || act.tipo === 'pósters') return <TarjetaMesa act={act} propuestas={propuestas} esSolo={esSolo} />
  return <TarjetaOtro act={act} esSolo={esSolo} />
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
      {/* Franja horaria */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.85rem' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(35,22,81,0.35)', flexShrink: 0 }}>
          {bloque.horaInicio} – {bloque.horaFin}
        </span>
        <div style={{ flex: 1, height: 1, background: 'rgba(35,22,81,0.1)' }} />
      </div>

      {/* Headers de sala */}
      {salas.some(s => !!s) && (
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem' }}>
          {salas.map(sala => (
            <div key={sala} style={{
              flex: 1,
              fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase',
              letterSpacing: '0.1em', color: 'rgba(35,22,81,0.38)',
              textAlign: 'center', paddingBottom: '0.4rem',
              borderBottom: '2px solid rgba(35,22,81,0.08)',
            }}>
              {sala || '—'}
            </div>
          ))}
        </div>
      )}

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

function buildPDF(
  actividades: Actividad[],
  propuestas:  Propuesta[],
  invitados:   Invitado[],
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const buildContenido = (act: Actividad): string => {
    const lines: string[] = []

    if (act.tipo === 'conferencia') {
      const inv = act.invitadoId ? invitados.find(i => i.id === act.invitadoId) : null
      if (inv) lines.push(inv.nombre + (inv.institucion ? '\n' + inv.institucion : ''))
    } else if (act.tipo === 'panel') {
      if (act.coordinador) lines.push('Coord.: ' + act.coordinador)
      const prop  = propuestas.find(p => p.actividadId === act.id)
      const parts = prop
        ? [prop.autor, ...(prop.participantes ?? [])]
        : (act.participantes ?? [])
      parts.forEach(p => {
        lines.push('· ' + p.nombre + (p.institucion ? ' · ' + p.institucion : ''))
      })
    } else if (act.tipo === 'mesa' || act.tipo === 'pósters') {
      const asignadas = propuestas.filter(p => p.actividadId === act.id)
      asignadas.forEach(prop => {
        const autores = [prop.autor, ...(prop.coautores ?? [])].map(a => a.nombre).join(', ')
        lines.push('· ' + autores + ': ' + prop.titulo)
      })
    } else {
      if (act.descripcion) lines.push(act.descripcion)
      ;(act.participantes ?? []).forEach(p => lines.push('· ' + p.nombre))
    }

    if (act.moderador) lines.push('Modera: ' + act.moderador)
    return lines.join('\n')
  }

  FECHAS.forEach((dia, idx) => {
    if (idx > 0) doc.addPage()

    // Encabezado del día
    doc.setFillColor(35, 22, 81)
    doc.rect(0, 0, 210, 14, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(255, 255, 255)
    doc.text(dia.etiqueta, 10, 9.5)

    // Subtítulo
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(180, 180, 200)
    doc.text('JORNADAS: LA IA EN DEBATE · FHyA UNR 2026', 10, 12.5)

    const actsDelDia = actividades
      .filter(a => a.fecha === dia.valor && a.horaInicio && a.mostrar !== false)
      .sort((a, b) => (a.horaInicio ?? '').localeCompare(b.horaInicio ?? ''))

    if (actsDelDia.length === 0) {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(160, 160, 160)
      doc.text('Sin actividades programadas.', 10, 24)
      return
    }

    const rows = actsDelDia.map(act => [
      act.horaInicio && act.horaFin ? `${act.horaInicio}\n${act.horaFin}` : (act.horaInicio ?? ''),
      act.sala ?? '',
      tipoLabel(act),
      act.titulo + (buildContenido(act) ? '\n' + buildContenido(act) : ''),
    ])

    autoTable(doc, {
      startY:     18,
      head:       [['Hora', 'Sala', 'Tipo', 'Actividad']],
      body:       rows,
      styles:     { fontSize: 8, cellPadding: 3, valign: 'top', overflow: 'linebreak' },
      headStyles: { fillColor: [35, 22, 81], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
        1: { cellWidth: 30 },
        2: { cellWidth: 32 },
        3: { cellWidth: 'auto' },
      },
      didParseCell: data => {
        if (data.section === 'body' && data.column.index === 2) {
          const act = actsDelDia[data.row.index]
          const rgb = paleta(act?.tipo ?? 'otro').rgb
          data.cell.styles.textColor = rgb
          data.cell.styles.fontStyle  = 'bold'
        }
        if (data.section === 'body' && data.column.index === 3) {
          data.cell.styles.fontStyle = 'bold'
          // Resto del contenido en normal — no se puede mezclar en autotable,
          // así que solo se resalta el título (primera línea) via fontStyle
        }
      },
      margin: { left: 10, right: 10 },
    })
  })

  doc.save(`programa-jia-${new Date().toISOString().slice(0, 10)}.pdf`)
}

// ── Componente principal ──────────────────────────────────────

export default function Programa() {
  const { actividades, loading: loadActs } = useActividades()
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

  const diaData = programaPorDia.find(d => d.valor === diaActivo)
  const hayPrograma = !loading && actividades.some(a => a.fecha)

  return (
    <main className="page">
      <div className="section">

        {/* Encabezado */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem', flexWrap: 'wrap', gap: '1rem' }}>
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

        {loading && (
          <p style={{ color: 'rgba(35,22,81,0.3)', fontSize: '0.9rem' }}>Cargando programa...</p>
        )}

        {!loading && !hayPrograma && (
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
